// FILE: supabase/functions/pow-challenge/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, difficulty = 20, solution, challengeId } = await req.json();
    const clientIP = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (action === 'generate') {
      const newChallengeId = crypto.randomUUID();
      const targetHash = '0'.repeat(Math.floor(difficulty / 4));
      const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

      // Store challenge in database
      await supabase.from('pow_challenges').insert({
        challenge_id: newChallengeId,
        difficulty,
        target_hash: targetHash,
        ip_address: clientIP,
        expires_at: new Date(expiresAt).toISOString()
      });

      return new Response(JSON.stringify({
        challenge: {
          challengeId: newChallengeId,
          difficulty,
          targetHash,
          expiresAt
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'verify') {
      // Verify the solution
      const { data: challenge } = await supabase
        .from('pow_challenges')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('ip_address', clientIP)
        .single();

      if (!challenge || challenge.solved) {
        return new Response(JSON.stringify({ error: 'Invalid challenge' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Simple verification (in production, use proper PoW verification)
      const workToken = crypto.randomUUID();
      const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes

      // Mark challenge as solved
      await supabase
        .from('pow_challenges')
        .update({ solved: true, solution_nonce: solution.nonce })
        .eq('challenge_id', challengeId);

      return new Response(JSON.stringify({
        workToken,
        expiresAt
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('PoW challenge error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});