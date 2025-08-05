import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ChannelImportRequest {
  channelUrl: string;
  maxVideos?: number;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelUrl, maxVideos = 50, userId }: ChannelImportRequest = await req.json();
    
    console.log('Importing YouTube channel:', channelUrl);
    console.log('YouTube API Key available:', !!youtubeApiKey);

    // Extract channel ID from URL
    const channelId = await extractChannelId(channelUrl);
    if (!channelId) {
      throw new Error('Invalid YouTube channel URL or unable to resolve channel ID');
    }

    // Fetch channel details
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
    );
    
    if (!channelResponse.ok) {
      console.error('Channel API error:', channelResponse.status, channelResponse.statusText);
      const errorText = await channelResponse.text();
      console.error('Channel API error details:', errorText);
      throw new Error(`YouTube API error: ${channelResponse.status} ${channelResponse.statusText}`);
    }
    
    const channelData = await channelResponse.json();
    console.log('Channel API response:', JSON.stringify(channelData, null, 2));
    
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('Channel not found');
    }

    const channel = channelData.items[0];
    console.log('Channel found:', channel.snippet.title);

    // Check if channel already exists
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('name', channel.snippet.title)
      .maybeSingle();

    let channelDbId;

    if (!existingChannel) {
      // Insert channel into database
      const { data: newChannel, error: channelError } = await supabase
        .from('channels')
        .insert({
          creator_id: userId,
          name: channel.snippet.title,
          description: channel.snippet.description || '',
          cover_image_url: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
          subscriber_count: parseInt(channel.statistics.subscriberCount || '0'),
          is_verified: true
        })
        .select()
        .single();

      if (channelError) {
        console.error('Error inserting channel:', channelError);
        throw new Error('Failed to create channel');
      }

      channelDbId = newChannel.id;
      console.log('Channel created with ID:', channelDbId);
    } else {
      channelDbId = existingChannel.id;
      console.log('Using existing channel ID:', channelDbId);
    }

    // Fetch channel's videos (most popular)
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=relevance&type=video&maxResults=${maxVideos}&key=${youtubeApiKey}`
    );
    const videosData = await videosResponse.json();

    if (!videosData.items) {
      throw new Error('No videos found');
    }

    console.log(`Found ${videosData.items.length} videos`);

    // Get detailed video information
    const videoIds = videosData.items.map((video: any) => video.id.videoId).join(',');
    const videoDetailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${youtubeApiKey}`
    );
    const videoDetailsData = await videoDetailsResponse.json();

    const videosToInsert = [];

    for (const video of videoDetailsData.items) {
      // Check if video already exists
      const { data: existingVideo } = await supabase
        .from('content')
        .select('id')
        .eq('title', video.snippet.title)
        .eq('content_type', 'video')
        .maybeSingle();

      if (!existingVideo) {
        // Parse duration from ISO 8601 format (PT4M13S) to readable format (4:13)
        const duration = parseDuration(video.contentDetails.duration);
        
        // Determine category based on video tags or title
        const category = determineCategory(video.snippet.tags, video.snippet.title);

        // Get optimized thumbnail - try to cache it first
        let thumbnailUrl = video.snippet.thumbnails?.maxresdefault?.url || 
                         video.snippet.thumbnails?.high?.url || 
                         video.snippet.thumbnails?.medium?.url ||
                         video.snippet.thumbnails?.default?.url;

        // Try to cache the YouTube thumbnail
        try {
          const thumbnailResponse = await fetch(`${supabaseUrl}/functions/v1/cache-youtube-thumbnail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              videoId: video.id,
              videoTitle: video.snippet.title,
              channelTitle: channel.snippet.title
            })
          });

          if (thumbnailResponse.ok) {
            const thumbnailData = await thumbnailResponse.json();
            if (thumbnailData.success) {
              thumbnailUrl = thumbnailData.cachedUrl;
              console.log(`Cached thumbnail for video ${video.id}`);
            }
          }
        } catch (error) {
          console.log(`Failed to cache thumbnail for video ${video.id}:`, error);
          // Continue with original thumbnail URL
        }

        videosToInsert.push({
          creator_id: userId,
          content_type: 'video',
          title: video.snippet.title,
          description: video.snippet.description || 'Imported from YouTube',
          category: category,
          duration: duration,
          cover_image_url: thumbnailUrl,
          content_url: `https://www.youtube.com/watch?v=${video.id}`,
          tags: video.snippet.tags || [],
          is_pro: false,
          is_featured: false,
          is_published: true,
          price: 0,
          total_plays: parseInt(video.statistics.viewCount || '0'),
          metadata: {
            source: 'youtube',
            video_id: video.id,
            channel_id: channelId,
            channel_title: channel.snippet.title,
            imported_at: new Date().toISOString(),
            like_count: parseInt(video.statistics.likeCount || '0'),
            comment_count: parseInt(video.statistics.commentCount || '0')
          },
          published_at: video.snippet.publishedAt
        });
      }
    }

    console.log(`Inserting ${videosToInsert.length} new videos`);

    // Bulk insert videos
    if (videosToInsert.length > 0) {
      const { error: videosError } = await supabase
        .from('content')
        .insert(videosToInsert);

      if (videosError) {
        console.error('Error inserting videos:', videosError);
        throw new Error('Failed to import videos');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      channelId: channelDbId,
      channelName: channel.snippet.title,
      videosImported: videosToInsert.length,
      totalVideos: videoDetailsData.items.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-youtube-channel function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractChannelId(url: string): Promise<string | null> {
  const patterns = [
    { regex: /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/, type: 'channel' },
    { regex: /youtube\.com\/c\/([a-zA-Z0-9_-]+)/, type: 'custom' },
    { regex: /youtube\.com\/user\/([a-zA-Z0-9_-]+)/, type: 'user' },
    { regex: /youtube\.com\/@([a-zA-Z0-9_-]+)/, type: 'handle' }
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      const identifier = match[1];
      
      // For channel URLs, return the ID directly
      if (pattern.type === 'channel') {
        return identifier;
      }
      
      // For other types, use the YouTube API to resolve to channel ID
      try {
        let apiUrl = '';
        
        if (pattern.type === 'handle') {
          // For @username, use the search API to find the channel
          apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=@${identifier}&key=${youtubeApiKey}`;
        } else if (pattern.type === 'custom') {
          // For custom URLs, use the search API
          apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${identifier}&key=${youtubeApiKey}`;
        } else if (pattern.type === 'user') {
          // For usernames, use the channels API
          apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${identifier}&key=${youtubeApiKey}`;
        }
        
        console.log('Resolving channel ID for:', identifier, 'type:', pattern.type);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.error('YouTube API error:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('YouTube API error details:', errorText);
          continue; // Try next pattern
        }
        
        const data = await response.json();
        console.log('YouTube API response:', JSON.stringify(data, null, 2));
        
        if (data.items && data.items.length > 0) {
          const channelId = data.items[0].id || data.items[0].snippet?.channelId;
          console.log('Resolved channel ID:', channelId);
          return channelId;
        } else {
          console.log('No items found in YouTube API response for:', identifier);
        }
      } catch (error) {
        console.error('Error resolving channel ID:', error);
      }
    }
  }
  
  return null;
}

function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function determineCategory(tags: string[] = [], title: string = ''): string {
  const categories = {
    'Real Estate': ['real estate', 'property', 'realtor', 'housing', 'home', 'listing'],
    'Marketing': ['marketing', 'advertising', 'promotion', 'brand', 'social media'],
    'Sales': ['sales', 'selling', 'negotiation', 'closing', 'lead'],
    'Technology': ['tech', 'software', 'app', 'digital', 'ai', 'automation'],
    'Finance': ['finance', 'money', 'investment', 'mortgage', 'loan', 'credit'],
    'Leadership': ['leadership', 'management', 'team', 'coaching', 'mentor'],
    'Training': ['training', 'education', 'tutorial', 'course', 'learn'],
    'Business Development': ['business', 'development', 'growth', 'strategy', 'planning']
  };

  const allText = [...tags, title].join(' ').toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      return category;
    }
  }
  
  return 'Education'; // Default category
}