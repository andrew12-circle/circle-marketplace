import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Query to find views with security definer
    const { data: views, error } = await supabaseClient
      .rpc('identify_security_definer_views')

    if (error) {
      console.error('Error identifying views:', error)
      
      // Alternative query using raw SQL
      const { data: rawViews, error: rawError } = await supabaseClient
        .from('pg_views')
        .select('schemaname, viewname, definition')
        .eq('schemaname', 'public')

      if (rawError) {
        throw rawError
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Found views using alternative method',
          views: rawViews,
          note: 'These are all public views - check definitions for SECURITY DEFINER'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Security view analysis completed',
        views: views || [],
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
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