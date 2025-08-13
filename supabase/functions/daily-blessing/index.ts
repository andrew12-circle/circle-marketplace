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
    
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const body = `Daily Blessing - ${today}
We plead the blood of Jesus over the marketplace and academy.
Psalm 91 — We abide under the shadow of the Almighty.
Isaiah 54:17 — No weapon that is formed against thee shall prosper.

DECLARATIONS:
- The Lord is our refuge and fortress
- We overcome by the blood of the Lamb and the word of our testimony
- He shall give his angels charge over us to keep us in all our ways
- No weapon formed against this platform shall prosper
- We welcome the Holy Spirit to lead every transaction and decision

Numbers 6:24-26 — The Lord bless thee, and keep thee. 
The Lord make his face shine upon thee, and be gracious unto thee. 
The Lord lift up his countenance upon thee, and give thee peace.`;

    const { error } = await supabase.from('prayers').insert({ 
      kind: 'daily', 
      body,
      meta: { 
        automated: true,
        date: today,
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Error inserting daily blessing:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert daily blessing' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Daily blessing recorded for ${today}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Daily blessing recorded for ${today}`,
        blessing: body.split('\n')[0] // First line
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Daily blessing function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})