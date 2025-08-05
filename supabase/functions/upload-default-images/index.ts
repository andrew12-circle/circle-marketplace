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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Uploading default images to storage...');

    // Default images to upload
    const defaultImages = [
      {
        name: 'default-thumbnail.webp',
        bucket: 'default-images',
        url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'default-avatar.webp', 
        bucket: 'default-images',
        url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=512&q=80'
      },
      {
        name: 'default-cover.webp',
        bucket: 'default-images', 
        url: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1280&q=80'
      },
      {
        name: 'default-content.webp',
        bucket: 'default-images',
        url: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=800&q=80'
      }
    ];

    const uploadResults = [];

    for (const image of defaultImages) {
      try {
        // Download the image
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error(`Failed to download ${image.name}: ${response.statusText}`);
        }

        const imageBuffer = await response.arrayBuffer();

        // Upload to storage
        const { data, error } = await supabase.storage
          .from(image.bucket)
          .upload(image.name, imageBuffer, {
            contentType: 'image/webp',
            upsert: true
          });

        if (error) {
          throw new Error(`Upload failed for ${image.name}: ${error.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(image.bucket)
          .getPublicUrl(image.name);

        uploadResults.push({
          name: image.name,
          url: publicUrl,
          success: true
        });

        console.log(`Successfully uploaded ${image.name} to ${publicUrl}`);

      } catch (error) {
        console.error(`Error uploading ${image.name}:`, error);
        uploadResults.push({
          name: image.name,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      results: uploadResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in upload-default-images:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});