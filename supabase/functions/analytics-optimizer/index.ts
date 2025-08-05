import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { action, vendor_id } = await req.json();

    switch (action) {
      case 'get_cached_analytics':
        // Get cached analytics for better performance
        const { data: cachedAnalytics, error: cacheError } = await supabaseAdmin
          .from('vendor_analytics_cache')
          .select('*')
          .eq('vendor_id', vendor_id)
          .single();

        if (cacheError && cacheError.code !== 'PGRST116') {
          throw cacheError;
        }

        if (cachedAnalytics) {
          return new Response(JSON.stringify(cachedAnalytics), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // If no cache, fall back to regular query
        const { data: liveData, error: liveError } = await supabaseAdmin.rpc(
          'get_vendor_dashboard_stats',
          { p_vendor_id: vendor_id }
        );

        if (liveError) throw liveError;

        return new Response(JSON.stringify(liveData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'refresh_all_analytics':
        // Queue background job to refresh analytics
        const { error: jobError } = await supabaseAdmin
          .from('background_jobs')
          .insert({
            job_type: 'refresh_analytics',
            job_data: {},
            priority: 3
          });

        if (jobError) throw jobError;

        return new Response(JSON.stringify({ message: 'Analytics refresh queued' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'get_marketplace_data':
        // Optimized marketplace data loading with limits and indexes
        const [vendorsResponse, servicesResponse] = await Promise.allSettled([
          supabaseAdmin
            .from('vendors')
            .select(`
              id, name, description, logo_url, website_url, location,
              rating, review_count, is_verified, co_marketing_agents,
              campaigns_funded, service_states, mls_areas, 
              service_radius_miles, license_states, latitude, longitude,
              vendor_type, local_representatives
            `)
            .order('sort_order', { ascending: true })
            .order('rating', { ascending: false })
            .limit(50), // Limit for performance

          supabaseAdmin
            .from('services')
            .select(`
              id, title, description, category, discount_percentage,
              retail_price, pro_price, co_pay_price, image_url, tags,
              is_featured, is_top_pick, estimated_roi, duration,
              requires_quote, vendor_id
            `)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false })
            .limit(100) // Limit for performance
        ]);

        let vendors = [];
        let services = [];

        if (vendorsResponse.status === 'fulfilled' && !vendorsResponse.value.error) {
          vendors = vendorsResponse.value.data || [];
        } else {
          console.error('Vendors loading failed:', vendorsResponse);
        }

        if (servicesResponse.status === 'fulfilled' && !servicesResponse.value.error) {
          services = servicesResponse.value.data || [];
        } else {
          console.error('Services loading failed:', servicesResponse);
        }

        // Format and add vendor info to services
        const formattedServices = services.map(service => ({
          ...service,
          discount_percentage: service.discount_percentage ? String(service.discount_percentage) : undefined,
          vendor: {
            name: 'Service Provider',
            rating: 4.5,
            review_count: 0,
            is_verified: true
          }
        }));

        return new Response(JSON.stringify({
          services: formattedServices,
          vendors: vendors,
          cached: false,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Analytics optimizer error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});