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
  service_states: string[];
  mls_areas: string[];
  service_radius_miles: number | null;
}

// Input validation and sanitization helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeString = (input: string): string => {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 500); // Limit length
};

const validateVendorData = (data: any): VendorData => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid vendor data');
  }

  const { name, contact_email, category, description, website_url, phone, location } = data;

  // Required field validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Vendor name is required');
  }
  
  if (!contact_email || !validateEmail(contact_email)) {
    throw new Error('Valid contact email is required');
  }
  
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    throw new Error('Category is required');
  }

  // Optional field validation and sanitization
  if (website_url && website_url.length > 0) {
    if (!website_url.startsWith('http://') && !website_url.startsWith('https://')) {
      throw new Error('Website URL must start with http:// or https://');
    }
  }

  if (phone && phone.length > 0) {
    const phoneRegex = /^[+]?[0-9\s\-\(\)\.]+$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone number format');
    }
  }

  return {
    name: sanitizeString(name),
    description: description ? sanitizeString(description) : '',
    vendorType: 'company',
    category: sanitizeString(category),
    website_url: website_url ? sanitizeString(website_url) : '',
    contact_email: contact_email.toLowerCase().trim(),
    phone: phone ? sanitizeString(phone) : '',
    location: location ? sanitizeString(location) : '',
    logo_url: data.logo_url ? sanitizeString(data.logo_url) : '',
    specialties: Array.isArray(data.specialties) ? data.specialties.map(s => sanitizeString(s)).slice(0, 10) : [],
    years_experience: typeof data.years_experience === 'number' ? Math.max(0, Math.min(100, data.years_experience)) : null,
    service_states: Array.isArray(data.service_states) ? data.service_states.slice(0, 50) : [],
    mls_areas: Array.isArray(data.mls_areas) ? data.mls_areas.slice(0, 100) : [],
    service_radius_miles: typeof data.service_radius_miles === 'number' ? Math.max(0, Math.min(1000, data.service_radius_miles)) : null,
  };
};

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

    // Enhanced authentication with security logging
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Unauthorized: No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token || token.length < 10) {
      throw new Error("Unauthorized: Invalid authorization token");
    }

    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      logStep("Authentication failed", { error: authError?.message });
      throw new Error("Unauthorized: Invalid token");
    }

    const inviterUserId = userData.user.id;
    logStep("User authenticated", { userId: inviterUserId });

    // Enhanced admin verification with updated RLS policies
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin, specialties')
      .eq('user_id', inviterUserId)
      .single();

    if (profileError) {
      logStep("Admin verification error", { error: profileError });
      throw new Error("Forbidden: Unable to verify admin status");
    }

    const isAdmin = profile?.is_admin || profile?.specialties?.includes('admin') || false;
    
    if (!isAdmin) {
      // Log unauthorized admin access attempt
      await supabaseClient
        .from('security_events')
        .insert({
          event_type: 'unauthorized_admin_access',
          user_id: inviterUserId,
          event_data: {
            attempted_action: 'vendor_invitation',
            profile_data: { is_admin: profile?.is_admin, specialties: profile?.specialties }
          }
        });
      
      throw new Error("Forbidden: Admin access required");
    }

    const requestBody = await req.json();
    const { vendorData: rawVendorData, inviterMessage } = requestBody;
    
    // Validate and sanitize vendor data
    const vendorData = validateVendorData(rawVendorData);
    logStep("Vendor data validated", { name: vendorData.name, category: vendorData.category });

    // Check if vendor already exists
    const { data: existingVendor } = await supabaseClient
      .from('vendors')
      .select('id, name')
      .eq('contact_email', vendorData.contact_email)
      .maybeSingle();

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
      service_states: vendorData.service_states || [],
      mls_areas: vendorData.mls_areas || [],
      service_radius_miles: vendorData.service_radius_miles || null,
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