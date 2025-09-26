import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

interface MatchRequest {
  agent_id: string;
  service_category: string;
  budget?: number;
  urgency?: 'low' | 'medium' | 'high';
  location?: string;
  specific_requirements?: Record<string, any>;
}

interface VendorRule {
  id: string;
  vendor_id: string;
  service_categories: string[];
  min_budget?: number;
  max_budget?: number;
  location_restrictions?: string[];
  capacity_limit: number;
  priority_score: number;
  is_active: boolean;
}

interface MatchCandidate {
  vendor_id: string;
  vendor_name: string;
  match_score: number;
  match_reasons: string[];
  estimated_response_time: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'create_request':
        return await handleCreateRequest(data);
      case 'find_matches':
        return await handleFindMatches(data);
      case 'route_to_vendor':
        return await handleRouteToVendor(data);
      case 'vendor_decision':
        return await handleVendorDecision(data);
      case 'get_request_status':
        return await handleGetRequestStatus(data);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Match engine error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCreateRequest(requestData: MatchRequest) {
  console.log('Creating new match request:', requestData);

  // Insert request into database
  const { data: request, error: requestError } = await supabase
    .from('request')
    .insert({
      agent_id: requestData.agent_id,
      service_category: requestData.service_category,
      budget: requestData.budget,
      urgency: requestData.urgency || 'medium',
      location: requestData.location,
      specific_requirements: requestData.specific_requirements || {},
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (requestError) {
    console.error('Error creating request:', requestError);
    throw new Error('Failed to create request');
  }

  // Automatically find matches
  const matches = await findMatchingVendors(request);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      request_id: request.id,
      matches: matches.length,
      message: `Request created successfully. Found ${matches.length} potential matches.`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleFindMatches(data: { request_id: string }) {
  console.log('Finding matches for request:', data.request_id);

  // Get request details
  const { data: request, error: requestError } = await supabase
    .from('request')
    .select('*')
    .eq('id', data.request_id)
    .single();

  if (requestError || !request) {
    throw new Error('Request not found');
  }

  const matches = await findMatchingVendors(request);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      matches,
      request_id: data.request_id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function findMatchingVendors(request: any): Promise<MatchCandidate[]> {
  console.log('Finding matching vendors for request:', request.id);

  // Get active vendor rules that match the service category
  const { data: vendorRules, error: rulesError } = await supabase
    .from('vendor_rule')
    .select(`
      *,
      vendors!inner(id, name, is_active, rating, response_time_avg)
    `)
    .eq('is_active', true)
    .contains('service_categories', [request.service_category]);

  if (rulesError) {
    console.error('Error fetching vendor rules:', rulesError);
    return [];
  }

  const candidates: MatchCandidate[] = [];

  for (const rule of vendorRules || []) {
    if (!rule.vendors?.is_active) continue;

    let matchScore = rule.priority_score || 50;
    const matchReasons: string[] = [];

    // Budget matching
    if (request.budget) {
      if (rule.min_budget && request.budget >= rule.min_budget) {
        matchScore += 10;
        matchReasons.push('Budget meets minimum requirement');
      }
      if (rule.max_budget && request.budget <= rule.max_budget) {
        matchScore += 10;
        matchReasons.push('Budget within vendor range');
      }
    }

    // Location matching
    if (request.location && rule.location_restrictions?.length) {
      if (rule.location_restrictions.includes(request.location)) {
        matchScore += 15;
        matchReasons.push('Serves your location');
      } else {
        matchScore -= 20; // Penalty for location mismatch
      }
    }

    // Urgency boost
    if (request.urgency === 'high') {
      matchScore += 5;
    }

    // Vendor rating boost
    if (rule.vendors.rating > 4.0) {
      matchScore += 5;
      matchReasons.push('Highly rated vendor');
    }

    // Check vendor capacity
    const { data: activeMatches } = await supabase
      .from('match_candidate')
      .select('id')
      .eq('vendor_id', rule.vendor_id)
      .eq('status', 'active');

    if ((activeMatches?.length || 0) >= rule.capacity_limit) {
      continue; // Skip if vendor is at capacity
    }

    if (matchScore >= 40) { // Minimum threshold
      candidates.push({
        vendor_id: rule.vendor_id,
        vendor_name: rule.vendors.name,
        match_score: Math.min(matchScore, 100),
        match_reasons: matchReasons,
        estimated_response_time: rule.vendors.response_time_avg || '24 hours'
      });
    }
  }

  // Sort by match score and store candidates
  candidates.sort((a, b) => b.match_score - a.match_score);

  // Store match candidates in database
  for (const candidate of candidates.slice(0, 5)) { // Top 5 matches
    await supabase
      .from('match_candidate')
      .insert({
        request_id: request.id,
        vendor_id: candidate.vendor_id,
        match_score: candidate.match_score,
        match_reasons: candidate.match_reasons,
        status: 'pending',
        created_at: new Date().toISOString()
      });
  }

  return candidates;
}

async function handleRouteToVendor(data: { match_candidate_id: string }) {
  console.log('Routing to vendor:', data.match_candidate_id);

  // Get match candidate details
  const { data: candidate, error: candidateError } = await supabase
    .from('match_candidate')
    .select(`
      *,
      request(*),
      vendors(*)
    `)
    .eq('id', data.match_candidate_id)
    .single();

  if (candidateError || !candidate) {
    throw new Error('Match candidate not found');
  }

  // Create routing record
  const { data: routing, error: routingError } = await supabase
    .from('match_routing')
    .insert({
      match_candidate_id: data.match_candidate_id,
      vendor_id: candidate.vendor_id,
      routing_method: 'automatic',
      routed_at: new Date().toISOString(),
      status: 'routed'
    })
    .select()
    .single();

  if (routingError) {
    console.error('Error creating routing:', routingError);
    throw new Error('Failed to route to vendor');
  }

  // Update match candidate status
  await supabase
    .from('match_candidate')
    .update({ status: 'routed' })
    .eq('id', data.match_candidate_id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      routing_id: routing.id,
      message: 'Successfully routed to vendor'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleVendorDecision(data: { 
  routing_id: string;
  vendor_id: string;
  decision: 'accept' | 'decline';
  response_message?: string;
  estimated_delivery?: string;
}) {
  console.log('Processing vendor decision:', data);

  // Create vendor decision record
  const { data: decision, error: decisionError } = await supabase
    .from('vendor_decision')
    .insert({
      routing_id: data.routing_id,
      vendor_id: data.vendor_id,
      decision: data.decision,
      response_message: data.response_message,
      estimated_delivery: data.estimated_delivery,
      decided_at: new Date().toISOString()
    })
    .select()
    .single();

  if (decisionError) {
    console.error('Error creating vendor decision:', decisionError);
    throw new Error('Failed to record vendor decision');
  }

  // Update routing status
  await supabase
    .from('match_routing')
    .update({ 
      status: data.decision === 'accept' ? 'accepted' : 'declined',
      vendor_response_at: new Date().toISOString()
    })
    .eq('id', data.routing_id);

  // If declined, try next best match
  if (data.decision === 'decline') {
    // Find next available candidate for the same request
    const { data: routing } = await supabase
      .from('match_routing')
      .select('match_candidate_id, match_candidate(request_id)')
      .eq('id', data.routing_id)
      .single();

    if (routing?.match_candidate?.request_id) {
      const { data: nextCandidate } = await supabase
        .from('match_candidate')
        .select('*')
        .eq('request_id', routing.match_candidate.request_id)
        .eq('status', 'pending')
        .order('match_score', { ascending: false })
        .limit(1)
        .single();

      if (nextCandidate) {
        // Auto-route to next best match
        await handleRouteToVendor({ match_candidate_id: nextCandidate.id });
      }
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      decision_id: decision.id,
      message: `Vendor decision recorded: ${data.decision}`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetRequestStatus(data: { request_id: string }) {
  console.log('Getting request status:', data.request_id);

  const { data: request, error: requestError } = await supabase
    .from('request')
    .select(`
      *,
      match_candidate(
        *,
        vendors(name, rating),
        match_routing(
          *,
          vendor_decision(*)
        )
      )
    `)
    .eq('id', data.request_id)
    .single();

  if (requestError || !request) {
    throw new Error('Request not found');
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      request,
      status: request.status,
      candidates: request.match_candidate || []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}