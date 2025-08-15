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
        let url = vendor.website_url;
        // Ensure URL has protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        
        console.log('Fetching website content from:', url);
        const websiteResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          // Add timeout
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (websiteResponse.ok) {
          const htmlContent = await websiteResponse.text();
          // Extract text content from HTML (more robust approach)
          websiteContent = htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s.,!?-]/g, '') // Remove special characters
            .trim()
            .substring(0, 4000); // Increase to 4000 chars for better context
          
          console.log('Successfully fetched website content, length:', websiteContent.length);
        } else {
          console.log('Website response not ok:', websiteResponse.status, websiteResponse.statusText);
        }
      } catch (error) {
        console.log('Could not fetch website content:', error.message);
        // If direct fetch fails, try to get basic info from the URL structure
        if (vendor.website_url.includes('.com') || vendor.website_url.includes('.org') || vendor.website_url.includes('.net')) {
          websiteContent = `Company website: ${vendor.website_url}`;
        }
      }
    }

    // Prepare context for AI
    const vendorContext = `
Vendor Name: ${vendor.name}
Description: ${vendor.description || 'No description available'}
Industry/Type: ${vendor.vendor_type || 'General'}
Location: ${vendor.location || 'Not specified'}
Contact Email: ${vendor.contact_email || 'Not specified'}
Phone: ${vendor.phone || 'Not specified'}
States Served: ${vendor.license_states?.join(', ') || vendor.service_states?.join(', ') || 'Not specified'}
Website: ${vendor.website_url || 'Not specified'}
Website Content: ${websiteContent || 'No website content available'}
Services/Specialties: ${vendor.specialties?.join(', ') || 'Not specified'}
Verified Status: ${vendor.is_verified ? 'Verified' : 'Not verified'}
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
        model: 'gpt-5-mini-2025-08-07', // Use the more cost-effective model
        messages: [
          {
            role: 'system',
            content: `You are a professional business analyst specializing in vendor assessment for real estate professionals. Based on the provided vendor information and website content, generate specific, professional, and detailed answers for each of the 8 standardized vendor evaluation categories.

Requirements:
- Each answer should be 2-3 sentences that provide meaningful, actionable information
- Base answers on actual information provided, not generic statements
- If specific information isn't available, indicate "Based on available information" and provide what you can determine
- Focus on what would be most valuable for real estate agents to know
- Be specific about geographic coverage, services, and capabilities when mentioned

Return your response as a JSON object with question numbers as keys and detailed answers as values:
{
  "1": "Detailed answer for Service & Reliability based on vendor info",
  "2": "Detailed answer for Communication & Availability based on vendor info", 
  "3": "Detailed answer for Coverage & Licensing based on vendor info",
  "4": "Detailed answer for Product & Offering based on vendor info",
  "5": "Detailed answer for Reputation & Proof based on vendor info",
  "6": "Detailed answer for Local Presence based on vendor info",
  "7": "Detailed answer for Value Add & Differentiators based on vendor info",
  "8": "Detailed answer for Compliance & Professionalism based on vendor info"
}`
          },
          {
            role: 'user',
            content: `Based on this vendor information and their website content, provide specific and detailed answers for the 8 vendor evaluation categories:

${vendorContext}

The 8 categories with specific guidance:
1. Service & Reliability - What specific services do they provide? What evidence of reliability (years in business, track record, guarantees)?
2. Communication & Availability - How can they be contacted? What are their response times? Available hours/days?
3. Coverage & Licensing - What geographic areas do they serve? What states are they licensed in? Any restrictions?
4. Product & Offering - What specific products, services, or solutions do they offer? Price ranges if mentioned?
5. Reputation & Proof - What evidence of their reputation? Reviews, testimonials, awards, certifications, case studies?
6. Local Presence - Do they have local offices, representatives, or presence in specific markets? Local knowledge?
7. Value Add & Differentiators - What makes them unique? Special programs, exclusive offers, unique processes or technologies?
8. Compliance & Professionalism - Evidence of professional standards, certifications, industry compliance, associations?

Provide detailed, factual answers based on the available vendor information and website content. If specific information isn't available, indicate what is known and what would need verification.`
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