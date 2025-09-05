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

    // Generate a secure token for DISC assessment
    const discToken = crypto.randomUUID()
    
    // Store the token in disc_results table
    const { error } = await supabaseClient
      .from('disc_results')
      .upsert({
        user_id: user.id,
        token: discToken,
        status: 'in_progress',
        method: 'external'
      })

    if (error) {
      console.error('Error storing DISC token:', error)
      return new Response(JSON.stringify({ error: 'Failed to create DISC assessment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For demo purposes, return a placeholder URL
    // In production, this would redirect to your chosen DISC assessment provider
    const assessmentUrl = `${new URL(req.url).origin}/disc/assessment?token=${discToken}`

    console.log('Generated DISC assessment link:', { userId: user.id, token: discToken })

    return new Response(JSON.stringify({ 
      url: assessmentUrl,
      token: discToken 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in disc-start function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})