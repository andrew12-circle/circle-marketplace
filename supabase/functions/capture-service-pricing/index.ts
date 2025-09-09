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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service_id, pricing_url } = await req.json();

    if (!service_id || !pricing_url) {
      throw new Error('service_id and pricing_url are required');
    }

    console.log(`📸 Capturing pricing screenshot for service ${service_id} at ${pricing_url}`);

    // Capture screenshot using ScrapingBee API
    const screenshotResponse = await fetch('https://app.scrapingbee.com/api/v1/screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: screenshotApiKey,
        url: pricing_url,
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
        pricing_page_url: pricing_url
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
      captured_at: new Date().toISOString()
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