import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting questionnaire save function')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceRole: !!serviceRoleKey,
      hasAnonKey: !!anonKey
    })
    
    const supabaseClient = createClient(supabaseUrl ?? '', serviceRoleKey ?? '')

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    console.log('Auth header present:', !!authHeader)
    
    // Verify user with anon client first
    const anonClient = createClient(supabaseUrl ?? '', anonKey ?? '')
    
    const { data: { user } } = await anonClient.auth.getUser(token)

    if (!user) {
      console.log('No user found in token')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('User verified:', user.id)

    const { data: formData, completed = false } = await req.json()

    console.log('Saving questionnaire for user:', user.id, 'completed:', completed)

    // Use service role client for database operations (bypasses RLS)
    const { data, error } = await supabaseClient
      .from('agent_questionnaires')
      .upsert({
        user_id: user.id,
        data: formData,
        completed: completed,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()

    if (error) {
      console.error('Error saving questionnaire:', error)
      return new Response(JSON.stringify({ error: 'Failed to save questionnaire' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Questionnaire saved:', { userId: user.id, completed })

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in questionnaire-save function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})