import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    console.log('🚀 Enhanced provider integration request received');
    
    const { action, service_id, vendor_id, user_id, data } = await req.json();
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let result: any = {};

    switch (action) {
      case 'provider_booking':
        console.log('📅 Processing provider booking integration');
        
        // Check if provider has API integration configured
        const { data: integration } = await supabaseClient
          .from('service_integrations')
          .select('*')
          .eq('service_id', service_id)
          .single();

        if (integration?.api_connected) {
          // Simulate API call to provider's booking system
          console.log('🔗 Provider API booking simulation');
          result = {
            success: true,
            booking_url: `https://provider-api.example.com/book?service=${service_id}&user=${user_id}`,
            integration_type: 'api',
            message: 'Redirecting to provider booking system'
          };
        } else {
          // Use internal booking flow with enhanced tracking
          result = {
            success: true,
            integration_type: 'internal',
            message: 'Using internal booking system with provider notifications'
          };
        }

        // Track the booking attempt
        await supabaseClient.from('content_engagement_events').insert({
          content_id: service_id,
          user_id: user_id,
          event_type: 'booking',
          creator_id: vendor_id,
          engagement_quality_score: 1.0,
          event_data: {
            integration_type: result.integration_type,
            timestamp: new Date().toISOString()
          }
        });

        break;

      case 'provider_purchase':
        console.log('💳 Processing provider purchase integration');
        
        const { data: purchaseIntegration } = await supabaseClient
          .from('service_integrations')
          .select('*')
          .eq('service_id', service_id)
          .single();

        if (purchaseIntegration?.payment_integration === 'external') {
          // Generate tracked purchase URL
          const { data: service } = await supabaseClient
            .from('services')
            .select('website_url')
            .eq('id', service_id)
            .single();

          if (service?.website_url) {
            const trackingUrl = new URL(service.website_url);
            trackingUrl.searchParams.set('ref', 'circle_platform');
            trackingUrl.searchParams.set('user_id', user_id);
            trackingUrl.searchParams.set('service_id', service_id);
            trackingUrl.searchParams.set('tracking_id', crypto.randomUUID());

            result = {
              success: true,
              purchase_url: trackingUrl.toString(),
              integration_type: 'external',
              message: 'Redirecting to provider purchase page'
            };
          }
        } else {
          result = {
            success: true,
            integration_type: 'internal',
            message: 'Using internal purchase system'
          };
        }

        // Track the purchase attempt
        await supabaseClient.from('content_engagement_events').insert({
          content_id: service_id,
          user_id: user_id,
          event_type: 'purchase',
          creator_id: vendor_id,
          engagement_quality_score: 1.0,
          revenue_attributed: data?.amount || 0,
          event_data: {
            integration_type: result.integration_type,
            package_type: data?.package_type,
            timestamp: new Date().toISOString()
          }
        });

        break;

      case 'track_conversion':
        console.log('📊 Tracking conversion event');
        
        await supabaseClient.from('content_engagement_events').insert({
          content_id: service_id,
          user_id: user_id,
          event_type: 'conversion',
          creator_id: vendor_id,
          engagement_quality_score: data?.quality_score || 1.0,
          revenue_attributed: data?.revenue || 0,
          event_data: {
            conversion_type: data?.type,
            funnel_step: data?.step,
            timestamp: new Date().toISOString()
          }
        });

        result = {
          success: true,
          message: 'Conversion tracked successfully'
        };

        break;

      case 'provider_analytics':
        console.log('📈 Fetching provider analytics');
        
        const { data: analyticsData } = await supabaseClient
          .from('content_engagement_events')
          .select('*')
          .eq('content_id', service_id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const events = analyticsData || [];
        const views = events.filter(e => e.event_type === 'view').length;
        const bookings = events.filter(e => e.event_type === 'booking').length;
        const purchases = events.filter(e => e.event_type === 'purchase').length;
        const conversions = events.filter(e => e.event_type === 'conversion').length;
        const revenue = events.reduce((sum, e) => sum + (e.revenue_attributed || 0), 0);

        result = {
          success: true,
          analytics: {
            total_views: views,
            total_bookings: bookings,
            total_purchases: purchases,
            total_conversions: conversions,
            conversion_rate: views > 0 ? ((bookings + purchases) / views) * 100 : 0,
            revenue_attributed: revenue,
            avg_quality_score: events.length > 0 
              ? events.reduce((sum, e) => sum + (e.engagement_quality_score || 1), 0) / events.length 
              : 1.0,
            last_updated: new Date().toISOString()
          }
        };

        break;

      case 'webhook_notification':
        console.log('🔔 Processing webhook notification');
        
        // Process incoming webhook from provider
        const { webhook_data, webhook_type } = data;
        
        // Store webhook data
        await supabaseClient
          .from('provider_webhooks')
          .insert({
            service_id: service_id,
            vendor_id: vendor_id,
            webhook_type: webhook_type,
            webhook_data: webhook_data,
            processed_at: new Date().toISOString()
          })
          .catch(error => {
            console.log('Webhook storage failed (table may not exist):', error.message);
          });

        // Process based on webhook type
        if (webhook_type === 'booking_confirmed') {
          await supabaseClient.from('content_engagement_events').insert({
            content_id: service_id,
            user_id: webhook_data.user_id,
            event_type: 'conversion',
            creator_id: vendor_id,
            engagement_quality_score: 1.5, // Higher score for confirmed bookings
            event_data: {
              conversion_type: 'booking_confirmed',
              webhook_source: true,
              booking_id: webhook_data.booking_id,
              timestamp: new Date().toISOString()
            }
          });
        }

        result = {
          success: true,
          message: 'Webhook processed successfully'
        };

        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('✅ Provider integration completed successfully:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Enhanced provider integration error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Provider integration failed',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});