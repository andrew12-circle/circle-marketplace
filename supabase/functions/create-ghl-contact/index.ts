import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ghlApiKey = Deno.env.get('GHL_API_KEY');

interface GHLContactData {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  companyName?: string;
  website?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

const logStep = (step: string, data?: any) => {
  console.log(`[GHL Contact Creation] ${step}`, data ? JSON.stringify(data, null, 2) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting GHL contact creation');

    if (!ghlApiKey) {
      throw new Error('GHL_API_KEY not configured');
    }

    const vendorData = await req.json();
    logStep('Received vendor data', vendorData);

    // Extract name parts
    const nameParts = vendorData.name?.split(' ') || ['Unknown'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare GHL contact data
    const contactData: GHLContactData = {
      firstName,
      lastName,
      email: vendorData.contact_email || vendorData.individual_email,
      phone: vendorData.phone || vendorData.individual_phone,
      companyName: vendorData.name,
      website: vendorData.website_url,
      address1: vendorData.location,
      tags: [
        'Vendor',
        'Invited via Circle Platform',
        ...(vendorData.vendor_type ? [vendorData.vendor_type] : []),
        ...(vendorData.service_states || []).map((state: string) => `Service State: ${state}`)
      ],
      customFields: {
        vendor_type: vendorData.vendor_type,
        service_states: vendorData.service_states?.join(', '),
        service_radius_miles: vendorData.service_radius_miles,
        nmls_id: vendorData.nmls_id,
        license_states: vendorData.license_states?.join(', '),
        individual_name: vendorData.individual_name,
        individual_title: vendorData.individual_title,
        individual_license_number: vendorData.individual_license_number,
        description: vendorData.description,
        mls_areas: vendorData.mls_areas?.join(', '),
        service_zip_codes: vendorData.service_zip_codes?.join(', '),
        platform_source: 'Circle Platform Vendor Invitation',
        invitation_date: new Date().toISOString()
      }
    };

    logStep('Prepared contact data for GHL', contactData);

    // Create contact in Go High Level
    const ghlResponse = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    const ghlResponseData = await ghlResponse.json();
    logStep('GHL API Response', { status: ghlResponse.status, data: ghlResponseData });

    if (!ghlResponse.ok) {
      throw new Error(`GHL API Error: ${ghlResponse.status} - ${JSON.stringify(ghlResponseData)}`);
    }

    logStep('Successfully created contact in GHL', ghlResponseData);

    // Add contact to specific workflow/campaign if needed
    if (ghlResponseData.contact?.id) {
      logStep('Contact created with ID', ghlResponseData.contact.id);
      
      // You can add additional automation triggers here
      // For example, adding to a specific workflow or campaign
      // This would depend on your GHL setup
    }

    return new Response(JSON.stringify({
      success: true,
      ghlContactId: ghlResponseData.contact?.id,
      message: 'Contact successfully created in Go High Level and automation triggered'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep('Error creating GHL contact', error);
    console.error('Error in create-ghl-contact function:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: 'Failed to create contact in Go High Level'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});