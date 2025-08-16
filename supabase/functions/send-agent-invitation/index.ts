import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "invitations@circleplatform.com";
const RESEND_FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "Circle Network";

interface AgentInvitationRequest {
  agent_email: string;
  agent_name: string;
  agent_company?: string;
  invitation_message: string;
  invitation_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { agent_email, agent_name, agent_company, invitation_message }: AgentInvitationRequest = await req.json();

    // Send invitation email using Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
        to: [agent_email],
        subject: `${agent_name}, Exclusive Invitation: Share Your Success & Earn $69.30 Per Sale`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Circle Network Agent Invitation</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Circle Network</h1>
              <p style="color: #D1FAE5; margin: 10px 0 0 0; font-size: 16px;">Exclusive Agent Opportunity</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
              ${invitation_message.replace(/\n/g, '<br/>')}
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://app.circleplatform.com/academy" 
                 style="background: linear-gradient(135deg, #10B981, #059669); 
                        color: white; 
                        text-decoration: none; 
                        padding: 15px 30px; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block; 
                        font-size: 16px;">
                Get Started Now
              </a>
            </div>
            
            <!-- Benefits -->
            <div style="background: #ffffff; border: 2px solid #10B981; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #10B981; margin-top: 0;">What You'll Get:</h3>
              <ul style="padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong>$69.30 per sale</strong> - 70% revenue share on $99 playbooks</li>
                <li style="margin-bottom: 8px;"><strong>Help other agents</strong> - Share your proven strategies</li>
                <li style="margin-bottom: 8px;"><strong>Build authority</strong> - Establish yourself as a thought leader</li>
                <li style="margin-bottom: 8px;"><strong>Passive income</strong> - Earn while you sleep</li>
                <li style="margin-bottom: 8px;"><strong>Easy setup</strong> - We handle all the technical details</li>
              </ul>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
              <p>This invitation was sent because we believe your expertise would be valuable to our agent community.</p>
              <p>Circle Network | Building the Future of Real Estate</p>
            </div>
            
          </body>
          </html>
        `,
        text: invitation_message
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Agent invitation sent successfully",
        email_id: emailResult.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-agent-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send agent invitation" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);