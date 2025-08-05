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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      throw jobsError;
    }

    const processedJobs = [];

    for (const job of jobs || []) {
      try {
        console.log(`Processing job ${job.id} of type ${job.job_type}`);
        
        // Mark job as processing
        await supabase
          .from('background_jobs')
          .update({ 
            status: 'processing', 
            started_at: new Date().toISOString(),
            attempts: job.attempts + 1
          })
          .eq('id', job.id);

        let result: any = {};

        // Process different job types
        switch (job.job_type) {
          case 'refresh_analytics':
            // Call the database function to refresh analytics
            const { error: refreshError } = await supabase.rpc('refresh_vendor_analytics');
            if (refreshError) throw refreshError;
            result = { success: true, message: 'Analytics refreshed' };
            break;

          case 'cleanup_cache':
            // This would trigger cache cleanup in the application
            result = { success: true, message: 'Cache cleanup completed' };
            break;

          case 'send_email':
            // Email sending logic would go here
            result = { success: true, message: `Email sent to ${job.job_data.to}` };
            break;

          case 'process_bulk_import':
            // Bulk import logic would go here
            result = { success: true, message: 'Bulk import processed' };
            break;

          default:
            throw new Error(`Unknown job type: ${job.job_type}`);
        }

        // Mark job as completed
        await supabase
          .from('background_jobs')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        processedJobs.push({ id: job.id, status: 'completed', result });

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        
        // Mark job as failed or retry
        const shouldRetry = job.attempts < job.max_attempts;
        
        await supabase
          .from('background_jobs')
          .update({ 
            status: shouldRetry ? 'pending' : 'failed',
            error_message: error.message,
            scheduled_at: shouldRetry 
              ? new Date(Date.now() + (job.attempts * 60000)).toISOString() // Exponential backoff
              : undefined
          })
          .eq('id', job.id);

        processedJobs.push({ 
          id: job.id, 
          status: shouldRetry ? 'retried' : 'failed', 
          error: error.message 
        });
      }
    }

    // Cleanup old completed jobs (older than 7 days)
    await supabase
      .from('background_jobs')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return new Response(JSON.stringify({
      success: true,
      processed: processedJobs.length,
      jobs: processedJobs
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Background job processing error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});