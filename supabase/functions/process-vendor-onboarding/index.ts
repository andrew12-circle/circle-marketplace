import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface VendorScreeningResult {
  vendorId: string;
  autoScore: number;
  approvalStatus: 'auto_approved' | 'needs_review';
  isActive: boolean;
  isVerified: boolean;
  automatedChecks: Record<string, any>;
  verificationNotes?: string;
}

function calculateCompleteness(vendor: any): { score: number; checks: Record<string, any> } {
  const checks = {
    hasName: !!vendor.name && vendor.name.trim().length > 0,
    hasEmail: !!vendor.contact_email && vendor.contact_email.includes('@'),
    hasPhone: !!vendor.phone,
    hasWebsite: !!vendor.website_url,
    hasLocation: !!vendor.location,
    hasDescription: !!vendor.description && vendor.description.length > 50,
    hasLogo: !!vendor.logo_url,
    hasSpecialties: !!vendor.specialties && vendor.specialties.length > 0
  };
  
  const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100;
  return { score, checks };
}

function checkEmailDomain(email: string): { trustworthy: boolean; reason: string } {
  if (!email) return { trustworthy: false, reason: 'No email provided' };
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { trustworthy: false, reason: 'Invalid email format' };
  
  // Suspicious domains
  const suspiciousDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'tempmail', '10minutemail'];
  if (suspiciousDomains.some(sus => domain.includes(sus))) {
    return { trustworthy: false, reason: 'Personal email domain' };
  }
  
  return { trustworthy: true, reason: 'Business email domain' };
}

function checkLicenseCredentials(vendor: any): { hasCredentials: boolean; notes: string } {
  const hasNMLS = !!vendor.nmls_id && vendor.nmls_id.trim().length > 0;
  const hasLicense = !!vendor.license_number && vendor.license_number.trim().length > 0;
  const hasBusinessLicense = !!vendor.business_license && vendor.business_license.trim().length > 0;
  
  if (hasNMLS || hasLicense || hasBusinessLicense) {
    return { hasCredentials: true, notes: 'Has professional credentials' };
  }
  
  return { hasCredentials: false, notes: 'No professional credentials provided' };
}

function performAutomatedScreening(vendor: any): VendorScreeningResult {
  const completeness = calculateCompleteness(vendor);
  const emailCheck = checkEmailDomain(vendor.contact_email);
  const licenseCheck = checkLicenseCredentials(vendor);
  
  let autoScore = 0;
  const automatedChecks = {
    completeness: completeness.checks,
    completenessScore: completeness.score,
    emailDomain: emailCheck,
    credentials: licenseCheck,
    timestamp: new Date().toISOString()
  };
  
  // Scoring algorithm
  autoScore += completeness.score * 0.4; // 40% weight on completeness
  autoScore += emailCheck.trustworthy ? 25 : 0; // 25 points for business email
  autoScore += licenseCheck.hasCredentials ? 20 : 0; // 20 points for credentials
  autoScore += (vendor.years_in_business || 0) > 1 ? 15 : 0; // 15 points for established business
  
  // Auto-approval threshold: 70+ points
  const shouldAutoApprove = autoScore >= 70;
  
  return {
    vendorId: vendor.id,
    autoScore: Math.round(autoScore),
    approvalStatus: shouldAutoApprove ? 'auto_approved' : 'needs_review',
    isActive: shouldAutoApprove,
    isVerified: shouldAutoApprove,
    automatedChecks,
    verificationNotes: shouldAutoApprove 
      ? 'Auto-approved based on automated screening'
      : 'Requires manual review - low automated score'
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vendorId } = await req.json();
    
    if (!vendorId) {
      return new Response(
        JSON.stringify({ error: 'Vendor ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing vendor onboarding for: ${vendorId}`);

    // Fetch vendor data
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (fetchError || !vendor) {
      console.error('Error fetching vendor:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Vendor not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Skip if already processed
    if (vendor.approval_status !== 'pending') {
      console.log(`Vendor ${vendorId} already processed: ${vendor.approval_status}`);
      return new Response(
        JSON.stringify({ 
          message: 'Vendor already processed', 
          status: vendor.approval_status 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Perform automated screening
    const screening = performAutomatedScreening(vendor);
    console.log(`Screening result for ${vendorId}:`, screening);

    // Update vendor record
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        approval_status: screening.approvalStatus,
        auto_score: screening.autoScore,
        is_active: screening.isActive,
        is_verified: screening.isVerified,
        automated_checks: screening.automatedChecks,
        verification_notes: screening.verificationNotes,
        approved_at: screening.isActive ? new Date().toISOString() : null
      })
      .eq('id', vendorId);

    if (updateError) {
      console.error('Error updating vendor:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update vendor' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the screening result
    await supabase.from('vendor_activity_tracking').insert({
      vendor_id: vendorId,
      activity_type: 'automated_screening',
      activity_data: {
        screening_result: screening,
        processed_at: new Date().toISOString()
      }
    });

    console.log(`Vendor ${vendorId} successfully processed: ${screening.approvalStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        vendorId,
        result: screening
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in process-vendor-onboarding:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});