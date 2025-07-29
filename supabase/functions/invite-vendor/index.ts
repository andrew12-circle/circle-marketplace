import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[INVITE-VENDOR] ${step}${detailsStr}`);
};

interface VendorData {
  name: string;
  description: string;
  vendorType: string;
  category: string;
  website_url: string;
  contact_email: string;
  phone: string;
  location: string;
  logo_url: string;
  specialties: string[];
  years_experience: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role for inserting data
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user authentication for audit trail
    const authHeader = req.headers.get("Authorization");
    let inviterUserId = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      inviterUserId = userData.user?.id;
      logStep("Inviter authenticated", { userId: inviterUserId });
    }

    const { vendorData, inviterMessage }: { vendorData: VendorData; inviterMessage: string } = await req.json();
    logStep("Received vendor data", { name: vendorData.name, category: vendorData.category });

    // Validate required fields
    if (!vendorData.name || !vendorData.contact_email || !vendorData.category) {
      throw new Error("Missing required fields: name, contact_email, and category are required");
    }

    // Check if vendor already exists
    const { data: existingVendor } = await supabaseClient
      .from('vendors')
      .select('id, name')
      .eq('contact_email', vendorData.contact_email)
      .single();

    if (existingVendor) {
      logStep("Vendor already exists", { vendorId: existingVendor.id });
      return new Response(JSON.stringify({ 
        error: "A vendor with this email already exists in the marketplace" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Prepare vendor data for insertion
    const vendorInsertData = {
      name: vendorData.name,
      description: vendorData.description || `Professional ${vendorData.category} services`,
      website_url: vendorData.website_url || null,
      contact_email: vendorData.contact_email,
      phone: vendorData.phone || null,
      location: vendorData.location || null,
      logo_url: vendorData.logo_url || null,
      rating: 0,
      review_count: 0,
      is_verified: false, // Will be verified manually
      co_marketing_agents: 0,
      campaigns_funded: 0,
    };

    // Insert vendor into database
    const { data: newVendor, error: vendorError } = await supabaseClient
      .from('vendors')
      .insert(vendorInsertData)
      .select()
      .single();

    if (vendorError) {
      logStep("Error inserting vendor", { error: vendorError });
      throw new Error(`Failed to create vendor: ${vendorError.message}`);
    }

    logStep("Vendor created successfully", { vendorId: newVendor.id });

    // Create a default service for the vendor
    const defaultServiceData = {
      vendor_id: newVendor.id,
      title: `${vendorData.category} Services`,
      description: vendorData.description || `Professional ${vendorData.category} services tailored for real estate professionals`,
      category: vendorData.category,
      price: "Contact for Quote",
      contribution_amount: "0",
      requires_quote: true,
      is_featured: false,
      is_top_pick: false,
      tags: vendorData.specialties.length > 0 ? vendorData.specialties : [vendorData.category],
    };

    const { data: newService, error: serviceError } = await supabaseClient
      .from('services')
      .insert(defaultServiceData)
      .select()
      .single();

    if (serviceError) {
      logStep("Error creating default service", { error: serviceError });
      // Don't fail the whole process if service creation fails
    } else {
      logStep("Default service created", { serviceId: newService.id });
    }

    // TODO: Send notification email to the vendor
    // This would require setting up an email service
    logStep("Vendor invitation process completed");

    return new Response(JSON.stringify({ 
      success: true,
      vendor: newVendor,
      service: newService || null,
      message: "Vendor has been successfully added to the marketplace"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in invite-vendor", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});