// FILE: supabase/functions/security-gate/index.ts

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

    const { action, endpoint, userId, userAgent } = await req.json();
    const clientIP = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (action === 'check') {
      // Simple risk assessment
      let riskScore = 0;
      const factors: any = {};

      // Check for bot user agents
      if (userAgent && /bot|crawler|spider/i.test(userAgent)) {
        riskScore += 30;
        factors.botUserAgent = true;
      }

      // Check recent requests from this IP
      const { data: recentRequests } = await supabase
        .from('attack_logs')
        .select('*')
        .eq('ip_address', clientIP)
        .gte('created_at', new Date(Date.now() - 300000).toISOString()); // 5 min

      if (recentRequests && recentRequests.length > 10) {
        riskScore += 40;
        factors.requestBurst = true;
      }

      // Determine gate type
      let gateType = 'none';
      let gateRequired = false;

      if (riskScore >= 70) {
        gateType = 'pow';
        gateRequired = true;
      } else if (riskScore >= 40) {
        gateType = 'captcha';
        gateRequired = true;
      }

      // Log the check
      await supabase.from('attack_logs').insert({
        attack_type: 'security_check',
        ip_address: clientIP,
        user_id: userId || null,
        endpoint: endpoint || null,
        user_agent: userAgent || null,
        risk_score: riskScore,
        blocked: false,
        details: { factors, gateType, gateRequired }
      });

      return new Response(JSON.stringify({
        gateType,
        gateRequired,
        riskScore,
        factors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Security gate error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});