import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔥 Starting marketplace cache warming...');

    // Fetch all services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(100);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      throw servicesError;
    }

    // Fetch all vendors  
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('rating', { ascending: false })
      .limit(50);

    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError);
      throw vendorsError;
    }

    // Prepare cache data
    const cacheData = {
      services: services || [],
      vendors: vendors || [],
      lastUpdated: new Date().toISOString(),
      totalServices: services?.length || 0,
      totalVendors: vendors?.length || 0
    };

    // Store in cache with 5 minute expiration
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    const { error: cacheError } = await supabase
      .from('marketplace_cache')
      .upsert({
        cache_key: 'marketplace_data',
        cache_data: cacheData,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      });

    if (cacheError) {
      console.error('Error storing cache:', cacheError);
      throw cacheError;
    }

    console.log('✅ Cache warmed successfully:', {
      services: cacheData.totalServices,
      vendors: cacheData.totalVendors
    });

    return new Response(
      JSON.stringify({
        success: true,
        cached: {
          services: cacheData.totalServices,
          vendors: cacheData.totalVendors,
          expiresAt
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Cache warming failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});