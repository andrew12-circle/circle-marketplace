import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContentMetrics {
  id: string;
  total_plays: number;
  rating: number;
  created_at: string;
  is_pro: boolean;
  title: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Starting top content promotion process...');

    // Fetch all published content with metrics
    const { data: allContent, error: fetchError } = await supabaseClient
      .from('content')
      .select('id, total_plays, rating, created_at, is_pro, title')
      .eq('is_published', true)
      .order('total_plays', { ascending: false });

    if (fetchError) {
      console.error('Error fetching content:', fetchError);
      throw fetchError;
    }

    if (!allContent || allContent.length === 0) {
      console.log('No content found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No content to process',
          promoted: 0,
          demoted: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${allContent.length} published content items`);

    // Calculate performance score for each content item
    // Score = (plays * 0.7) + (rating * plays * 0.3) to weight both plays and quality
    const contentWithScores = allContent.map((content: ContentMetrics) => ({
      ...content,
      score: (content.total_plays * 0.7) + (content.rating * content.total_plays * 0.3)
    }));

    // Sort by score (highest first)
    contentWithScores.sort((a, b) => b.score - a.score);

    // Calculate top 20% threshold
    const top20PercentCount = Math.ceil(contentWithScores.length * 0.2);
    
    console.log(`Top 20% threshold: ${top20PercentCount} items out of ${contentWithScores.length}`);

    // Identify content that should be pro (top 20%)
    const topContent = contentWithScores.slice(0, top20PercentCount);
    const remainingContent = contentWithScores.slice(top20PercentCount);

    // Get IDs for batch updates
    const shouldBeProIds = topContent.map(c => c.id);
    const shouldNotBeProIds = remainingContent.map(c => c.id);

    let promotedCount = 0;
    let demotedCount = 0;

    // Promote content to pro status
    if (shouldBeProIds.length > 0) {
      const { error: promoteError } = await supabaseClient
        .from('content')
        .update({ is_pro: true })
        .in('id', shouldBeProIds)
        .neq('is_pro', true); // Only update if not already pro

      if (promoteError) {
        console.error('Error promoting content:', promoteError);
        throw promoteError;
      }

      // Count newly promoted items
      const newlyPromoted = topContent.filter(c => !c.is_pro);
      promotedCount = newlyPromoted.length;
      
      console.log(`Promoted ${promotedCount} content items to pro status`);
      if (promotedCount > 0) {
        console.log('Newly promoted content:', newlyPromoted.map(c => c.title));
      }
    }

    // Demote content from pro status (if they fall out of top 20%)
    if (shouldNotBeProIds.length > 0) {
      const { error: demoteError } = await supabaseClient
        .from('content')
        .update({ is_pro: false })
        .in('id', shouldNotBeProIds)
        .eq('is_pro', true); // Only update if currently pro

      if (demoteError) {
        console.error('Error demoting content:', demoteError);
        throw demoteError;
      }

      // Count newly demoted items
      const newlyDemoted = remainingContent.filter(c => c.is_pro);
      demotedCount = newlyDemoted.length;
      
      console.log(`Demoted ${demotedCount} content items from pro status`);
      if (demotedCount > 0) {
        console.log('Newly demoted content:', newlyDemoted.map(c => c.title));
      }
    }

    console.log('Top content promotion process completed successfully');

    const response = {
      success: true,
      message: 'Top content promotion completed',
      totalContent: allContent.length,
      top20PercentCount,
      promoted: promotedCount,
      demoted: demotedCount,
      topContent: topContent.slice(0, 5).map(c => ({ // Return top 5 for reference
        title: c.title,
        score: c.score,
        total_plays: c.total_plays,
        rating: c.rating
      }))
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in promote-top-content function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});