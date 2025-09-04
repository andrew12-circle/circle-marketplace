import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SessionData {
  sessionId: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  locationData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, ...body } = await req.json()
    const clientIP = req.headers.get('CF-Connecting-IP') || 
                    req.headers.get('X-Forwarded-For') || 
                    req.headers.get('X-Real-IP') || 
                    '127.0.0.1'

    switch (action) {
      case 'start': {
        const { sessionId, deviceFingerprint, userAgent, locationData } = body as SessionData
        
        // Get app config for session limits
        const { data: config } = await supabase
          .from('app_config')
          .select('max_concurrent_sessions, session_enforcement_mode')
          .single()

        const maxSessions = config?.max_concurrent_sessions || 3
        const enforcementMode = config?.session_enforcement_mode || 'warn'

        // Check existing active sessions
        const { data: existingSessions, error: sessionError } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (sessionError) {
          console.error('Error checking sessions:', sessionError)
        }

        const activeSessionCount = existingSessions?.length || 0
        
        // Check if this session already exists
        const existingSession = existingSessions?.find(s => s.session_id === sessionId)
        
        if (existingSession) {
          // Update existing session activity
          const { error: updateError } = await supabase
            .from('user_sessions')
            .update({ 
              last_activity: new Date().toISOString(),
              ip_address: clientIP,
              user_agent: userAgent 
            })
            .eq('id', existingSession.id)

          return new Response(
            JSON.stringify({ 
              success: true, 
              sessionExists: true,
              activeSessions: activeSessionCount,
              maxSessions 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Handle session limits
        if (activeSessionCount >= maxSessions) {
          if (enforcementMode === 'block') {
            return new Response(
              JSON.stringify({ 
                error: 'Maximum concurrent sessions exceeded',
                activeSessions: activeSessionCount,
                maxSessions,
                existingSessions: existingSessions?.map(s => ({
                  id: s.id,
                  ip_address: s.ip_address,
                  user_agent: s.user_agent,
                  last_activity: s.last_activity
                }))
              }),
              { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } else if (enforcementMode === 'kick_oldest') {
            // Find oldest session and deactivate it
            const oldestSession = existingSessions
              ?.sort((a, b) => new Date(a.last_activity).getTime() - new Date(b.last_activity).getTime())[0]
            
            if (oldestSession) {
              await supabase
                .from('user_sessions')
                .update({ is_active: false })
                .eq('id', oldestSession.id)
            }
          }
        }

        // Create new session record
        const { data: newSession, error: insertError } = await supabase
          .from('user_sessions')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            device_fingerprint: deviceFingerprint,
            ip_address: clientIP,
            user_agent: userAgent,
            location_data: locationData || {},
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating session:', insertError)
          return new Response(
            JSON.stringify({ error: 'Failed to create session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            session: newSession,
            activeSessions: activeSessionCount + 1,
            maxSessions,
            warning: activeSessionCount >= maxSessions && enforcementMode === 'warn' ? 
              'Multiple active sessions detected' : null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'heartbeat': {
        const { sessionId } = body
        
        const { error: updateError } = await supabase
          .from('user_sessions')
          .update({ 
            last_activity: new Date().toISOString(),
            ip_address: clientIP
          })
          .eq('session_id', sessionId)
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Error updating heartbeat:', updateError)
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'end': {
        const { sessionId } = body
        
        const { error: deactivateError } = await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('session_id', sessionId)
          .eq('user_id', user.id)

        if (deactivateError) {
          console.error('Error ending session:', deactivateError)
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'list': {
        const { data: sessions, error: listError } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('last_activity', { ascending: false })

        if (listError) {
          console.error('Error listing sessions:', listError)
          return new Response(
            JSON.stringify({ error: 'Failed to list sessions' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ sessions }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'revoke': {
        const { sessionIds } = body
        
        if (!Array.isArray(sessionIds)) {
          return new Response(
            JSON.stringify({ error: 'sessionIds must be an array' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: revokeError } = await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .in('session_id', sessionIds)

        if (revokeError) {
          console.error('Error revoking sessions:', revokeError)
          return new Response(
            JSON.stringify({ error: 'Failed to revoke sessions' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Session control error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})