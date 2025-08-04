// 4. QUEUE SYSTEM FOR BULK ACTIONS: Background processing for heavy operations
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

    // Process pending jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    const processedJobs = [];

    for (const job of jobs || []) {
      try {
        console.log(`Processing job ${job.id} of type ${job.job_type}`);
        
        const result = await supabase.rpc('process_background_job', { 
          job_id: job.id 
        });

        if (result.error) {
          console.error(`Job ${job.id} failed:`, result.error);
          processedJobs.push({ 
            id: job.id, 
            status: 'failed', 
            error: result.error.message 
          });
        } else {
          console.log(`Job ${job.id} completed successfully`);
          processedJobs.push({ 
            id: job.id, 
            status: 'completed', 
            result: result.data 
          });
        }
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        
        // Update job as failed if max attempts reached
        await supabase
          .from('background_jobs')
          .update({ 
            status: 'failed', 
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        processedJobs.push({ 
          id: job.id, 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    // Clean up old completed/failed jobs (older than 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { error: cleanupError } = await supabase
      .from('background_jobs')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('updated_at', yesterday.toISOString());

    if (cleanupError) {
      console.warn('Failed to cleanup old jobs:', cleanupError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedJobs.length,
        jobs: processedJobs
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Background job processor error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});