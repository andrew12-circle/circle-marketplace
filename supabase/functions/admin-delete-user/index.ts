import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { corsHeaders } from '../_shared/cors.ts'

interface DeleteUserRequest {
  userId: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: user, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { userId }: DeleteUserRequest = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === user.user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete all related records first to avoid foreign key constraints
    try {
      // Delete from tables that reference user_id
      await Promise.all([
        // Security events
        supabaseAdmin.from('security_events').delete().eq('user_id', userId),
        // Admin sessions
        supabaseAdmin.from('admin_sessions').delete().eq('user_id', userId),
        // Channel subscriptions
        supabaseAdmin.from('channel_subscriptions').delete().eq('user_id', userId),
        // Comment likes
        supabaseAdmin.from('comment_likes').delete().eq('user_id', userId),
        // Consultation bookings
        supabaseAdmin.from('consultation_bookings').delete().eq('user_id', userId),
        // AI interaction logs
        supabaseAdmin.from('ai_interaction_logs').delete().eq('user_id', userId),
        // AI recommendation log
        supabaseAdmin.from('ai_recommendation_log').delete().eq('user_id', userId),
        // Client errors
        supabaseAdmin.from('client_errors').delete().eq('user_id', userId)
      ])

      // Delete agent records if exists
      const { data: agent } = await supabaseAdmin
        .from('agents')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (agent) {
        await Promise.all([
          supabaseAdmin.from('agent_performance_tracking').delete().eq('agent_id', agent.id),
          supabaseAdmin.from('agent_quiz_responses').delete().eq('agent_id', agent.id),
          supabaseAdmin.from('agent_transactions').delete().eq('agent_id', agent.id),
          supabaseAdmin.from('agent_relationships').delete().or(`agent_a_id.eq.${agent.id},agent_b_id.eq.${agent.id}`),
          supabaseAdmin.from('co_pay_requests').delete().eq('agent_id', userId),
          supabaseAdmin.from('agents').delete().eq('user_id', userId)
        ])
      }

      // Delete vendor records if exists  
      await supabaseAdmin.from('co_pay_requests').delete().eq('vendor_id', userId)
      await supabaseAdmin.from('vendors').delete().eq('id', userId)

      // Finally delete the profile record
      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('user_id', userId)

      if (profileDeleteError) {
        console.error('Error deleting profile:', profileDeleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to delete user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Then delete the auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (deleteError) {
        console.error('Error deleting user from auth:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to delete user from authentication' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
      return new Response(
        JSON.stringify({ error: 'Failed to cleanup user data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})