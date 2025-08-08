import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System user UUID for auto-imported content
const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000001';

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

    // Real estate focused search terms for targeted content
    const realEstateSearchTerms = [
      'real estate agent training',
      'realtor marketing tips',
      'real estate sales techniques', 
      'listing presentation tips',
      'real estate prospecting',
      'real estate lead generation',
      'realtor social media',
      'real estate negotiation',
      'first time home buyer tips',
      'real estate market analysis',
      'realtor mindset',
      'real estate investing basics',
      'property valuation tips',
      'real estate photography',
      'realtor business plan'
    ];

    let allVideos = [];
    let processedCount = 0;
    let importedCount = 0;

    // Search for real estate educational content
    for (const searchTerm of realEstateSearchTerms) {
      console.log(`Searching for: ${searchTerm}...`);
      
      try {
        // Search for educational videos with high view counts
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchTerm)}&type=video&order=relevance&publishedAfter=${getLastWeekISO()}&maxResults=10&key=${youtubeApiKey}`
        );
        const searchData = await searchResponse.json();

        if (searchData.items && searchData.items.length > 0) {
          // Get detailed video information
          const videoIds = searchData.items.map((video: any) => video.id.videoId).join(',');
          const detailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${youtubeApiKey}`
          );
          const detailsData = await detailsResponse.json();
          
          if (detailsData.items) {
            // Filter for quality content (minimum view threshold)
            const qualityVideos = detailsData.items.filter((video: any) => {
              const viewCount = parseInt(video.statistics.viewCount || '0');
              return viewCount > 1000; // Minimum 1k views for quality filter
            });
            
            allVideos.push(...qualityVideos);
          }
        }
      } catch (error) {
        console.error(`Error searching for ${searchTerm}:`, error);
      }
    }

    // Also search for real estate shorts and quick tips
    console.log('Searching for real estate shorts and tips...');
    try {
      const shortsTerms = ['real estate tips', 'realtor shorts', 'real estate hacks', 'realtor advice'];
      
      for (const term of shortsTerms) {
        const shortsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(term + ' shorts')}&type=video&order=relevance&publishedAfter=${getLastWeekISO()}&maxResults=5&key=${youtubeApiKey}`
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
              // Filter for actual shorts (under 60 seconds) with real estate content
              const realEstateShorts = detailsData.items.filter((video: any) => {
                const duration = parseDurationToSeconds(video.contentDetails.duration);
                const content = (video.snippet.title + ' ' + video.snippet.description).toLowerCase();
                const hasRealEstateContent = ['real estate', 'realtor', 'agent', 'property', 'listing', 'home', 'buyer', 'seller'].some(keyword => content.includes(keyword));
                return duration <= 60 && hasRealEstateContent;
              });
              
              allVideos.push(...realEstateShorts);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching real estate shorts:', error);
    }

    // Remove duplicates and filter quality content
    const uniqueVideos = removeDuplicates(allVideos);
    console.log(`Found ${uniqueVideos.length} unique videos to process`);

    // Use system user for all auto-imported content
    const adminUserId = SYSTEM_USER_UUID;

    // Process each video
    for (const video of uniqueVideos) {
      try {
        processedCount++;
        
        // Additional real estate content filtering
        const content = video.snippet.title + ' ' + (video.snippet.description || '');
        const isRealEstateRelevant = isRealEstateContent(content, video.snippet.tags || []);
        
        if (!isRealEstateRelevant) {
          console.log(`Skipping non-real estate content: ${video.snippet.title}`);
          continue;
        }

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
        
        // Auto-categorize based on real estate focus
        const category = determineRealEstateCategory(
          video.snippet.tags || [], 
          video.snippet.title, 
          video.snippet.description || ''
        );

        // Import the video with system user UUID
        const { error } = await supabase
          .from('content')
          .insert({
            creator_id: SYSTEM_USER_UUID, // Use system user UUID
            title: video.snippet.title,
            description: video.snippet.description || '',
            content_type: isShort ? 'short' : 'video',
            category: category,
            content_url: `https://www.youtube.com/watch?v=${video.id}`,
            cover_image_url: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url,
            duration: duration,
            is_published: true,
            is_featured: shouldBeFeatured(video),
            tags: video.snippet.tags || [],
            metadata: {
              youtube_video_id: video.id,
              channel_title: video.snippet.channelTitle,
              published_at: video.snippet.publishedAt,
              view_count: parseInt(video.statistics?.viewCount || '0'),
              like_count: parseInt(video.statistics?.likeCount || '0'),
              comment_count: parseInt(video.statistics?.commentCount || '0'),
              auto_imported: true,
              import_date: new Date().toISOString(),
              search_relevance: 'trending'
            }
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

function getLastWeekISO(): string {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return lastWeek.toISOString();
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

function determineRealEstateCategory(tags: string[] = [], title: string = '', description: string = ''): string {
  const categories = {
    'Lead Generation': ['lead generation', 'prospecting', 'finding clients', 'cold calling', 'referrals', 'sphere of influence', 'lead magnet', 'crm'],
    'Marketing': ['marketing', 'advertising', 'social media', 'instagram', 'facebook', 'branding', 'content creation', 'video marketing', 'photography'],
    'Sales': ['sales', 'closing', 'negotiation', 'objection handling', 'buyer consultation', 'listing presentation', 'scripts', 'conversion'],
    'Listing & Selling': ['listing', 'seller', 'pricing strategy', 'staging', 'market analysis', 'cma', 'valuation', 'home preparation'],
    'Buyer Services': ['buyer', 'first time buyer', 'home search', 'buyer consultation', 'showing homes', 'offers', 'contracts'],
    'Technology': ['tech', 'software', 'app', 'digital', 'ai', 'automation', 'mls', 'crm', 'virtual tour', 'drone'],
    'Finance & Investment': ['finance', 'mortgage', 'investment', 'flipping', 'rental', 'financing', 'loans', 'interest rates'],
    'Mindset & Success': ['mindset', 'motivation', 'success', 'confidence', 'productivity', 'habits', 'goal setting', 'time management'],
    'Market Knowledge': ['market', 'trends', 'economics', 'interest rates', 'housing market', 'market update', 'statistics'],
    'Business Development': ['business', 'team building', 'scaling', 'growth', 'systems', 'processes', 'entrepreneurship']
  };

  const allText = [...tags, title, description].join(' ').toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      return category;
    }
  }
  
  return 'Real Estate Training'; // Default category for real estate content
}

function isRealEstateContent(content: string, tags: string[] = []): boolean {
  const realEstateKeywords = [
    'real estate', 'realtor', 'agent', 'property', 'listing', 'home', 'house',
    'buyer', 'seller', 'mortgage', 'mls', 'commission', 'closing', 'escrow',
    'appraisal', 'inspection', 'showing', 'open house', 'market', 'investment',
    'rental', 'landlord', 'tenant', 'lease', 'deed', 'title', 'financing',
    'pre-approval', 'down payment', 'equity', 'appreciation', 'depreciation'
  ];

  const allText = [...tags, content].join(' ').toLowerCase();
  
  // Must contain at least 2 real estate keywords to be considered relevant
  const keywordMatches = realEstateKeywords.filter(keyword => allText.includes(keyword));
  return keywordMatches.length >= 2;
}

function shouldBeFeatured(video: any): boolean {
  const viewCount = parseInt(video.statistics.viewCount || '0');
  const likeCount = parseInt(video.statistics.likeCount || '0');
  
  // Feature videos with high engagement
  return viewCount > 100000 && likeCount > 1000;
}