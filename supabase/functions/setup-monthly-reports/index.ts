import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Setting up monthly vendor report cron job...');

    // Schedule the vendor reports to run on the 1st of every month at 9 AM UTC
    const { data, error } = await supabase.rpc('cron.schedule', {
      job_name: 'monthly-vendor-reports',
      cron_schedule: '0 9 1 * *', // 9 AM UTC on the 1st of every month
      sql_command: `
        select
          net.http_post(
              url:='https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/send-vendor-reports',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}"}'::jsonb,
              body:=json_build_object('month', to_char(now() - interval '1 month', 'YYYY-MM'))::text
          ) as request_id;
      `
    });

    if (error) {
      console.error('Error setting up cron job:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('Monthly vendor report cron job scheduled successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Monthly vendor report automation setup complete',
        cron_schedule: '0 9 1 * * (9 AM UTC on 1st of every month)',
        next_run: 'First day of next month at 9 AM UTC'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in setup-monthly-reports function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);