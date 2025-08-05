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

    console.log('Starting migration of existing images...');

    // Get all content with external image URLs
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('id, title, thumbnail, cover_image_url, content_type, metadata')
      .or('thumbnail.ilike.%unsplash%,thumbnail.ilike.%youtube%,cover_image_url.ilike.%unsplash%')
      .limit(50); // Process in batches

    if (contentError) {
      throw new Error(`Failed to fetch content: ${contentError.message}`);
    }

    console.log(`Found ${content?.length || 0} items to process`);

    const migrationResults = [];

    if (content) {
      for (const item of content) {
        try {
          let updatedFields: any = {};

          // Process thumbnail
          if (item.thumbnail && (item.thumbnail.includes('unsplash.com') || item.thumbnail.includes('youtube.com'))) {
            console.log(`Processing thumbnail for ${item.title}`);
            
            const thumbnailResponse = await fetch(`${supabaseUrl}/functions/v1/process-image`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                imageUrl: item.thumbnail,
                imageType: 'thumbnail',
                contentId: item.id
              })
            });

            if (thumbnailResponse.ok) {
              const thumbnailData = await thumbnailResponse.json();
              if (thumbnailData.success) {
                updatedFields.thumbnail = thumbnailData.cachedUrl;
                console.log(`Migrated thumbnail for ${item.title}`);
              }
            }
          }

          // Process cover image
          if (item.cover_image_url && item.cover_image_url.includes('unsplash.com')) {
            console.log(`Processing cover image for ${item.title}`);
            
            const coverResponse = await fetch(`${supabaseUrl}/functions/v1/process-image`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                imageUrl: item.cover_image_url,
                imageType: 'cover',
                contentId: item.id
              })
            });

            if (coverResponse.ok) {
              const coverData = await coverResponse.json();
              if (coverData.success) {
                updatedFields.cover_image_url = coverData.cachedUrl;
                console.log(`Migrated cover image for ${item.title}`);
              }
            }
          }

          // Update the content record if we have changes
          if (Object.keys(updatedFields).length > 0) {
            const { error: updateError } = await supabase
              .from('content')
              .update(updatedFields)
              .eq('id', item.id);

            if (updateError) {
              throw new Error(`Failed to update ${item.title}: ${updateError.message}`);
            }

            migrationResults.push({
              id: item.id,
              title: item.title,
              success: true,
              migratedFields: Object.keys(updatedFields)
            });
          } else {
            migrationResults.push({
              id: item.id,
              title: item.title,
              success: true,
              migratedFields: []
            });
          }

        } catch (error) {
          console.error(`Error migrating ${item.title}:`, error);
          migrationResults.push({
            id: item.id,
            title: item.title,
            success: false,
            error: error.message
          });
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = migrationResults.filter(r => r.success).length;
    const failureCount = migrationResults.filter(r => !r.success).length;

    console.log(`Migration completed: ${successCount} success, ${failureCount} failures`);

    return new Response(JSON.stringify({ 
      success: true,
      processed: migrationResults.length,
      successful: successCount,
      failed: failureCount,
      results: migrationResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in migrate-existing-images:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});