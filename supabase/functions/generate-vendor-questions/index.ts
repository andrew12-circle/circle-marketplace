import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vendorId } = await req.json();
    
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get vendor information
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (vendorError) {
      throw new Error(`Failed to fetch vendor: ${vendorError.message}`);
    }

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    console.log('Generating AI answers for vendor:', vendor.name);

    // Get standardized questions for this vendor
    const { data: questions, error: questionsError } = await supabase
      .from('vendor_questions')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('question_number');

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }

    if (!questions || questions.length === 0) {
      throw new Error('No questions found for vendor. Questions should be auto-created.');
    }

    // Fetch website content if available
    let websiteContent = '';
    if (vendor.website_url) {
      try {
        console.log('Fetching website content from:', vendor.website_url);
        const websiteResponse = await fetch(vendor.website_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; QuestionGenerator/1.0)'
          }
        });
        
        if (websiteResponse.ok) {
          const htmlContent = await websiteResponse.text();
          // Extract text content from HTML (simple approach)
          websiteContent = htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 3000); // Limit to first 3000 chars
        }
      } catch (error) {
        console.log('Could not fetch website content:', error.message);
      }
    }

    // Prepare context for AI
    const vendorContext = `
Vendor Name: ${vendor.name}
Description: ${vendor.description || 'No description available'}
Industry: ${vendor.vendor_type || 'General'}
Location: ${vendor.location || 'Not specified'}
States Served: ${vendor.license_states?.join(', ') || vendor.service_states?.join(', ') || 'Not specified'}
Website Content Preview: ${websiteContent || 'No website content available'}
    `.trim();

    console.log('Vendor context prepared, calling OpenAI...');

    // Generate intelligent answers using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a professional business analyst specializing in vendor assessment. Based on the provided vendor information, generate specific, professional answers for each of the 8 standardized vendor evaluation categories. Each answer should be 1-2 sentences, factual, and based on the available information.

Return your response as a JSON object with question numbers as keys and answers as values:
{
  "1": "Answer for Service & Reliability",
  "2": "Answer for Communication & Availability", 
  "3": "Answer for Coverage & Licensing",
  "4": "Answer for Product & Offering",
  "5": "Answer for Reputation & Proof",
  "6": "Answer for Local Presence",
  "7": "Answer for Value Add & Differentiators",
  "8": "Answer for Compliance & Professionalism"
}`
          },
          {
            role: 'user',
            content: `Based on this vendor information, provide specific answers for the 8 vendor evaluation categories:

${vendorContext}

The 8 categories are:
1. Service & Reliability - What services do they provide and how reliable are they?
2. Communication & Availability - How do they communicate and what are their availability hours?
3. Coverage & Licensing - What geographic areas do they serve and what licenses do they hold?
4. Product & Offering - What specific products or services do they offer?
5. Reputation & Proof - What evidence is there of their reputation and track record?
6. Local Presence - Do they have local presence in specific markets?
7. Value Add & Differentiators - What makes them unique or different from competitors?
8. Compliance & Professionalism - How do they demonstrate compliance and professionalism?

Please provide factual, professional answers based on the available information.`
          }
        ],
        max_completion_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    const aiData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', aiData);
      throw new Error(`OpenAI API error: ${aiData.error?.message || 'Unknown error'}`);
    }

    const generatedAnswers = JSON.parse(aiData.choices[0].message.content);
    
    console.log('Generated answers:', Object.keys(generatedAnswers).length, 'answers');

    // Update questions with AI-generated answers
    const updates = [];
    for (const question of questions) {
      const answerKey = question.question_number.toString();
      if (generatedAnswers[answerKey]) {
        updates.push(
          supabase
            .from('vendor_questions')
            .update({
              answer_text: generatedAnswers[answerKey],
              ai_generated: true,
              manually_updated: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', question.id)
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log('Successfully updated', updates.length, 'question answers');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated AI answers for ${updates.length} questions for ${vendor.name}`,
        answers: generatedAnswers
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-vendor-questions function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});