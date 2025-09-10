import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const screenshotApiKey = Deno.env.get('SCREENSHOT_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Auto-detect pricing page from main website URL
async function detectPricingPage(baseUrl: string): Promise<string> {
  const commonPricingPaths = [
    '/pricing',
    '/plans',
    '/subscribe',
    '/subscription',
    '/price',
    '/packages',
    '/billing',
    '/cost',
    '/fees'
  ];
  
  const baseUrlObj = new URL(baseUrl);
  const domain = baseUrlObj.origin;
  
  // First, try common pricing page paths
  for (const path of commonPricingPaths) {
    const testUrl = `${domain}${path}`;
    try {
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      if (response.ok) {
        console.log(`✅ Found pricing page at: ${testUrl}`);
        return testUrl;
      }
    } catch (error) {
      console.log(`❌ No pricing page at: ${testUrl}`);
      continue;
    }
  }
  
  // If no common paths work, try to scrape the main page to find pricing links
  try {
    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Look for pricing-related links in the HTML
      const pricingPatterns = [
        /href=["']([^"']*(?:pricing|plans|subscribe|subscription|price|packages|billing|cost|fees)[^"']*)["']/gi,
        /href=["']([^"']*\/(?:pricing|plans|subscribe|subscription|price|packages|billing|cost|fees)(?:\/|$)[^"']*)["']/gi
      ];
      
      for (const pattern of pricingPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          let href = match[1];
          if (href.startsWith('/')) {
            href = `${domain}${href}`;
          } else if (!href.startsWith('http')) {
            href = `${domain}/${href}`;
          }
          
          // Validate the URL and test if accessible
          try {
            const testResponse = await fetch(href, { 
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
            });
            if (testResponse.ok) {
              console.log(`✅ Found pricing page via link detection: ${href}`);
              return href;
            }
          } catch (error) {
            continue;
          }
        }
      }
    }
  } catch (error) {
    console.log(`❌ Failed to scrape main page: ${error.message}`);
  }
  
  // If nothing found, return original URL
  console.log(`⚠️ No pricing page detected, using original URL: ${baseUrl}`);
  return baseUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service_id, pricing_url, auto_detect = false } = await req.json();

    if (!service_id || !pricing_url) {
      throw new Error('service_id and pricing_url are required');
    }

    let finalUrl = pricing_url;

    // Auto-detect pricing page if requested
    if (auto_detect) {
      console.log(`🔍 Auto-detecting pricing page for ${pricing_url}`);
      finalUrl = await detectPricingPage(pricing_url);
      console.log(`📍 Auto-detected pricing URL: ${finalUrl}`);
    }

    console.log(`📸 Capturing pricing screenshot for service ${service_id} at ${finalUrl}`);

    // Capture screenshot using ScrapingBee API
    const screenshotResponse = await fetch('https://app.scrapingbee.com/api/v1/screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: screenshotApiKey,
        url: finalUrl,
        width: 1920,
        height: 1080,
        full_page: true,
        format: 'png',
        wait: 3000,
        block_ads: true,
        block_resources: false,
        premium_proxy: true,
        country_code: 'US'
      }),
    });

    if (!screenshotResponse.ok) {
      const error = await screenshotResponse.text();
      console.error('Screenshot API error:', error);
      throw new Error(`Screenshot capture failed: ${error}`);
    }

    const screenshotBuffer = await screenshotResponse.arrayBuffer();
    const screenshotUrl = `service-pricing/${service_id}/${Date.now()}.png`;

    console.log(`💾 Uploading screenshot to storage: ${screenshotUrl}`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('service-pricing-screenshots')
      .upload(screenshotUrl, screenshotBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('service-pricing-screenshots')
      .getPublicUrl(screenshotUrl);

    console.log(`✅ Screenshot captured and uploaded: ${publicUrl}`);

    // Update service record with pricing screenshot URL
    const { error: updateError } = await supabase
      .from('services')
      .update({
        pricing_screenshot_url: publicUrl,
        pricing_screenshot_captured_at: new Date().toISOString(),
        pricing_page_url: finalUrl
      })
      .eq('id', service_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      screenshot_url: publicUrl,
      service_id,
      captured_at: new Date().toISOString(),
      detected_url: auto_detect ? finalUrl : undefined,
      auto_detected: auto_detect && finalUrl !== pricing_url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in capture-service-pricing function:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});