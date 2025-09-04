import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceBatch {
  services: any[];
  customPrompts?: {
    details?: string;
    disclaimer?: string;
    funnel?: string;
    faqs?: string;
  };
  overwriteAIUpdated?: boolean;
  batchId: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { services, customPrompts, overwriteAIUpdated, batchId }: ServiceBatch = await req.json();

    console.log(`🚀 Starting bulk processing for batch ${batchId} with ${services.length} services`);

    // Create a background task for processing all services
    const processAllServices = async () => {
      let completedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const service of services) {
        try {
          console.log(`🔄 Processing service: ${service.title} (${completedCount + 1}/${services.length})`);
          
          // Update batch status
          await supabaseClient
            .from('ai_batch_status')
            .upsert({
              batch_id: batchId,
              current_service: service.title,
              completed_count: completedCount,
              total_count: services.length,
              error_count: errorCount,
              status: 'processing',
              last_updated: new Date().toISOString()
            });

          // Check if already AI updated and skip if needed
          if (!overwriteAIUpdated) {
            const { data: existingUpdates } = await supabaseClient
              .from('service_update_tracking')
              .select('section_name')
              .eq('service_id', service.id)
              .eq('section_name', 'details');

            if (existingUpdates && existingUpdates.length > 0) {
              console.log(`⏭️ ${service.title} - already AI updated, skipping`);
              completedCount++;
              continue;
            }
          }

          // Process each section sequentially
          const sections = ['research', 'details', 'disclaimer', 'funnel', 'faqs'];
          let researchData = null;

          for (const section of sections) {
            try {
              console.log(`📝 Processing ${section} for ${service.title}`);
              
              const { data, error } = await supabaseClient.functions.invoke('ai-service-generator', {
                body: {
                  type: section,
                  service: {
                    ...service,
                    existing_research: researchData
                  },
                  customPrompt: customPrompts?.[section as keyof typeof customPrompts]
                }
              });

              if (error) {
                console.error(`❌ Error in ${section} for ${service.title}:`, error);
                throw error;
              }

              // Store research data for subsequent sections
              if (section === 'research') {
                researchData = data;
              }

              // Record the update
              await supabaseClient
                .from('service_update_tracking')
                .insert({
                  service_id: service.id,
                  section_name: section,
                  notes: `AI generated ${section} section (batch ${batchId})`
                });

              console.log(`✅ Completed ${section} for ${service.title}`);
              
              // Small delay between sections
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (sectionError) {
              console.error(`❌ Error in ${section} for ${service.title}:`, sectionError);
              errors.push(`${service.title} - ${section}: ${sectionError.message}`);
            }
          }

          // Auto-verify if all sections completed
          await supabaseClient.functions.invoke('ai-service-generator', {
            body: {
              type: 'verification',
              service: service
            }
          });

          completedCount++;
          console.log(`✅ Completed service: ${service.title} (${completedCount}/${services.length})`);

        } catch (serviceError) {
          console.error(`❌ Failed to process service ${service.title}:`, serviceError);
          errorCount++;
          errors.push(`${service.title}: ${serviceError.message}`);
        }

        // Delay between services to avoid rate limits
        if (completedCount + errorCount < services.length) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Final status update
      await supabaseClient
        .from('ai_batch_status')
        .upsert({
          batch_id: batchId,
          current_service: 'Completed',
          completed_count: completedCount,
          total_count: services.length,
          error_count: errorCount,
          status: completedCount === services.length ? 'completed' : 'completed_with_errors',
          errors: errors.length > 0 ? errors : null,
          completed_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        });

      console.log(`🎉 Batch ${batchId} completed: ${completedCount} successful, ${errorCount} errors`);
    };

    // Use EdgeRuntime.waitUntil to run the process in the background
    EdgeRuntime.waitUntil(processAllServices());

    // Initialize batch status
    await supabaseClient
      .from('ai_batch_status')
      .upsert({
        batch_id: batchId,
        current_service: 'Starting...',
        completed_count: 0,
        total_count: services.length,
        error_count: 0,
        status: 'started',
        started_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });

    console.log(`✅ Background processing started for batch ${batchId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Background processing started for ${services.length} services`,
        batchId: batchId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('❌ Bulk processing error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});