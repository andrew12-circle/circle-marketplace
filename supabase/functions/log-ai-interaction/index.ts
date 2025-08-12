import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { userId, query, recommendation, intentType, resultType, timestamp } = await req.json();

    console.log('Logging AI interaction:', { userId, intentType, resultType });

    // Log the interaction for rapid learning
    const { error: logError } = await supabase
      .from('ai_interaction_logs')
      .insert({
        user_id: userId,
        query_text: query,
        recommendation_text: recommendation,
        intent_type: intentType,
        result_type: resultType,
        interaction_timestamp: timestamp,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging AI interaction:', logError);
    }

    // Track query patterns for rapid learning
    await updateQueryPatterns(supabase, intentType, query);

    // Update user interaction history for personalization
    await updateUserPersonalization(supabase, userId, intentType, query);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in log-ai-interaction function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function updateQueryPatterns(supabase: any, intentType: string, query: string) {
  try {
    // Extract keywords for pattern analysis
    const keywords = extractKeywords(query);
    
    // Update or insert query pattern
    const { error } = await supabase
      .from('ai_query_patterns')
      .upsert({
        intent_type: intentType,
        keywords: keywords,
        frequency: 1,
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'intent_type,keywords',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error updating query patterns:', error);
    }
  } catch (error) {
    console.error('Error in updateQueryPatterns:', error);
  }
}

async function updateUserPersonalization(supabase: any, userId: string, intentType: string, query: string) {
  try {
    // Get user's intent history
    const { data: existingData } = await supabase
      .from('user_ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('intent_type', intentType)
      .single();

    if (existingData) {
      // Update frequency and last interaction
      await supabase
        .from('user_ai_preferences')
        .update({
          frequency: existingData.frequency + 1,
          last_query: query,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
    } else {
      // Create new preference record
      await supabase
        .from('user_ai_preferences')
        .insert({
          user_id: userId,
          intent_type: intentType,
          frequency: 1,
          last_query: query,
          created_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error updating user personalization:', error);
  }
}

function extractKeywords(query: string): string[] {
  // Extract meaningful keywords for pattern matching
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'me', 'my', 'you', 'your', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can'];
  
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 10); // Limit to top 10 keywords
}