import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessImageRequest {
  imageUrl: string;
  imageType: 'thumbnail' | 'avatar' | 'cover' | 'content';
  contentId?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { imageUrl, imageType, contentId, maxWidth = 800, maxHeight = 600, quality = 80 }: ProcessImageRequest = await req.json();

    console.log('Processing image:', { imageUrl, imageType, contentId });

    // Check if image is already cached
    const { data: cached } = await supabase
      .from('image_cache')
      .select('*')
      .eq('original_url', imageUrl)
      .eq('image_type', imageType)
      .maybeSingle();

    if (cached) {
      // Update last accessed
      await supabase
        .from('image_cache')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', cached.id);

      console.log('Returning cached image:', cached.cached_url);
      return new Response(JSON.stringify({ 
        success: true, 
        cachedUrl: cached.cached_url,
        fromCache: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download and process the image
    console.log('Downloading image from:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const originalSize = imageBuffer.byteLength;
    
    // Generate filename
    const url = new URL(imageUrl);
    const filename = `${imageType}/${contentId || 'general'}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    
    // For now, we'll store the original image (later we can add image processing)
    // Upload to appropriate bucket
    const bucketName = getBucketForImageType(imageType);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filename, imageBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    // Cache the result
    await supabase
      .from('image_cache')
      .insert({
        original_url: imageUrl,
        cached_url: publicUrl,
        image_type: imageType,
        content_id: contentId,
        file_size: originalSize,
        format: 'webp'
      });

    console.log('Image processed and cached:', publicUrl);

    return new Response(JSON.stringify({ 
      success: true, 
      cachedUrl: publicUrl,
      fromCache: false,
      originalSize,
      savedSize: originalSize // Same for now, will optimize later
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function getBucketForImageType(imageType: string): string {
  switch (imageType) {
    case 'thumbnail': return 'thumbnails';
    case 'avatar': return 'user-avatars';
    case 'cover': return 'channel-covers';
    case 'content': return 'content-images';
    default: return 'content-images';
  }
}