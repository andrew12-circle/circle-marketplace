import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Functions: {
      warm_marketplace_cache: {
        Returns: any;
      };
      cleanup_marketplace_cache: {
        Returns: void;
      };
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔥 Starting marketplace cache warming...');

    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Clean up expired cache entries first
    await supabase.rpc('cleanup_marketplace_cache');
    console.log('🧹 Cleaned up expired cache entries');

    // Warm the cache with fresh data
    const { data: cacheResult, error: cacheError } = await supabase.rpc('warm_marketplace_cache');
    
    if (cacheError) {
      console.error('❌ Cache warming failed:', cacheError);
      throw cacheError;
    }

    console.log('✅ Cache warmed successfully:', cacheResult);

    return new Response(
      JSON.stringify({
        success: true,
        result: cacheResult,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('💥 Cache warming error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});