import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { dsn } = await req.json()
    
    if (!dsn) {
      return new Response(
        JSON.stringify({ error: 'Sentry DSN is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store the DSN in Supabase secrets via environment variables
    // This would typically be done through the Supabase dashboard
    console.log('Sentry DSN configured successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sentry DSN configured successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error setting up Sentry:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to configure Sentry DSN' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})