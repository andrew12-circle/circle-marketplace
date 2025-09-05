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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load questionnaire data - use maybeSingle to handle 0 or 1 records
    const { data: questionnaire, error } = await supabaseClient
      .from('agent_questionnaires')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .maybeSingle()

    if (error) {
      console.error('Error loading questionnaire:', error)
      return new Response(JSON.stringify({ error: 'Failed to load questionnaire' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Questionnaire loaded:', { userId: user.id, found: !!questionnaire })

    return new Response(JSON.stringify({ 
      data: questionnaire?.data || {},
      completed: questionnaire?.completed || false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in questionnaire-load function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})