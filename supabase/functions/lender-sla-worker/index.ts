import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function auditLog(supabase: any, action: string, entity_id: string, meta: any) {
  await supabase.from('lender_audit_log').insert({
    actor: 'system',
    action,
    entity: 'lender_request',
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
    
    let expiredCount = 0;
    let autoApprovedCount = 0;
    let remindersCreated = 0;

    // Find requests awaiting vendor response for > 24 hours with no decision
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: expiredRequests, error: expiredError } = await supabase
      .from('lender_request')
      .select(`
        *,
        lender_vendor_decision(*)
      `)
      .eq('status', 'awaiting_vendor')
      .lt('created_at', twentyFourHoursAgo);

    if (expiredError) {
      throw new Error(`Failed to fetch expired requests: ${expiredError.message}`);
    }

    // Process expired requests
    for (const request of expiredRequests || []) {
      const hasDecision = request.lender_vendor_decision && request.lender_vendor_decision.length > 0;
      
      if (!hasDecision) {
        // Check for auto-approval
        const { data: vendorRule } = await supabase
          .from('lender_vendor_rule')
          .select('auto_approve_threshold')
          .in('vendor_org_id', 
            // Get vendor org from routing
            await supabase
              .from('lender_match_routing')
              .select('vendor_org_id')
              .eq('request_id', request.id)
              .then(r => r.data?.map(d => d.vendor_org_id) || [])
          )
          .single();

        const autoThreshold = vendorRule?.auto_approve_threshold;
        
        if (autoThreshold && request.requested_vendor_share <= autoThreshold) {
          // Auto-approve
          const { data: routing } = await supabase
            .from('lender_match_routing')
            .select('vendor_org_id')
            .eq('request_id', request.id)
            .single();

          if (routing) {
            await supabase.from('lender_vendor_decision').insert({
              request_id: request.id,
              vendor_org_id: routing.vendor_org_id,
              proposed_share: request.requested_vendor_share,
              decision: 'approved',
              decision_reason: 'Auto-approved under threshold',
              decided_by: null,
              decided_at: new Date().toISOString()
            });

            await supabase
              .from('lender_request')
              .update({ status: 'approved' })
              .eq('id', request.id);

            await auditLog(supabase, 'sla.auto_approved', request.id, {
              threshold: autoThreshold,
              requested_share: request.requested_vendor_share
            });

            autoApprovedCount++;
          }
        } else {
          // Expire the request
          await supabase
            .from('lender_request')
            .update({ status: 'expired' })
            .eq('id', request.id);

          await auditLog(supabase, 'sla.expired', request.id, {
            hours_elapsed: 24
          });

          expiredCount++;
        }
      }
    }

    // Find requests needing 2-hour reminders
    const { data: reminderRequests, error: reminderError } = await supabase
      .from('lender_request')
      .select(`
        *,
        lender_match_routing(*),
        lender_vendor_decision(*)
      `)
      .eq('status', 'awaiting_vendor')
      .lt('created_at', twoHoursAgo)
      .gt('created_at', twentyFourHoursAgo);

    if (reminderError) {
      throw new Error(`Failed to fetch reminder requests: ${reminderError.message}`);
    }

    // Create reminder notifications
    for (const request of reminderRequests || []) {
      const hasDecision = request.lender_vendor_decision && request.lender_vendor_decision.length > 0;
      
      if (!hasDecision && request.lender_match_routing) {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from('lender_notif_event')
          .select('id')
          .eq('request_id', request.id)
          .contains('payload', { reminder: true })
          .limit(1);

        if (!existingReminder || existingReminder.length === 0) {
          const routing = request.lender_match_routing[0];
          
          // Create reminder notifications
          const reminderNotifications = [
            {
              request_id: request.id,
              vendor_org_id: routing.vendor_org_id,
              lo_id: routing.lo_id,
              channel: 'email',
              status: 'pending',
              payload: {
                reminder: true,
                urgency: 'high',
                hours_remaining: 22 // 24 - 2
              }
            },
            {
              request_id: request.id,
              vendor_org_id: routing.vendor_org_id,
              lo_id: routing.lo_id,
              channel: 'sms',
              status: 'pending',
              payload: {
                reminder: true,
                urgency: 'high',
                hours_remaining: 22
              }
            }
          ];

          await supabase.from('lender_notif_event').insert(reminderNotifications);

          await auditLog(supabase, 'sla.reminder_created', request.id, {
            hours_elapsed: 2,
            notifications_created: 2
          });

          remindersCreated += 2;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      expired: expiredCount,
      auto_approved: autoApprovedCount,
      reminders_created: remindersCreated,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('SLA worker error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});