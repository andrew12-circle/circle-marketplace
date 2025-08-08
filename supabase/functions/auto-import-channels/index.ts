import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTO-IMPORT-CHANNELS] ${step}${detailsStr}`);
};

// System user UUID for auto-imported content
const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000001';

// Top real estate channels to auto-import
const TOP_REAL_ESTATE_CHANNELS = [
  { id: 'UCdVrpzqm4llM1D83_b4ue_A', name: 'Tom Ferry' },
  { id: 'UCeWLg6cOG8S7UJHVUCLKJEw', name: 'Ryan Serhant' },
  { id: 'UC8DDOI-1-fhMf5X8bDMN_Sw', name: 'Brad McCallum' },
  { id: 'UC6V7HXGHQgvBV9k_KURJkrA', name: 'Real Estate Agent Round Table' },
  { id: 'UCn6xFKh-oK4cL7b3QTJLmTw', name: 'Ken Pozek' },
  { id: 'UCRlwRpOPkgdLFCHhECrHdqw', name: 'Krista Mashore' },
  { id: 'UC_eLWF9IKFD7gNdAyE8pBRQ', name: 'Jimmy Burgess' },
  { id: 'UCM1zOpkRNOYWpP0j5YcjMBw', name: 'Real Estate Rookie' },
  { id: 'UCVUJOaYWE_BfU4FT_BrS6fg', name: 'YLOPO' },
  { id: 'UC8Y3UE8h5v4M1Zr5sPNhEaA', name: 'The Real Estate Guys' }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Auto-import channels function started");

    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!youtubeApiKey) {
      throw new Error("YOUTUBE_API_KEY is not set");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const importResults = [];
    let totalImported = 0;
    let totalSkipped = 0;

    // Process each channel
    for (const channel of TOP_REAL_ESTATE_CHANNELS) {
      try {
        logStep(`Processing channel: ${channel.name}`, { channelId: channel.id });

        // Check if channel already exists
        const { data: existingChannel } = await supabaseClient
          .from('channels')
          .select('id')
          .eq('youtube_channel_id', channel.id)
          .single();

        if (existingChannel) {
          logStep(`Channel ${channel.name} already exists, skipping`);
          totalSkipped++;
          continue;
        }

        // Fetch channel details from YouTube API
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channel.id}&key=${youtubeApiKey}`
        );

        if (!channelResponse.ok) {
          logStep(`Failed to fetch channel details for ${channel.name}`, { 
            status: channelResponse.status 
          });
          continue;
        }

        const channelData = await channelResponse.json();
        
        if (!channelData.items || channelData.items.length === 0) {
          logStep(`No channel data found for ${channel.name}`);
          continue;
        }

        const channelInfo = channelData.items[0];
        const snippet = channelInfo.snippet;
        const statistics = channelInfo.statistics;
        const branding = channelInfo.brandingSettings;

        // Insert channel into database
        const { data: insertedChannel, error: insertError } = await supabaseClient
          .from('channels')
          .insert({
            creator_id: SYSTEM_USER_UUID, // Use system user UUID
            name: snippet.title || channel.name,
            description: snippet.description || null,
            youtube_channel_id: channel.id, // Store YouTube Channel ID as text
            youtube_channel_url: `https://www.youtube.com/channel/${channel.id}`,
            subscriber_count: parseInt(statistics.subscriberCount) || 0,
            cover_image_url: branding?.image?.bannerExternalUrl || snippet.thumbnails?.high?.url || null,
            auto_imported: true,
            is_verified: true, // Mark auto-imported channels as verified
          })
          .select()
          .single();

        if (insertError) {
          logStep(`Error inserting channel ${channel.name}`, { error: insertError });
          continue;
        }

        logStep(`Successfully imported channel: ${channel.name}`, {
          subscribers: statistics.subscriberCount,
          channelId: insertedChannel.id
        });

        importResults.push({
          name: channel.name,
          channelId: insertedChannel.id,
          subscribers: statistics.subscriberCount,
          status: 'imported'
        });

        totalImported++;

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logStep(`Error processing channel ${channel.name}`, { error: error.message });
        importResults.push({
          name: channel.name,
          status: 'error',
          error: error.message
        });
      }
    }

    // Also import trending real estate channels via search
    try {
      logStep("Searching for trending real estate channels");
      
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=real estate agent training OR real estate coach OR real estate marketing&type=channel&order=relevance&maxResults=10&key=${youtubeApiKey}`
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        for (const item of searchData.items || []) {
          try {
            const channelId = item.snippet.channelId;
            
            // Check if already exists
            const { data: existingChannel } = await supabaseClient
              .from('channels')
              .select('id')
              .eq('youtube_channel_id', channelId)
              .single();

            if (existingChannel) continue;

            // Get detailed channel info
            const detailResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
            );

            if (!detailResponse.ok) continue;

            const detailData = await detailResponse.json();
            if (!detailData.items?.[0]) continue;

            const channelDetail = detailData.items[0];
            const subscribers = parseInt(channelDetail.statistics.subscriberCount) || 0;

            // Only import channels with decent subscriber count
            if (subscribers < 1000) continue;

            const { error: insertError } = await supabaseClient
              .from('channels')
              .insert({
                creator_id: SYSTEM_USER_UUID, // Use system user UUID
                name: channelDetail.snippet.title,
                description: channelDetail.snippet.description || null,
                youtube_channel_id: channelId, // Store YouTube Channel ID as text
                youtube_channel_url: `https://www.youtube.com/channel/${channelId}`,
                subscriber_count: subscribers,
                cover_image_url: channelDetail.snippet.thumbnails?.high?.url || null,
                auto_imported: true,
                is_verified: false, // Search results are not auto-verified
              });

            if (!insertError) {
              logStep(`Imported trending channel: ${channelDetail.snippet.title}`, {
                subscribers: subscribers
              });
              totalImported++;
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 150));

          } catch (error) {
            logStep("Error processing search result", { error: error.message });
          }
        }
      }
    } catch (error) {
      logStep("Error in trending search", { error: error.message });
    }

    const summary = {
      totalProcessed: TOP_REAL_ESTATE_CHANNELS.length,
      totalImported,
      totalSkipped,
      timestamp: new Date().toISOString(),
      importResults
    };

    logStep("Auto-import channels completed", summary);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully imported ${totalImported} channels, skipped ${totalSkipped} existing channels`,
      ...summary
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in auto-import-channels", { error: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});