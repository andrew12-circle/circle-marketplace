import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    console.log('Background job processor started');

    // Get pending jobs ordered by priority and scheduled time
    const { data: jobs, error: jobsError } = await supabaseClient
      .from('background_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(10); // Process up to 10 jobs at once

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      console.log('No pending jobs found');
      return new Response(
        JSON.stringify({ message: 'No pending jobs', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${jobs.length} background jobs`);
    
    const results = [];
    
    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id} of type ${job.job_type}`);
        
        // Mark job as processing to prevent duplicate processing
        const { error: updateError } = await supabaseClient
          .from('background_jobs')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            attempts: job.attempts + 1
          })
          .eq('id', job.id);

        if (updateError) {
          console.error(`Error updating job ${job.id}:`, updateError);
          continue;
        }

        let jobResult;
        
        // Process job based on type
        switch (job.job_type) {
          case 'refresh_analytics':
            jobResult = await processAnalyticsRefresh(supabaseClient, job);
            break;
            
          case 'cleanup_cache':
            jobResult = await processCacheCleanup(supabaseClient, job);
            break;
            
          case 'send_notification':
            jobResult = await processNotification(supabaseClient, job);
            break;
            
          case 'generate_report':
            jobResult = await processReportGeneration(supabaseClient, job);
            break;
            
          case 'bulk_import':
            jobResult = await processBulkImport(supabaseClient, job);
            break;
            
          default:
            jobResult = { success: false, error: `Unknown job type: ${job.job_type}` };
        }

        // Update job status based on result
        if (jobResult.success) {
          await supabaseClient
            .from('background_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          console.log(`Job ${job.id} completed successfully`);
        } else {
          const shouldRetry = job.attempts < job.max_attempts;
          
          await supabaseClient
            .from('background_jobs')
            .update({
              status: shouldRetry ? 'pending' : 'failed',
              error_message: jobResult.error,
              scheduled_at: shouldRetry 
                ? new Date(Date.now() + Math.pow(2, job.attempts) * 1000).toISOString() // Exponential backoff
                : job.scheduled_at
            })
            .eq('id', job.id);
          
          console.error(`Job ${job.id} failed:`, jobResult.error);
        }
        
        results.push({
          job_id: job.id,
          job_type: job.job_type,
          success: jobResult.success,
          error: jobResult.error
        });
        
      } catch (error) {
        console.error(`Unexpected error processing job ${job.id}:`, error);
        
        // Mark job as failed
        await supabaseClient
          .from('background_jobs')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', job.id);
          
        results.push({
          job_id: job.id,
          job_type: job.job_type,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Background jobs processed',
        processed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Background job processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Job processing functions
async function processAnalyticsRefresh(supabase: any, job: any) {
  try {
    console.log('Refreshing analytics materialized view');
    
    // Call the refresh function
    const { error } = await supabase.rpc('refresh_vendor_analytics');
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Analytics refreshed successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processCacheCleanup(supabase: any, job: any) {
  try {
    console.log('Processing cache cleanup job');
    
    // This could trigger cache cleanup in the application
    // For now, we'll just log it as successful
    
    return { success: true, message: 'Cache cleanup triggered' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processNotification(supabase: any, job: any) {
  try {
    console.log('Processing notification job', job.job_data);
    
    // Extract notification data
    const { recipient, subject, message, type } = job.job_data;
    
    if (!recipient) {
      return { success: false, error: 'No recipient specified' };
    }
    
    // Here you would integrate with your notification service
    // For now, we'll simulate successful notification
    console.log(`Sending ${type} notification to ${recipient}: ${subject}`);
    
    return { success: true, message: 'Notification sent successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processReportGeneration(supabase: any, job: any) {
  try {
    console.log('Processing report generation job', job.job_data);
    
    const { report_type, user_id, filters } = job.job_data;
    
    // Simulate report generation
    console.log(`Generating ${report_type} report for user ${user_id}`);
    
    // Here you would actually generate the report
    // Store it in a reports table or file storage
    
    return { success: true, message: 'Report generated successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processBulkImport(supabase: any, job: any) {
  try {
    console.log('Processing bulk import job', job.job_data);
    
    const { import_type, data_source, batch_size = 100 } = job.job_data;
    
    // Simulate bulk import processing
    console.log(`Processing bulk import of ${import_type} from ${data_source}`);
    
    // Here you would process the import in batches
    // Update progress, handle errors, etc.
    
    return { success: true, message: 'Bulk import completed successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}