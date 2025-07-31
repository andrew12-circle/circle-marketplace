import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VendorRow {
  name: string;
  description?: string;
  vendor_type?: string;
  location?: string;
  contact_email?: string;
  phone?: string;
  website_url?: string;
  service_states?: string;
  license_states?: string;
  service_zip_codes?: string;
  mls_areas?: string;
  individual_name?: string;
  individual_title?: string;
  individual_phone?: string;
  individual_email?: string;
  individual_license_number?: string;
  nmls_id?: string;
  latitude?: string;
  longitude?: string;
  service_radius_miles?: string;
}

interface ImportError {
  row: number;
  error: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the auth user
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_admin) {
      throw new Error('Admin access required');
    }

    const { csvContent, fileName } = await req.json();

    if (!csvContent) {
      throw new Error('No CSV content provided');
    }

    console.log(`Processing vendor CSV import: ${fileName}`);

    // Parse CSV content
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map((h: string) => h.replace(/"/g, '').trim());
    
    console.log('CSV Headers:', headers);

    const errors: ImportError[] = [];
    const successfulVendors = [];
    let totalRows = 0;

    // Validate required columns
    const requiredColumns = ['name'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      totalRows++;
      const rowNumber = i + 1;
      
      try {
        // Parse CSV row (handle quoted values)
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let char of lines[i]) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim()); // Add the last value

        if (values.length !== headers.length) {
          errors.push({
            row: rowNumber,
            error: `Column count mismatch. Expected ${headers.length}, got ${values.length}`
          });
          continue;
        }

        // Create vendor object
        const vendorData: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index]?.replace(/^"|"$/g, ''); // Remove quotes
          vendorData[header] = value || null;
        });

        // Validate required fields
        if (!vendorData.name?.trim()) {
          errors.push({ row: rowNumber, error: 'Name is required' });
          continue;
        }

        // Process and validate data types
        const processedVendor: any = {
          name: vendorData.name.trim(),
          description: vendorData.description || null,
          vendor_type: vendorData.vendor_type || 'company',
          location: vendorData.location || null,
          contact_email: vendorData.contact_email || null,
          phone: vendorData.phone || null,
          website_url: vendorData.website_url || null,
          individual_name: vendorData.individual_name || null,
          individual_title: vendorData.individual_title || null,
          individual_phone: vendorData.individual_phone || null,
          individual_email: vendorData.individual_email || null,
          individual_license_number: vendorData.individual_license_number || null,
          nmls_id: vendorData.nmls_id || null,
        };

        // Handle numeric fields
        if (vendorData.latitude) {
          const lat = parseFloat(vendorData.latitude);
          if (!isNaN(lat)) {
            processedVendor.latitude = lat;
          }
        }

        if (vendorData.longitude) {
          const lng = parseFloat(vendorData.longitude);
          if (!isNaN(lng)) {
            processedVendor.longitude = lng;
          }
        }

        if (vendorData.service_radius_miles) {
          const radius = parseInt(vendorData.service_radius_miles);
          if (!isNaN(radius)) {
            processedVendor.service_radius_miles = radius;
          }
        }

        // Handle array fields
        if (vendorData.service_states) {
          processedVendor.service_states = vendorData.service_states
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }

        if (vendorData.license_states) {
          processedVendor.license_states = vendorData.license_states
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }

        if (vendorData.service_zip_codes) {
          processedVendor.service_zip_codes = vendorData.service_zip_codes
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }

        if (vendorData.mls_areas) {
          processedVendor.mls_areas = vendorData.mls_areas
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        }

        // Set default values
        processedVendor.rating = 0;
        processedVendor.review_count = 0;
        processedVendor.campaigns_funded = 0;
        processedVendor.co_marketing_agents = 0;
        processedVendor.is_verified = false;
        processedVendor.is_active = true;
        processedVendor.created_at = new Date().toISOString();
        processedVendor.updated_at = new Date().toISOString();

        successfulVendors.push(processedVendor);

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Insert successful vendors
    let insertedCount = 0;
    if (successfulVendors.length > 0) {
      console.log(`Attempting to insert ${successfulVendors.length} vendors`);
      
      const { data: insertedVendors, error: insertError } = await supabase
        .from('vendors')
        .insert(successfulVendors)
        .select('id');

      if (insertError) {
        console.error('Insert error:', insertError);
        // If bulk insert fails, try inserting one by one
        for (let i = 0; i < successfulVendors.length; i++) {
          try {
            const { error: singleInsertError } = await supabase
              .from('vendors')
              .insert(successfulVendors[i]);
            
            if (singleInsertError) {
              errors.push({
                row: i + 2, // Adjust for header row and 0-based index
                error: `Insert failed: ${singleInsertError.message}`
              });
            } else {
              insertedCount++;
            }
          } catch (singleError) {
            errors.push({
              row: i + 2,
              error: `Insert failed: ${singleError instanceof Error ? singleError.message : 'Unknown error'}`
            });
          }
        }
      } else {
        insertedCount = insertedVendors?.length || 0;
      }
    }

    const result = {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `Successfully imported ${insertedCount} vendors`
        : `Imported ${insertedCount} vendors with ${errors.length} errors`,
      totalRows,
      successCount: insertedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 100) // Limit to first 100 errors
    };

    console.log('Vendor import result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Vendor import function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        errors: [{ row: 0, error: error instanceof Error ? error.message : 'Unknown error' }]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});