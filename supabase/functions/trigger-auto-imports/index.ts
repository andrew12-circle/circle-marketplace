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

    console.log('🚀 Triggering auto-import functions...');

    const results = {
      channels: null,
      trending: null,
      errors: []
    };

    // Trigger auto-import-channels
    try {
      const { data: channelsResult, error: channelsError } = await supabase.functions.invoke('auto-import-channels');
      if (channelsError) {
        console.error('Channels import error:', channelsError);
        results.errors.push(`Channels: ${channelsError.message}`);
      } else {
        results.channels = channelsResult;
        console.log('✅ Channels import completed:', channelsResult);
      }
    } catch (error) {
      console.error('Channels import failed:', error);
      results.errors.push(`Channels: ${error.message}`);
    }

    // Trigger auto-import-trending
    try {
      const { data: trendingResult, error: trendingError } = await supabase.functions.invoke('auto-import-trending');
      if (trendingError) {
        console.error('Trending import error:', trendingError);
        results.errors.push(`Trending: ${trendingError.message}`);
      } else {
        results.trending = trendingResult;
        console.log('✅ Trending import completed:', trendingResult);
      }
    } catch (error) {
      console.error('Trending import failed:', error);
      results.errors.push(`Trending: ${error.message}`);
    }

    // Warm the marketplace cache after imports
    try {
      const { error: cacheError } = await supabase.functions.invoke('warm-marketplace-cache');
      if (cacheError) {
        console.error('Cache warming error:', cacheError);
        results.errors.push(`Cache: ${cacheError.message}`);
      } else {
        console.log('✅ Cache warmed after imports');
      }
    } catch (error) {
      console.error('Cache warming failed:', error);
      results.errors.push(`Cache: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: results.errors.length === 0,
        results,
        summary: {
          channelsImported: results.channels?.channelsImported || 0,
          contentImported: results.trending?.imported || 0,
          errors: results.errors.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: results.errors.length === 0 ? 200 : 207 
      }
    );

  } catch (error) {
    console.error('❌ Auto-import trigger failed:', error);
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