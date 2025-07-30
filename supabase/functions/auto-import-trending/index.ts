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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting auto-import of trending YouTube content...');

    // Get trending videos from multiple regions for diversity
    const regions = ['US', 'GB', 'CA', 'AU'];
    const categories = [
      { id: '26', name: 'Howto & Style' },
      { id: '27', name: 'Education' },
      { id: '28', name: 'Science & Technology' },
      { id: '25', name: 'News & Politics' },
      { id: '22', name: 'People & Blogs' }
    ];

    let allVideos = [];
    let processedCount = 0;
    let importedCount = 0;

    // Fetch trending videos from each region
    for (const region of regions) {
      console.log(`Fetching trending videos from ${region}...`);
      
      try {
        const trendingResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${region}&maxResults=25&key=${youtubeApiKey}`
        );
        const trendingData = await trendingResponse.json();

        if (trendingData.items) {
          allVideos.push(...trendingData.items);
        }
      } catch (error) {
        console.error(`Error fetching from ${region}:`, error);
      }
    }

    // Also fetch trending shorts (videos under 60 seconds)
    console.log('Fetching trending shorts...');
    try {
      const shortsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=%23shorts&type=video&order=relevance&publishedAfter=${getYesterdayISO()}&maxResults=20&key=${youtubeApiKey}`
      );
      const shortsData = await shortsResponse.json();

      if (shortsData.items) {
        // Get detailed info for shorts
        const videoIds = shortsData.items.map((video: any) => video.id.videoId).join(',');
        if (videoIds) {
          const detailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${youtubeApiKey}`
          );
          const detailsData = await detailsResponse.json();
          
          if (detailsData.items) {
            // Filter for actual shorts (under 60 seconds)
            const actualShorts = detailsData.items.filter((video: any) => {
              const duration = parseDurationToSeconds(video.contentDetails.duration);
              return duration <= 60;
            });
            
            allVideos.push(...actualShorts);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching shorts:', error);
    }

    // Remove duplicates and filter quality content
    const uniqueVideos = removeDuplicates(allVideos);
    console.log(`Found ${uniqueVideos.length} unique videos to process`);

    // Create a default admin user for imports if none exists
    let adminUserId;
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('is_admin', true)
      .limit(1)
      .single();

    if (adminProfile) {
      adminUserId = adminProfile.user_id;
    } else {
      // Create system user for auto-imports
      console.log('No admin found, creating system import user...');
      adminUserId = '00000000-0000-0000-0000-000000000000'; // System user ID
    }

    // Process each video
    for (const video of uniqueVideos) {
      try {
        processedCount++;
        
        // Check if video already exists
        const { data: existingVideo } = await supabase
          .from('content')
          .select('id')
          .eq('content_url', `https://www.youtube.com/watch?v=${video.id}`)
          .single();

        if (existingVideo) {
          console.log(`Skipping existing video: ${video.snippet.title}`);
          continue;
        }

        // Determine if it's a short
        const durationSeconds = parseDurationToSeconds(video.contentDetails.duration);
        const isShort = durationSeconds <= 60;
        
        // Parse duration to readable format
        const duration = parseDuration(video.contentDetails.duration);
        
        // Auto-categorize based on title, description, and tags
        const category = determineCategory(
          video.snippet.tags || [], 
          video.snippet.title, 
          video.snippet.description || ''
        );

        // Import the video
        const { error } = await supabase
          .from('content')
          .insert({
            creator_id: adminUserId,
            content_type: 'video',
            title: video.snippet.title,
            description: video.snippet.description || 'Auto-imported trending content',
            category: category,
            duration: duration,
            cover_image_url: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
            content_url: `https://www.youtube.com/watch?v=${video.id}`,
            tags: [...(video.snippet.tags || []), isShort ? 'shorts' : 'trending', 'auto-import'],
            is_pro: false,
            is_featured: shouldBeFeatured(video),
            is_published: true,
            price: 0,
            total_plays: Math.min(parseInt(video.statistics.viewCount || '0'), 1000000), // Cap for display
            metadata: {
              source: 'youtube_trending',
              video_id: video.id,
              channel_title: video.snippet.channelTitle,
              imported_at: new Date().toISOString(),
              is_short: isShort,
              like_count: parseInt(video.statistics.likeCount || '0'),
              comment_count: parseInt(video.statistics.commentCount || '0'),
              auto_imported: true
            },
            published_at: video.snippet.publishedAt
          });

        if (error) {
          console.error(`Error importing video ${video.snippet.title}:`, error);
        } else {
          importedCount++;
          console.log(`✅ Imported: ${video.snippet.title} (${isShort ? 'SHORT' : 'VIDEO'})`);
        }

      } catch (error) {
        console.error(`Error processing video ${video.snippet.title}:`, error);
      }
    }

    // Clean up old auto-imported content (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { error: cleanupError } = await supabase
      .from('content')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .eq('metadata->auto_imported', true);

    if (cleanupError) {
      console.error('Error cleaning up old content:', cleanupError);
    } else {
      console.log('Cleaned up old auto-imported content');
    }

    const result = {
      success: true,
      processed: processedCount,
      imported: importedCount,
      timestamp: new Date().toISOString()
    };

    console.log('Auto-import completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-import-trending function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getYesterdayISO(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString();
}

function removeDuplicates(videos: any[]): any[] {
  const seen = new Set();
  return videos.filter(video => {
    if (seen.has(video.id)) {
      return false;
    }
    seen.add(video.id);
    return true;
  });
}

function parseDurationToSeconds(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
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

function determineCategory(tags: string[] = [], title: string = '', description: string = ''): string {
  const categories = {
    'Real Estate': ['real estate', 'property', 'realtor', 'housing', 'home', 'listing', 'mortgage', 'realty'],
    'Marketing': ['marketing', 'advertising', 'promotion', 'brand', 'social media', 'instagram', 'facebook', 'tiktok'],
    'Sales': ['sales', 'selling', 'negotiation', 'closing', 'lead', 'prospect', 'deal'],
    'Technology': ['tech', 'software', 'app', 'digital', 'ai', 'automation', 'saas', 'startup'],
    'Finance': ['finance', 'money', 'investment', 'trading', 'stocks', 'crypto', 'wealth'],
    'Leadership': ['leadership', 'management', 'team', 'coaching', 'mentor', 'boss', 'ceo'],
    'Training': ['training', 'education', 'tutorial', 'course', 'learn', 'teach', 'skill'],
    'Business Development': ['business', 'development', 'growth', 'strategy', 'planning', 'entrepreneur'],
    'Mindset': ['mindset', 'motivation', 'success', 'confidence', 'productivity', 'habits'],
    'Social Media': ['youtube', 'shorts', 'viral', 'trending', 'content', 'creator', 'influencer']
  };

  const allText = [...tags, title, description].join(' ').toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      return category;
    }
  }
  
  return 'Education'; // Default category
}

function shouldBeFeatured(video: any): boolean {
  const viewCount = parseInt(video.statistics.viewCount || '0');
  const likeCount = parseInt(video.statistics.likeCount || '0');
  
  // Feature videos with high engagement
  return viewCount > 100000 && likeCount > 1000;
}