import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, anon_id, answer_id, helpful, reason } = await req.json();

    if (!answer_id || typeof helpful !== 'boolean') {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: answer_id, helpful' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store feedback
    const { data, error } = await supabase
      .from('concierge_feedback')
      .insert({
        user_id: user_id || null,
        anon_id: anon_id || null,
        answer_id,
        helpful,
        reason: reason || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If feedback is negative, we could trigger additional actions like:
    // - Flagging the conversation for human review
    // - Adjusting confidence scoring for similar queries
    // - Triggering a follow-up flow
    
    if (!helpful) {
      console.log(`Negative feedback received for answer ${answer_id}:`, reason);
      
      // Could implement automatic escalation logic here
      // For example, if multiple negative feedback instances, lower confidence thresholds
    }

    return new Response(JSON.stringify({
      success: true,
      feedback_id: data.id,
      message: helpful ? 'Thanks for the positive feedback!' : 'Thanks for the feedback. We\'ll use this to improve.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in concierge-feedback:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});