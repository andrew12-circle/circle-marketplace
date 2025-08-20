import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ghlApiKey = Deno.env.get('GHL_API_KEY');
const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');

interface VendorReferralRequest {
  vendor_name: string;
  vendor_email: string;
  vendor_phone?: string;
  vendor_company?: string;
  vendor_type?: string;
  relationship?: string;
  service_interest?: string;
  referral_notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const requestData: VendorReferralRequest = await req.json();
    
    // Validate required fields
    if (!requestData.vendor_name || !requestData.vendor_email) {
      throw new Error('Vendor name and email are required');
    }

    console.log('Processing vendor referral:', {
      agent_id: user.id,
      vendor_name: requestData.vendor_name,
      vendor_email: requestData.vendor_email
    });

    // Insert vendor referral into database
    const { data: referral, error: insertError } = await supabase
      .from('vendor_referrals')
      .insert({
        agent_id: user.id,
        vendor_name: requestData.vendor_name,
        vendor_email: requestData.vendor_email,
        vendor_phone: requestData.vendor_phone,
        vendor_company: requestData.vendor_company,
        vendor_type: requestData.vendor_type || 'general',
        relationship: requestData.relationship || 'referred',
        service_interest: requestData.service_interest,
        referral_notes: requestData.referral_notes,
        contact_status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to save referral: ${insertError.message}`);
    }

    console.log('Vendor referral saved successfully:', referral.id);

    // Get agent info for the outreach
    const { data: agent, error: agentError } = await supabase
      .from('agents') 
      .select('first_name, last_name, email, phone, brokerage')
      .eq('user_id', user.id)
      .single();

    if (agentError) {
      console.warn('Could not fetch agent info:', agentError);
    }

    // Create GoHighLevel contact if API keys are available
    let ghlContactId = null;
    if (ghlApiKey && ghlLocationId) {
      try {
        const ghlResponse = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            locationId: ghlLocationId,
            firstName: requestData.vendor_name.split(' ')[0] || requestData.vendor_name,
            lastName: requestData.vendor_name.split(' ').slice(1).join(' ') || '',
            email: requestData.vendor_email,
            phone: requestData.vendor_phone,
            companyName: requestData.vendor_company,
            tags: ['vendor-referral', requestData.vendor_type || 'general'],
            customFields: [
              {
                key: 'referring_agent',
                field_value: agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown Agent'
              },
              {
                key: 'agent_brokerage', 
                field_value: agent?.brokerage || ''
              },
              {
                key: 'agent_email',
                field_value: agent?.email || ''
              },
              {
                key: 'agent_phone',
                field_value: agent?.phone || ''
              },
              {
                key: 'service_interest',
                field_value: requestData.service_interest || ''
              },
              {
                key: 'relationship_type',
                field_value: requestData.relationship || 'referred'
              },
              {
                key: 'referral_notes',
                field_value: requestData.referral_notes || ''
              }
            ]
          })
        });

        if (ghlResponse.ok) {
          const ghlData = await ghlResponse.json();
          ghlContactId = ghlData.contact?.id;
          console.log('GHL contact created:', ghlContactId);
          
          // Update referral with GHL contact ID
          await supabase
            .from('vendor_referrals')
            .update({ 
              contact_status: 'contacted',
              contacted_at: new Date().toISOString(),
              status_notes: `Added to GHL with contact ID: ${ghlContactId}`
            })
            .eq('id', referral.id);
            
        } else {
          const ghlError = await ghlResponse.text();
          console.error('GHL API error:', ghlError);
          
          // Update status to note GHL failure
          await supabase
            .from('vendor_referrals')
            .update({
              status_notes: `GHL integration failed: ${ghlError}`
            })
            .eq('id', referral.id);
        }
      } catch (ghlError) {
        console.error('Error creating GHL contact:', ghlError);
        
        // Update status to note GHL failure
        await supabase
          .from('vendor_referrals')
          .update({
            status_notes: `GHL integration error: ${ghlError}`
          })
          .eq('id', referral.id);
      }
    } else {
      console.log('GHL API keys not configured, skipping contact creation');
    }

    // Background task: Send internal notification to admin team
    const notificationData = {
      type: 'vendor_referral',
      referral_id: referral.id,
      agent_name: agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown Agent',
      agent_email: agent?.email,
      vendor_name: requestData.vendor_name,
      vendor_email: requestData.vendor_email,
      vendor_type: requestData.vendor_type,
      service_interest: requestData.service_interest,
      ghl_contact_id: ghlContactId
    };

    // You could send this to a notification service, Slack webhook, etc.
    console.log('Vendor referral notification data:', notificationData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Vendor referral submitted successfully",
        referral_id: referral.id,
        ghl_contact_id: ghlContactId,
        next_steps: "We'll reach out to your vendor within 2-3 business days to explain the Circle Network opportunity."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in refer-vendor function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process vendor referral"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);