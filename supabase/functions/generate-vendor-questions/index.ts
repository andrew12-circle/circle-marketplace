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
    const { vendorId, vendorData } = await req.json();
    
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

    console.log('Generating questions for vendor:', vendor.name);

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

    // Generate intelligent questions using OpenAI
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
            content: `You are an expert in real estate services and vendor evaluation. Generate exactly 7 highly specific, intelligent evaluation questions for the given vendor based on their actual business, services, and industry. 

The questions should be:
1. Specific to their actual business model and services
2. Relevant to what agents would really want to know
3. Professional and actionable
4. Different from generic questions
5. Based on their website content and business details when available

Return ONLY a JSON array of exactly 7 questions in this format:
[
  "Question 1 text here?",
  "Question 2 text here?",
  "Question 3 text here?",
  "Question 4 text here?",
  "Question 5 text here?",
  "Question 6 text here?",
  "Question 7 text here?"
]

Focus on practical concerns like: service delivery, communication, coverage areas, pricing structure, technology tools, track record, and unique value propositions.`
          },
          {
            role: 'user',
            content: `Generate 7 intelligent evaluation questions for this vendor:\n\n${vendorContext}`
          }
        ],
        max_completion_tokens: 1000
      }),
    });

    const aiData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', aiData);
      throw new Error(`OpenAI API error: ${aiData.error?.message || 'Unknown error'}`);
    }

    const generatedQuestions = JSON.parse(aiData.choices[0].message.content);
    
    if (!Array.isArray(generatedQuestions) || generatedQuestions.length !== 7) {
      throw new Error('Invalid response format from AI');
    }

    console.log('Generated questions:', generatedQuestions);

    // Delete existing questions for this vendor
    await supabase
      .from('vendor_questions')
      .delete()
      .eq('vendor_id', vendorId);

    // Insert new questions
    const questionsData = generatedQuestions.map((question, index) => ({
      vendor_id: vendorId,
      question_number: index + 1,
      question_text: question
    }));

    const { error: insertError } = await supabase
      .from('vendor_questions')
      .insert(questionsData);

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to save questions: ${insertError.message}`);
    }

    console.log('Successfully generated and saved questions for vendor:', vendor.name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${generatedQuestions.length} intelligent questions for ${vendor.name}`,
        questions: generatedQuestions
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