import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CacheThumbnailRequest {
  videoId: string;
  videoTitle?: string;
  channelTitle?: string;
  contentId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { videoId, videoTitle, channelTitle, contentId }: CacheThumbnailRequest = await req.json();

    console.log('Caching YouTube thumbnail for:', { videoId, contentId });

    // Generate YouTube thumbnail URLs in order of preference
    const thumbnailUrls = [
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, // 1280x720
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,     // 480x360
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,     // 320x180
      `https://img.youtube.com/vi/${videoId}/default.jpg`,       // 120x90
    ];

    let thumbnailBuffer: ArrayBuffer | null = null;
    let successfulUrl = '';

    // Try each thumbnail URL until we find one that works
    for (const url of thumbnailUrls) {
      try {
        console.log('Trying thumbnail URL:', url);
        const response = await fetch(url);
        if (response.ok && response.headers.get('content-length') !== '0') {
          const buffer = await response.arrayBuffer();
          if (buffer.byteLength > 1000) { // Ensure it's not a placeholder
            thumbnailBuffer = buffer;
            successfulUrl = url;
            console.log('Successfully downloaded thumbnail from:', url);
            break;
          }
        }
      } catch (error) {
        console.log('Failed to download from:', url, error.message);
        continue;
      }
    }

    if (!thumbnailBuffer) {
      throw new Error('Failed to download thumbnail from any source');
    }

    // Generate filename
    const sanitizedTitle = (videoTitle || 'video').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
    const filename = `youtube/${channelTitle || 'channel'}/${videoId}-${sanitizedTitle}.jpg`;

    // Upload to thumbnails bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(filename, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(filename);

    // Cache the result
    await supabase
      .from('image_cache')
      .upsert({
        original_url: successfulUrl,
        cached_url: publicUrl,
        image_type: 'thumbnail',
        content_id: contentId,
        file_size: thumbnailBuffer.byteLength,
        format: 'jpeg'
      }, {
        onConflict: 'original_url,image_type'
      });

    // Update content table with cached thumbnail if contentId provided
    if (contentId) {
      await supabase
        .from('content')
        .update({ thumbnail: publicUrl })
        .eq('id', contentId);
    }

    console.log('YouTube thumbnail cached successfully:', publicUrl);

    return new Response(JSON.stringify({ 
      success: true, 
      cachedUrl: publicUrl,
      originalUrl: successfulUrl,
      fileSize: thumbnailBuffer.byteLength
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error caching YouTube thumbnail:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});