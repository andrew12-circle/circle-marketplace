import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  discount_percentage?: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  estimated_roi?: number;
  duration?: string;
  requires_quote?: boolean;
  sort_order?: number;
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  location?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  co_marketing_agents: number;
  campaigns_funded: number;
  service_states?: string[];
  mls_areas?: string[];
  service_radius_miles?: number;
  license_states?: string[];
  latitude?: number;
  longitude?: number;
  vendor_type?: string;
  local_representatives?: any;
  sort_order?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client using service role for reliable data access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('🔄 Fetching combined marketplace data from edge function...');

    // Fetch services and vendors in parallel with enhanced data relationships
    const [servicesResponse, vendorsResponse, trackingMetricsResponse, funnelContentResponse] = await Promise.all([
      supabaseClient
        .from('services')
        .select(`
          *,
          vendors!inner (
            id, name, rating, review_count, is_verified, website_url, logo_url, 
            support_hours, vendor_type, service_states, mls_areas
          ),
          service_tracking_events (
            event_type, created_at, revenue_attributed
          ),
          service_interest_counters (
            total_likes, updated_at
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(100),
      
      supabaseClient
        .from('vendors')
        .select(`
          *,
          services!inner (
            id, title, is_active, category
          )
        `)
        .eq('is_active', true)
        .in('approval_status', ['approved', 'auto_approved', 'pending'])
        .order('sort_order', { ascending: true })
        .order('rating', { ascending: false })
        .limit(50),

      // Get aggregated tracking metrics for the last 30 days
      supabaseClient
        .rpc('get_service_metrics_summary', { days_back: 30 }),

      // Get funnel content that may have been updated by admins
      supabaseClient
        .from('service_funnel_content')
        .select('service_id, updated_at, content_data')
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Check for errors
    if (servicesResponse.error) {
      console.error('Services error:', servicesResponse.error);
      throw servicesResponse.error;
    }

    if (vendorsResponse.error) {
      console.error('Vendors error:', vendorsResponse.error);
      throw vendorsResponse.error;
    }

    // Log warnings for missing data but don't fail
    if (trackingMetricsResponse.error) {
      console.warn('Tracking metrics unavailable:', trackingMetricsResponse.error);
    }

    if (funnelContentResponse.error) {
      console.warn('Funnel content updates unavailable:', funnelContentResponse.error);
    }

    // Format services with enhanced vendor data and tracking metrics
    const trackingMetrics = trackingMetricsResponse.data || [];
    const funnelUpdates = (funnelContentResponse.data || []).reduce((acc: any, item: any) => {
      acc[item.service_id] = item;
      return acc;
    }, {});

    const formattedServices = (servicesResponse.data || []).map((service: Service) => {
      const metrics = trackingMetrics.find((m: any) => m.service_id === service.id);
      const funnelUpdate = funnelUpdates[service.id];
      
      return {
        ...service,
        discount_percentage: service.discount_percentage ? String(service.discount_percentage) : undefined,
        vendor: service.vendors ? {
          ...service.vendors,
          name: service.vendors.name || 'Service Provider',
          rating: service.vendors.rating || 4.5,
          review_count: service.vendors.review_count || 0,
          is_verified: service.vendors.is_verified || true
        } : {
          name: 'Service Provider',
          rating: 4.5,
          review_count: 0,
          is_verified: true
        },
        // Enhanced tracking data
        tracking_metrics: metrics ? {
          total_views: metrics.total_views || 0,
          total_clicks: metrics.total_clicks || 0,
          total_purchases: metrics.total_purchases || 0,
          conversion_rate: metrics.conversion_rate || 0,
          revenue_attributed: metrics.revenue_attributed || 0
        } : null,
        // Funnel content freshness indicator
        funnel_updated_recently: !!funnelUpdate,
        funnel_last_updated: funnelUpdate?.updated_at,
        // Interest metrics
        total_likes: service.service_interest_counters?.[0]?.total_likes || 0
      };
    });

    // Format vendors with enhanced service relationship data
    const formattedVendors = (vendorsResponse.data || []).map((vendor: Vendor) => ({
      ...vendor,
      id: vendor.id,
      name: vendor.name || 'Unknown Vendor',
      description: vendor.description || '',
      logo_url: vendor.logo_url,
      website_url: vendor.website_url,
      location: vendor.location,
      rating: vendor.rating || 0,
      review_count: vendor.review_count || 0,
      is_verified: vendor.is_verified || false,
      co_marketing_agents: vendor.co_marketing_agents || 0,
      campaigns_funded: vendor.campaigns_funded || 0,
      service_states: vendor.service_states || [],
      mls_areas: vendor.mls_areas || [],
      service_radius_miles: vendor.service_radius_miles,
      license_states: vendor.license_states || [],
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      vendor_type: vendor.vendor_type || 'company',
      local_representatives: vendor.local_representatives || [],
      // Enhanced service data
      active_services_count: vendor.services?.filter((s: any) => s.is_active).length || 0,
      service_categories: [...new Set(vendor.services?.map((s: any) => s.category) || [])]
    }));

    const result = {
      services: formattedServices,
      vendors: formattedVendors,
      metadata: {
        servicesCount: formattedServices.length,
        vendorsCount: formattedVendors.length,
        timestamp: new Date().toISOString(),
        source: 'edge-function',
        dataFreshness: {
          servicesWithMetrics: formattedServices.filter(s => s.tracking_metrics).length,
          servicesWithRecentFunnelUpdates: formattedServices.filter(s => s.funnel_updated_recently).length,
          vendorsWithActiveServices: formattedVendors.filter(v => v.active_services_count > 0).length
        },
        cacheHealth: {
          trackingMetricsAvailable: !trackingMetricsResponse.error,
          funnelContentAvailable: !funnelContentResponse.error,
          lastCacheRefresh: new Date().toISOString()
        }
      }
    };

    console.log(`✅ Combined marketplace data fetched successfully: ${formattedServices.length} services, ${formattedVendors.length} vendors`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Error in get-marketplace-data:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: 'Failed to fetch marketplace data'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})