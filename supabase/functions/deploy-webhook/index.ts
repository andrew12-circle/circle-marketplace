import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let deploymentData = {};
    
    // Try to parse request body for deployment info
    try {
      const body = await req.text();
      if (body) {
        deploymentData = JSON.parse(body);
      }
    } catch (e) {
      console.log('No valid JSON body provided, proceeding with default dedication');
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });

    const body = `Deploy Dedication
We cover this deployment in the blood of Jesus.
No weapon formed against this release shall prosper.
Psalm 91 — He is our refuge and fortress.
We welcome the Holy Spirit to lead every decision.

Date: ${currentDate}
Deployment ID: ${deploymentData.deploymentId || 'AUTO-' + Date.now()}
Commit SHA: ${deploymentData.commitSha || 'N/A'}

Declarations:
✝️ We plead the blood of Jesus over this release
⚡ No weapon formed against this deploy shall prosper
🛡️ The Lord surrounds this work as a shield
🙏 Holy Spirit, guide every line of code and every user interaction

Isaiah 54:17 — No weapon that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn. This is the heritage of the servants of the Lord, and their righteousness is of me, saith the Lord.

Numbers 6:24-26 — The Lord bless thee, and keep thee. The Lord make his face shine upon thee, and be gracious unto thee. The Lord lift up his countenance upon thee, and give thee peace.`;

    // Insert the deploy dedication into prayers table
    const { data, error } = await supabase
      .from('prayers')
      .insert({
        kind: 'deploy_dedication',
        body: body,
        meta: {
          ...deploymentData,
          timestamp: new Date().toISOString(),
          webhook: true
        }
      });

    if (error) {
      console.error('Error inserting deploy dedication:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to record deploy dedication' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Deploy dedication recorded successfully:', {
      title: 'Deploy Dedication',
      date: currentDate,
      ...deploymentData
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Deploy dedication recorded successfully',
        title: 'Deploy Dedication - ' + currentDate
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Deploy webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});