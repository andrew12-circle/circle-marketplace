import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { MonthlyStatementEmail } from "./_templates/monthly-statement.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "statements@resend.dev";
const RESEND_FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "Circle Platform";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentData {
  user_id: string;
  email: string;
  display_name: string;
  total_points: number;
  transactions: any[];
  allocations: any[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting monthly statement generation...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the previous month date range
    const now = new Date();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthName = firstDayLastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    console.log(`Generating statements for ${monthName}`);

    // Get all agents with active allocations
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        display_name
      `)
      .in('user_id', 
        supabase
          .from('point_allocations')
          .select('agent_id')
          .eq('status', 'active')
      );

    if (agentsError) {
      console.error("Error fetching agents:", agentsError);
      throw agentsError;
    }

    console.log(`Found ${agents?.length || 0} agents to send statements to`);

    for (const agent of agents || []) {
      try {
        // Get user email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(agent.user_id);
        if (!authUser.user?.email) continue;

        // Get agent's current point summary
        const { data: pointSummary } = await supabase.rpc('get_agent_points_summary', {
          p_agent_id: agent.user_id
        });

        // Get transactions for the month
        const { data: transactions } = await supabase
          .from('point_transactions')
          .select(`
            *,
            point_allocations!inner(vendor_id),
            profiles!point_allocations_vendor_id_fkey(business_name, display_name)
          `)
          .eq('agent_id', agent.user_id)
          .gte('created_at', firstDayLastMonth.toISOString())
          .lte('created_at', lastDayLastMonth.toISOString())
          .order('created_at', { ascending: false });

        // Get allocations created this month
        const { data: allocations } = await supabase
          .from('point_allocations')
          .select(`
            *,
            profiles!vendor_id_fkey(business_name, display_name)
          `)
          .eq('agent_id', agent.user_id)
          .gte('created_at', firstDayLastMonth.toISOString())
          .lte('created_at', lastDayLastMonth.toISOString());

        const agentData: AgentData = {
          user_id: agent.user_id,
          email: authUser.user.email,
          display_name: agent.display_name || 'Agent',
          total_points: pointSummary?.total_available_points || 0,
          transactions: transactions || [],
          allocations: allocations || []
        };

        // Generate and send email
        const html = await renderAsync(
          React.createElement(MonthlyStatementEmail, {
            agentName: agentData.display_name,
            monthName,
            totalPoints: agentData.total_points,
            transactions: agentData.transactions,
            allocations: agentData.allocations,
            statementUrl: `https://ihzyuyfawapweamqzzlj.supabase.co/wallet`
          })
        );

        const emailResult = await resend.emails.send({
          from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
          to: [agentData.email],
          subject: `Your ${monthName} Points Statement - Circle Platform`,
          html,
        });

        console.log(`Statement sent to ${agentData.email}:`, emailResult);

      } catch (error) {
        console.error(`Error sending statement to agent ${agent.user_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Monthly statements sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-monthly-statement function:", error);
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