import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting DISC completion function');

    // Environment validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceRole: !!supabaseServiceRoleKey,
      hasAnonKey: !!supabaseAnonKey
    });

    // Create Supabase client for auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User verified:', user.id);

    // Get request body
    const body = await req.json();
    const { discType, discScores, discStatus } = body;

    console.log('DISC completion data:', { userId: user.id, discType, discStatus });

    // Create service role client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    // Save DISC results
    const { data, error } = await supabaseService
      .from('disc_results')
      .upsert({
        user_id: user.id,
        disc_type: discType,
        disc_scores: discScores,
        status: discStatus,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving DISC results:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save DISC results', details: error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('DISC results saved:', { userId: user.id, discType, discStatus });

    return new Response(
      JSON.stringify({ 
        message: 'DISC results saved successfully',
        data: {
          discType,
          discScores,
          discStatus
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in DISC completion:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})