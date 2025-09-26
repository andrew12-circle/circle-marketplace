import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface MatchRequest {
  request_id: string;
}

interface VendorRule {
  id: string;
  vendor_org_id: string;
  min_buyers_12mo: number;
  min_units_12mo: number;
  geo_scope: string;
  states: string[] | null;
  msas: string[] | null;
  zips: string[] | null;
  auto_approve_threshold: number | null;
}

interface VendorRoster {
  id: string;
  vendor_org_id: string;
  name: string;
  email: string;
  phone: string;
  geo_point: any;
  review_avg: number | null;
  review_count: number;
  is_active: boolean;
}

interface MatchCandidate {
  vendor_org_id: string;
  eligibility: 'eligible' | 'ineligible';
  ineligible_reason?: string;
  rank_score: number;
}

// Calculate Haversine distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function auditLog(supabase: any, actor: string, action: string, entity: string, entity_id: string, meta: any) {
  await supabase.from('lender_audit_log').insert({
    actor,
    action,
    entity,
    entity_id,
    meta
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { request_id }: MatchRequest = await req.json();

    await auditLog(supabase, 'system', 'match.started', 'lender_request', request_id, { request_id });

    // Get request details with agent snapshot
    const { data: request, error: requestError } = await supabase
      .from('lender_request')
      .select(`
        *,
        lender_request_snapshot(*)
      `)
      .eq('id', request_id)
      .eq('status', 'searching')
      .single();

    if (requestError || !request) {
      throw new Error(`Request not found or not in searching status: ${requestError?.message}`);
    }

    // Extract agent location
    const agentLat = request.agent_latlon?.coordinates[1];
    const agentLon = request.agent_latlon?.coordinates[0];
    
    if (!agentLat || !agentLon) {
      throw new Error('Agent location not provided');
    }

    // Get agent stats from snapshot
    const agentStats = request.lender_request_snapshot[0]?.agent_stats_json || {};
    const buyersLastYear = agentStats.buyers_12mo || 0;
    const totalUnits = agentStats.total_units || 0;

    // Get all vendor rules
    const { data: vendorRules, error: rulesError } = await supabase
      .from('lender_vendor_rule')
      .select('*');

    if (rulesError) {
      throw new Error(`Failed to fetch vendor rules: ${rulesError.message}`);
    }

    const eligibleVendors: MatchCandidate[] = [];
    const ineligibleVendors: MatchCandidate[] = [];

    // Process each vendor
    for (const rule of vendorRules || []) {
      let eligibility: 'eligible' | 'ineligible' = 'eligible';
      let ineligibleReason = '';

      // Check production gates
      if (buyersLastYear < rule.min_buyers_12mo) {
        eligibility = 'ineligible';
        ineligibleReason = `Insufficient buyers: ${buyersLastYear} < ${rule.min_buyers_12mo}`;
      } else if (totalUnits < rule.min_units_12mo) {
        eligibility = 'ineligible';
        ineligibleReason = `Insufficient units: ${totalUnits} < ${rule.min_units_12mo}`;
      }

      // TODO: Check geo gates based on rule.geo_scope, states, msas, zips
      // For now, assume all locations are eligible for national scope

      // TODO: Check SKU policy

      // Get vendor roster for distance calculation
      const { data: roster } = await supabase
        .from('lender_vendor_roster')
        .select('*')
        .eq('vendor_org_id', rule.vendor_org_id)
        .eq('is_active', true);

      if (!roster || roster.length === 0) {
        eligibility = 'ineligible';
        ineligibleReason = 'No active LOs available';
      }

      // Calculate rank score (inverse distance with review bump)
      let rankScore = 0;
      if (roster && roster.length > 0) {
        // Find nearest LO
        let minDistance = Infinity;
        for (const lo of roster) {
          if (lo.geo_point?.coordinates) {
            const distance = calculateDistance(
              agentLat, agentLon,
              lo.geo_point.coordinates[1], lo.geo_point.coordinates[0]
            );
            minDistance = Math.min(minDistance, distance);
          }
        }
        
        if (minDistance < Infinity) {
          rankScore = 1000 / (minDistance + 1); // Inverse distance
          // Add review boost
          const avgReview = roster[0]?.review_avg || 0;
          rankScore += avgReview * 10;
        }
      }

      const candidate: MatchCandidate = {
        vendor_org_id: rule.vendor_org_id,
        eligibility,
        ineligible_reason: eligibility === 'ineligible' ? ineligibleReason : undefined,
        rank_score: rankScore
      };

      if (eligibility === 'eligible') {
        eligibleVendors.push(candidate);
      } else {
        ineligibleVendors.push(candidate);
      }
    }

    await auditLog(supabase, 'system', 'match.eligible', 'lender_request', request_id, {
      eligible_count: eligibleVendors.length,
      ineligible_count: ineligibleVendors.length
    });

    // Insert all match candidates
    const allCandidates = [...eligibleVendors, ...ineligibleVendors].map(candidate => ({
      request_id,
      ...candidate
    }));

    if (allCandidates.length > 0) {
      await supabase.from('lender_match_candidate').insert(allCandidates);
    }

    // Select top eligible vendor for routing
    if (eligibleVendors.length > 0) {
      const topVendor = eligibleVendors.sort((a, b) => b.rank_score - a.rank_score)[0];
      
      // Get best LO for routing
      const { data: vendorRoster } = await supabase
        .from('lender_vendor_roster')
        .select('*')
        .eq('vendor_org_id', topVendor.vendor_org_id)
        .eq('is_active', true)
        .order('review_avg', { ascending: false })
        .order('review_count', { ascending: false })
        .order('name', { ascending: true })
        .limit(1)
        .single();

      if (vendorRoster) {
        // Calculate distance for routing
        const distance = calculateDistance(
          agentLat, agentLon,
          vendorRoster.geo_point?.coordinates[1] || 0,
          vendorRoster.geo_point?.coordinates[0] || 0
        );

        // Insert routing decision
        await supabase.from('lender_match_routing').insert({
          request_id,
          vendor_org_id: topVendor.vendor_org_id,
          lo_id: vendorRoster.id,
          routing_reason: 'nearest',
          distance_km: distance
        });

        await auditLog(supabase, 'system', 'match.routed', 'lender_request', request_id, {
          selected_vendor: topVendor.vendor_org_id,
          selected_lo: vendorRoster.id
        });

        // Update request status to awaiting_vendor
        await supabase
          .from('lender_request')
          .update({ status: 'awaiting_vendor' })
          .eq('id', request_id);

        // Create notification events
        const notifications = [
          {
            request_id,
            vendor_org_id: topVendor.vendor_org_id,
            lo_id: vendorRoster.id,
            channel: 'email',
            status: 'pending',
            payload: {
              recipient_email: vendorRoster.email,
              agent_id: request.agent_id,
              requested_share: request.requested_vendor_share
            }
          },
          {
            request_id,
            vendor_org_id: topVendor.vendor_org_id,
            lo_id: vendorRoster.id,
            channel: 'sms',
            status: 'pending',
            payload: {
              recipient_phone: vendorRoster.phone,
              agent_id: request.agent_id,
              requested_share: request.requested_vendor_share
            }
          }
        ];

        await supabase.from('lender_notif_event').insert(notifications);

        await auditLog(supabase, 'system', 'match.awaiting_vendor', 'lender_request', request_id, {
          notifications_created: notifications.length
        });

        return new Response(JSON.stringify({
          success: true,
          request_id,
          selected_vendor_org_id: topVendor.vendor_org_id,
          lo_id: vendorRoster.id,
          eligible_vendors: eligibleVendors.length,
          ineligible_vendors: ineligibleVendors.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // No eligible vendors found
    await supabase
      .from('lender_request')
      .update({ status: 'expired' })
      .eq('id', request_id);

    return new Response(JSON.stringify({
      success: false,
      request_id,
      eligible_vendors: 0,
      ineligible_vendors: ineligibleVendors.length,
      message: 'No eligible vendors found'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Match engine error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});