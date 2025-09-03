import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FraudDetectionRequest {
  affiliate_id: string;
  additional_checks?: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
  };
}

interface MobileTrackingRequest {
  session_id: string;
  affiliate_id?: string;
  event_type: string;
  device_info: {
    platform: string;
    device_model?: string;
    os_version?: string;
    app_version?: string;
    screen_size?: string;
    connection_type?: string;
  };
  platform: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    console.log(`Processing ${endpoint} request`);

    switch (endpoint) {
      case 'fraud-detection': {
        const { affiliate_id, additional_checks }: FraudDetectionRequest = await req.json();
        
        console.log(`Running fraud detection for affiliate: ${affiliate_id}`);

        // Run the fraud detection function
        const { data: fraudResult, error: fraudError } = await supabase
          .rpc('detect_affiliate_fraud', { p_affiliate_id: affiliate_id });

        if (fraudError) {
          console.error('Fraud detection error:', fraudError);
          throw fraudError;
        }

        // Additional IP and behavior checks if provided
        let additionalScore = 0;
        const additionalIndicators = [];

        if (additional_checks?.ip_address) {
          // Check for suspicious IP patterns (mock implementation)
          const ipParts = additional_checks.ip_address.split('.');
          if (ipParts[0] === '10' || (ipParts[0] === '192' && ipParts[1] === '168')) {
            additionalScore += 10;
            additionalIndicators.push({
              type: 'private_ip_address',
              ip: additional_checks.ip_address
            });
          }

          // Check for VPN/proxy usage (would need external service)
          // This is a placeholder for real implementation
          const isProxy = Math.random() < 0.1; // 10% chance for demo
          if (isProxy) {
            additionalScore += 20;
            additionalIndicators.push({
              type: 'vpn_proxy_detected',
              ip: additional_checks.ip_address
            });
          }
        }

        if (additional_checks?.user_agent) {
          // Check for bot user agents
          const botPatterns = ['bot', 'crawler', 'spider', 'scraper'];
          const isBot = botPatterns.some(pattern => 
            additional_checks.user_agent!.toLowerCase().includes(pattern)
          );
          
          if (isBot) {
            additionalScore += 30;
            additionalIndicators.push({
              type: 'bot_user_agent',
              user_agent: additional_checks.user_agent
            });
          }
        }

        // Combine original fraud score with additional checks
        const combinedScore = (fraudResult.fraud_score || 0) + additionalScore;
        const combinedResult = {
          ...fraudResult,
          fraud_score: combinedScore,
          flagged: combinedScore > 50,
          additional_indicators: additionalIndicators,
          recommendation: combinedScore > 75 ? 'reject' : 
                         combinedScore > 50 ? 'manual_review' : 'approve'
        };

        // If additional checks were performed, log them
        if (additionalIndicators.length > 0) {
          await supabase
            .from('affiliate_fraud_checks')
            .insert({
              affiliate_id,
              check_type: 'enhanced_scan',
              risk_score: combinedScore,
              details: {
                original_score: fraudResult.fraud_score,
                additional_score: additionalScore,
                additional_indicators: additionalIndicators,
                ip_address: additional_checks?.ip_address,
                user_agent: additional_checks?.user_agent
              },
              flagged: combinedScore > 50
            });
        }

        return new Response(JSON.stringify(combinedResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'mobile-tracking': {
        const trackingData: MobileTrackingRequest = await req.json();
        
        console.log(`Mobile tracking event: ${trackingData.event_type} on ${trackingData.platform}`);

        // Insert mobile tracking event
        const { error: trackingError } = await supabase
          .from('mobile_tracking_events')
          .insert({
            session_id: trackingData.session_id,
            affiliate_id: trackingData.affiliate_id,
            event_type: trackingData.event_type,
            device_info: trackingData.device_info,
            app_version: trackingData.device_info.app_version,
            platform: trackingData.platform
          });

        if (trackingError) {
          console.error('Mobile tracking error:', trackingError);
          throw trackingError;
        }

        // If this is an affiliate click on mobile, also track it in affiliate_clicks
        if (trackingData.event_type === 'affiliate_click' && trackingData.affiliate_id) {
          // Get affiliate link information
          const { data: affiliateData } = await supabase
            .from('affiliates')
            .select('id')
            .eq('id', trackingData.affiliate_id)
            .single();

          if (affiliateData) {
            // Create a mobile affiliate click record
            await supabase
              .from('affiliate_clicks')
              .insert({
                affiliate_id: trackingData.affiliate_id,
                link_id: null, // Mobile clicks might not have specific link IDs
                user_agent: `Mobile App - ${trackingData.platform}`,
                utm_source: 'mobile_app',
                utm_medium: trackingData.event_type,
                clicked_at: new Date().toISOString()
              });
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          session_id: trackingData.session_id,
          event_tracked: trackingData.event_type 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'automated-approval': {
        const { affiliate_id } = await req.json();
        
        console.log(`Processing automated approval for affiliate: ${affiliate_id}`);

        // Run the automated approval process
        const { data: approvalResult, error: approvalError } = await supabase
          .rpc('process_affiliate_approval', { p_affiliate_id: affiliate_id });

        if (approvalError) {
          console.error('Approval process error:', approvalError);
          throw approvalError;
        }

        console.log('Approval result:', approvalResult);

        return new Response(JSON.stringify(approvalResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'terms-acceptance': {
        const { 
          affiliate_id, 
          terms_version, 
          ip_address, 
          user_agent, 
          acceptance_method = 'web_form' 
        } = await req.json();
        
        console.log(`Recording terms acceptance for affiliate: ${affiliate_id}`);

        // Record terms acceptance
        const { error: termsError } = await supabase
          .from('affiliate_terms_acceptance')
          .insert({
            affiliate_id,
            terms_version,
            ip_address,
            user_agent,
            acceptance_method,
            accepted_at: new Date().toISOString()
          });

        if (termsError) {
          console.error('Terms acceptance error:', termsError);
          throw termsError;
        }

        // Trigger approval workflow after terms acceptance
        const { data: approvalResult } = await supabase
          .rpc('process_affiliate_approval', { p_affiliate_id: affiliate_id });

        return new Response(JSON.stringify({ 
          success: true, 
          terms_accepted: true,
          approval_triggered: true,
          approval_result: approvalResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error: any) {
    console.error('Error in affiliate-fraud-detection function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.details || 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);