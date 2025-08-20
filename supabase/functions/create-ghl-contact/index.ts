
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Creating Go High Level contact');
    
    const {
      bookingId,
      firstName,
      lastName,
      email,
      phone,
      serviceTitle,
      vendorName,
      scheduledDate,
      scheduledTime,
      projectDetails,
      budgetRange,
      source
    } = await req.json();

    // Create Supabase client for logging
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get GHL API key from Supabase secrets
    const ghlApiKey = Deno.env.get('GHL_API_KEY');
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');

    if (!ghlApiKey || !ghlLocationId) {
      console.error('❌ Missing GHL API credentials');
      throw new Error('Go High Level API credentials not configured');
    }

    // Prepare contact data for GHL
    const contactData = {
      firstName: firstName || 'Unknown',
      lastName: lastName || '',
      email: email,
      phone: phone || '',
      source: source || 'Circle Marketplace',
      tags: ['Consultation Booking', 'Circle Marketplace', serviceTitle],
      customFields: [
        {
          key: 'service_title',
          value: serviceTitle
        },
        {
          key: 'vendor_name', 
          value: vendorName
        },
        {
          key: 'scheduled_date',
          value: scheduledDate
        },
        {
          key: 'scheduled_time',
          value: scheduledTime
        },
        {
          key: 'project_details',
          value: projectDetails || ''
        },
        {
          key: 'budget_range',
          value: budgetRange || ''
        },
        {
          key: 'booking_id',
          value: bookingId
        }
      ]
    };

    console.log('📤 Sending contact to GHL:', {
      firstName,
      lastName,
      email,
      serviceTitle,
      scheduledDate,
      scheduledTime
    });

    // Create contact in Go High Level
    const ghlResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...contactData,
        locationId: ghlLocationId
      })
    });

    const ghlResult = await ghlResponse.json();

    if (!ghlResponse.ok) {
      console.error('❌ GHL contact creation failed:', ghlResult);
      throw new Error(`GHL API error: ${ghlResult.message || 'Unknown error'}`);
    }

    console.log('✅ Successfully created GHL contact:', ghlResult.contact?.id);

    // Log successful integration
    await supabaseClient.from('integration_logs').insert({
      integration_type: 'go_high_level',
      action: 'create_contact',
      external_id: ghlResult.contact?.id,
      booking_id: bookingId,
      status: 'success',
      response_data: ghlResult,
      created_at: new Date().toISOString()
    }).catch(error => {
      console.log('Logging failed (table may not exist):', error.message);
    });

    // Create a follow-up task/opportunity in GHL if possible
    try {
      if (ghlResult.contact?.id) {
        const opportunityData = {
          title: `Consultation: ${serviceTitle}`,
          status: 'open',
          contactId: ghlResult.contact.id,
          value: budgetRange === 'under-5k' ? 2500 : 
                 budgetRange === '5k-10k' ? 7500 :
                 budgetRange === '10k-25k' ? 17500 :
                 budgetRange === '25k-50k' ? 37500 :
                 budgetRange === '50k-100k' ? 75000 :
                 budgetRange === 'over-100k' ? 100000 : 5000,
          source: 'Circle Marketplace Consultation',
          notes: `
Scheduled: ${scheduledDate} at ${scheduledTime}
Service: ${serviceTitle}
Vendor: ${vendorName}
Project Details: ${projectDetails}
Budget Range: ${budgetRange}
          `.trim()
        };

        const opportunityResponse = await fetch(`https://rest.gohighlevel.com/v1/opportunities/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...opportunityData,
            locationId: ghlLocationId
          })
        });

        if (opportunityResponse.ok) {
          const opportunityResult = await opportunityResponse.json();
          console.log('✅ Created GHL opportunity:', opportunityResult.opportunity?.id);
        }
      }
    } catch (opportunityError) {
      console.log('⚠️ Opportunity creation failed (non-critical):', opportunityError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ghl_contact_id: ghlResult.contact?.id,
        message: 'Contact successfully created in Go High Level',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ GHL integration error:', error);

    // Log failed integration
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      await supabaseClient.from('integration_logs').insert({
        integration_type: 'go_high_level',
        action: 'create_contact',
        status: 'failed',
        error_message: error.message,
        created_at: new Date().toISOString()
      }).catch(() => {
        // Ignore logging errors
      });
    } catch (logError) {
      console.log('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to create contact in Go High Level',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
