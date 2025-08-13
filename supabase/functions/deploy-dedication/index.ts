import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get deployment info from request
    const requestData = req.method === 'POST' ? await req.json() : {};
    const commitSha = requestData.commit || 'unknown';
    const deploymentId = requestData.deploymentId || 'local';
    
    const timestamp = new Date().toISOString();
    
    const body = `Deploy Dedication - ${timestamp}
We cover this release in the blood of Jesus.
No weapon formed against this deploy shall prosper.
Psalm 91 — He is our refuge and fortress.

DEPLOYMENT BLESSING:
- Commit: ${commitSha}
- Deployment ID: ${deploymentId}
- We plead the blood of Jesus over every line of code
- The Lord surrounds this release as a shield
- No weapon formed against this deployment shall prosper
- We welcome the Holy Spirit to lead every user interaction

Isaiah 54:17 — No weapon that is formed against thee shall prosper; 
and every tongue that shall rise against thee in judgment thou shalt condemn.
This is the heritage of the servants of the Lord.

Ephesians 6:11 — Put on the whole armour of God, 
that ye may be able to stand against the wiles of the devil.`;

    const { error } = await supabase.from('prayers').insert({ 
      kind: 'deploy', 
      body,
      meta: { 
        commit: commitSha,
        deploymentId,
        timestamp,
        automated: true
      }
    });

    if (error) {
      console.error('Error inserting deploy dedication:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert deploy dedication' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Deploy dedication recorded for commit ${commitSha}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deploy dedication recorded for commit ${commitSha}`,
        dedication: 'Release covered in the blood of Jesus'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Deploy dedication function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})