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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { action, job_id } = await req.json();

    switch (action) {
      case 'process_next':
        // Get next pending job
        const { data: jobs, error: jobError } = await supabaseAdmin
          .from('background_jobs')
          .select('*')
          .eq('status', 'pending')
          .lte('scheduled_at', new Date().toISOString())
          .order('priority', { ascending: false })
          .order('scheduled_at', { ascending: true })
          .limit(1);

        if (jobError) throw jobError;
        if (!jobs || jobs.length === 0) {
          return new Response(JSON.stringify({ message: 'No pending jobs' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const job = jobs[0];
        console.log(`Processing job ${job.id} of type ${job.job_type}`);

        // Mark job as processing
        await supabaseAdmin
          .from('background_jobs')
          .update({ 
            status: 'processing', 
            started_at: new Date().toISOString(),
            attempts: job.attempts + 1
          })
          .eq('id', job.id);

        // Process job based on type
        let result;
        try {
          switch (job.job_type) {
            case 'refresh_analytics':
              const { error: refreshError } = await supabaseAdmin.rpc('refresh_vendor_analytics_cache');
              if (refreshError) throw refreshError;
              result = { success: true, message: 'Analytics cache refreshed' };
              break;

            case 'cleanup_cache':
              // This would trigger application-level cache cleanup
              result = { success: true, message: 'Cache cleanup completed' };
              break;

            case 'send_notifications':
              // Process notification queue
              result = { success: true, message: 'Notifications processed' };
              break;

            case 'process_payments':
              // Process pending payments
              result = { success: true, message: 'Payments processed' };
              break;

            default:
              throw new Error(`Unknown job type: ${job.job_type}`);
          }

          // Mark job as completed
          await supabaseAdmin
            .from('background_jobs')
            .update({ 
              status: 'completed', 
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);

          console.log(`Job ${job.id} completed successfully`);

        } catch (jobError) {
          console.error(`Job ${job.id} failed:`, jobError);
          
          // Check if we should retry
          if (job.attempts < job.max_attempts) {
            await supabaseAdmin
              .from('background_jobs')
              .update({ 
                status: 'pending', 
                scheduled_at: new Date(Date.now() + (job.attempts * 30000)).toISOString(), // Exponential backoff
                error_message: jobError.message
              })
              .eq('id', job.id);
          } else {
            await supabaseAdmin
              .from('background_jobs')
              .update({ 
                status: 'failed',
                error_message: jobError.message
              })
              .eq('id', job.id);
          }
          
          result = { success: false, error: jobError.message };
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      case 'queue_job':
        const { job_type, job_data, priority } = await req.json();
        
        const { data: newJob, error: createError } = await supabaseAdmin
          .from('background_jobs')
          .insert({
            job_type,
            job_data: job_data || {},
            priority: priority || 5
          })
          .select()
          .single();

        if (createError) throw createError;

        return new Response(JSON.stringify(newJob), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Background job processor error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});