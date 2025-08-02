import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityAlert {
  type: 'rate_limit_exceeded' | 'suspicious_activity' | 'failed_authentication' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  details: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action, data } = await req.json()

    switch (action) {
      case 'analyze_threat':
        return await analyzeThreat(supabaseClient, data)
      
      case 'get_security_summary':
        return await getSecuritySummary(supabaseClient)
      
      case 'handle_incident':
        return await handleSecurityIncident(supabaseClient, data)
      
      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Security monitor error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function analyzeThreat(supabase: any, threatData: any) {
  console.log('Analyzing security threat:', threatData)
  
  // Get recent security events for pattern analysis
  const { data: recentEvents, error } = await supabase
    .from('security_events')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) {
    throw new Error(`Failed to fetch security events: ${error.message}`)
  }

  // Analyze patterns
  const analysis = {
    total_events: recentEvents.length,
    events_by_type: {},
    suspicious_users: [],
    risk_score: 0,
    recommendations: []
  }

  // Count events by type
  recentEvents.forEach(event => {
    analysis.events_by_type[event.event_type] = 
      (analysis.events_by_type[event.event_type] || 0) + 1
  })

  // Identify suspicious patterns
  const userEventCounts = {}
  recentEvents.forEach(event => {
    if (event.user_id) {
      userEventCounts[event.user_id] = (userEventCounts[event.user_id] || 0) + 1
    }
  })

  // Flag users with excessive activity (>50 events in 24h)
  Object.entries(userEventCounts).forEach(([userId, count]) => {
    if (count > 50) {
      analysis.suspicious_users.push({
        user_id: userId,
        event_count: count,
        risk_level: count > 100 ? 'high' : 'medium'
      })
    }
  })

  // Calculate risk score
  analysis.risk_score = Math.min(100, 
    (analysis.suspicious_users.length * 10) + 
    ((analysis.events_by_type['failed_login'] || 0) / 10) +
    ((analysis.events_by_type['privilege_escalation_attempt'] || 0) * 20)
  )

  // Generate recommendations
  if (analysis.risk_score > 70) {
    analysis.recommendations.push('CRITICAL: Immediate security review required')
    analysis.recommendations.push('Consider temporarily restricting high-risk user accounts')
  } else if (analysis.risk_score > 40) {
    analysis.recommendations.push('Enhanced monitoring recommended')
    analysis.recommendations.push('Review and update security policies')
  }

  // Log the analysis
  await supabase.from('security_events').insert({
    event_type: 'security_analysis_completed',
    event_data: {
      analysis,
      timestamp: new Date().toISOString(),
      analyzed_events_count: recentEvents.length
    }
  })

  return new Response(
    JSON.stringify({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

async function getSecuritySummary(supabase: any) {
  console.log('Generating security summary')

  // Get security metrics for the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const { data: events, error } = await supabase
    .from('security_events')
    .select('event_type, created_at, user_id')
    .gte('created_at', oneDayAgo)

  if (error) {
    throw new Error(`Failed to fetch security events: ${error.message}`)
  }

  const summary = {
    total_events: events.length,
    critical_events: 0,
    unique_users: new Set(),
    event_types: {},
    trends: {
      increasing: [],
      decreasing: []
    },
    last_updated: new Date().toISOString()
  }

  // Process events
  events.forEach(event => {
    if (event.user_id) {
      summary.unique_users.add(event.user_id)
    }
    
    summary.event_types[event.event_type] = 
      (summary.event_types[event.event_type] || 0) + 1

    // Count critical events
    if (event.event_type.includes('escalation') || 
        event.event_type.includes('unauthorized') ||
        event.event_type.includes('violation')) {
      summary.critical_events++
    }
  })

  summary.unique_users = summary.unique_users.size

  return new Response(
    JSON.stringify({
      success: true,
      summary,
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

async function handleSecurityIncident(supabase: any, incidentData: any) {
  console.log('Handling security incident:', incidentData)

  const { incident_type, severity, user_id, details } = incidentData

  // Create incident record
  const { data: incident, error: incidentError } = await supabase
    .from('security_events')
    .insert({
      event_type: 'security_incident_reported',
      user_id: user_id || null,
      event_data: {
        incident_type,
        severity,
        details,
        timestamp: new Date().toISOString(),
        status: 'open'
      }
    })
    .select()
    .single()

  if (incidentError) {
    throw new Error(`Failed to create incident record: ${incidentError.message}`)
  }

  // Auto-response based on severity
  let response_actions = []

  if (severity === 'critical') {
    // For critical incidents, disable the user account if user_id provided
    if (user_id) {
      // Log account suspension
      await supabase.from('security_events').insert({
        event_type: 'account_suspended_auto',
        user_id,
        event_data: {
          reason: 'Critical security incident',
          incident_id: incident.id,
          timestamp: new Date().toISOString()
        }
      })
      response_actions.push('User account suspended')
    }
    response_actions.push('Security team notified')
  } else if (severity === 'high') {
    // For high severity, increase monitoring
    response_actions.push('Enhanced monitoring activated')
    if (user_id) {
      response_actions.push('User flagged for review')
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      incident_id: incident.id,
      response_actions,
      message: 'Security incident processed',
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}