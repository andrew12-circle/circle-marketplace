import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, serviceId, batchSize = 10 } = await req.json();

    if (action === 'process-batch') {
      // Start background batch processing
      EdgeRuntime.waitUntil(processBatch(supabase, batchSize));
      
      return new Response(
        JSON.stringify({ message: 'Batch vectorization started', status: 'processing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'process-single' && serviceId) {
      // Process a single service image
      const result = await processSingleImage(supabase, serviceId);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get-status') {
      // Get processing status
      const status = await getProcessingStatus(supabase);
      
      return new Response(
        JSON.stringify(status),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vectorize-images function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processBatch(supabase: any, batchSize: number) {
  try {
    console.log(`Starting batch processing with size: ${batchSize}`);
    
    // Get services with non-vector images
    const { data: services, error } = await supabase
      .from('services')
      .select('id, image_url')
      .not('image_url', 'is', null)
      .not('image_url', 'like', '%.svg')
      .is('vectorized_image_url', null)
      .limit(batchSize);

    if (error) {
      console.error('Error fetching services:', error);
      return;
    }

    console.log(`Found ${services?.length || 0} services to process`);

    for (const service of services || []) {
      try {
        await processSingleImage(supabase, service.id);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing service ${service.id}:`, error);
        
        // Log the error in the database
        await supabase
          .from('image_processing_log')
          .insert({
            service_id: service.id,
            status: 'error',
            error_message: error.message,
            processed_at: new Date().toISOString()
          });
      }
    }

    console.log('Batch processing completed');
  } catch (error) {
    console.error('Error in batch processing:', error);
  }
}

async function processSingleImage(supabase: any, serviceId: string) {
  try {
    // Get the service and its image
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, image_url, title')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service?.image_url) {
      throw new Error('Service or image not found');
    }

    console.log(`Processing service: ${service.title} (${serviceId})`);

    // Check if already processed
    if (service.image_url.endsWith('.svg')) {
      return { status: 'skipped', message: 'Already a vector image' };
    }

    // Download the original image
    const imageResponse = await fetch(service.image_url);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    // Use AI to create a vector description
    const vectorDescription = await generateVectorDescription(base64Image, service.title);
    
    // Generate SVG based on the description
    const svgContent = await generateSVG(vectorDescription, service.title);
    
    // Upload the new SVG to Supabase Storage
    const fileName = `${serviceId}-vector-${Date.now()}.svg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('service-images')
      .upload(fileName, svgContent, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('service-images')
      .getPublicUrl(fileName);

    // Update the service with the new vector image URL
    const { error: updateError } = await supabase
      .from('services')
      .update({
        vectorized_image_url: publicUrlData.publicUrl,
        original_image_url: service.image_url // Backup original
      })
      .eq('id', serviceId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // Log success
    await supabase
      .from('image_processing_log')
      .insert({
        service_id: serviceId,
        status: 'success',
        original_url: service.image_url,
        vectorized_url: publicUrlData.publicUrl,
        processed_at: new Date().toISOString()
      });

    console.log(`Successfully processed service ${serviceId}`);
    
    return {
      status: 'success',
      originalUrl: service.image_url,
      vectorizedUrl: publicUrlData.publicUrl
    };

  } catch (error) {
    console.error(`Error processing service ${serviceId}:`, error);
    throw error;
  }
}

async function generateVectorDescription(base64Image: string, title: string): Promise<string> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert at analyzing images and creating detailed descriptions for vector graphics. 
            Your task is to analyze the provided image for the service "${title}" and create a detailed description that can be used to generate a clean, simple SVG vector version.
            
            Focus on:
            - Main shapes and geometric elements
            - Color scheme (use web-safe colors)
            - Key visual elements and their relationships
            - Simple, clean design principles
            - Icon-like representation if applicable
            
            Return only a detailed description suitable for SVG generation, no other text.`
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 500,
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('Gemini API response:', data);
    throw new Error('Failed to generate vector description with Gemini');
  }

  return data.candidates[0].content.parts[0].text;
}

async function generateSVG(description: string, title: string): Promise<string> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert SVG creator. Generate clean, professional SVG code based on descriptions.
            
            Requirements:
            - Create valid SVG with viewBox="0 0 200 200"
            - Use modern, clean design principles
            - Use web-safe colors and gradients
            - Make it scalable and professional
            - Include proper accessibility attributes
            - Keep the design simple but recognizable
            - Return only the SVG code, no other text or markdown
            
            Create an SVG for "${title}" based on this description: ${description}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      topK: 32,
      topP: 1,
      maxOutputTokens: 1000,
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('Gemini API response:', data);
    throw new Error('Failed to generate SVG with Gemini');
  }

  let svgContent = data.candidates[0].content.parts[0].text.trim();
  
  // Clean up the response - remove markdown code blocks if present
  svgContent = svgContent.replace(/```svg\n?/g, '').replace(/```\n?/g, '');
  
  // Ensure it starts with <svg
  if (!svgContent.startsWith('<svg')) {
    throw new Error('Generated content is not valid SVG');
  }

  return svgContent;
}

async function getProcessingStatus(supabase: any) {
  try {
    // Get total counts
    const { count: totalServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .not('image_url', 'is', null);

    const { count: processedServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .not('vectorized_image_url', 'is', null);

    const { count: pendingServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .not('image_url', 'is', null)
      .not('image_url', 'like', '%.svg')
      .is('vectorized_image_url', null);

    // Get recent processing logs
    const { data: recentLogs } = await supabase
      .from('image_processing_log')
      .select('*')
      .order('processed_at', { ascending: false })
      .limit(10);

    return {
      total: totalServices || 0,
      processed: processedServices || 0,
      pending: pendingServices || 0,
      recentLogs: recentLogs || []
    };
  } catch (error) {
    console.error('Error getting status:', error);
    return {
      total: 0,
      processed: 0,
      pending: 0,
      recentLogs: [],
      error: error.message
    };
  }
}