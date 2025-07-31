import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceRow {
  title: string;
  description?: string;
  category?: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  price_duration?: string;
  discount_percentage?: string;
  duration?: string;
  estimated_roi?: string;
  vendor_id: string;
  tags?: string;
  is_featured?: string;
  is_top_pick?: string;
  requires_quote?: string;
  image_url?: string;
  service_provider_id?: string;
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

    console.log(`Processing CSV import: ${fileName}`);

    // Parse CSV content
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map((h: string) => h.replace(/"/g, '').trim());
    
    console.log('CSV Headers:', headers);

    const errors: ImportError[] = [];
    const successfulServices = [];
    let totalRows = 0;

    // Validate required columns
    const requiredColumns = ['title'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Get all vendor IDs for validation (optional now)
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id');
    
    const validVendorIds = new Set(vendors?.map(v => v.id) || []);

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

        // Create service object
        const serviceData: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index]?.replace(/^"|"$/g, ''); // Remove quotes
          serviceData[header] = value || null;
        });

        // Validate required fields
        if (!serviceData.title?.trim()) {
          errors.push({ row: rowNumber, error: 'Title is required' });
          continue;
        }

        // Validate vendor_id exists if provided
        if (serviceData.vendor_id?.trim() && !validVendorIds.has(serviceData.vendor_id)) {
          errors.push({ row: rowNumber, error: 'Invalid vendor_id - vendor not found' });
          continue;
        }

        // Process and validate data types
        const processedService: any = {
          title: serviceData.title.trim(),
          description: serviceData.description || null,
          category: serviceData.category || null,
          retail_price: serviceData.retail_price || null,
          pro_price: serviceData.pro_price || null,
          co_pay_price: serviceData.co_pay_price || null,
          price_duration: serviceData.price_duration || 'mo',
          discount_percentage: serviceData.discount_percentage || null,
          duration: serviceData.duration || null,
          vendor_id: serviceData.vendor_id?.trim() || null,
          image_url: serviceData.image_url || null,
          service_provider_id: serviceData.service_provider_id || null,
        };

        // Handle numeric fields
        if (serviceData.estimated_roi) {
          const roi = parseFloat(serviceData.estimated_roi);
          if (!isNaN(roi)) {
            processedService.estimated_roi = roi;
          }
        }

        // Handle boolean fields
        processedService.is_featured = serviceData.is_featured?.toLowerCase() === 'true';
        processedService.is_top_pick = serviceData.is_top_pick?.toLowerCase() === 'true';
        processedService.requires_quote = serviceData.requires_quote?.toLowerCase() === 'true';

        // Handle tags array
        if (serviceData.tags) {
          processedService.tags = serviceData.tags
            .split(',')
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0);
        }

        // Set default timestamps
        processedService.created_at = new Date().toISOString();
        processedService.updated_at = new Date().toISOString();

        successfulServices.push(processedService);

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Insert successful services
    let insertedCount = 0;
    if (successfulServices.length > 0) {
      console.log(`Attempting to insert ${successfulServices.length} services`);
      
      const { data: insertedServices, error: insertError } = await supabase
        .from('services')
        .insert(successfulServices)
        .select('id');

      if (insertError) {
        console.error('Insert error:', insertError);
        // If bulk insert fails, try inserting one by one
        for (let i = 0; i < successfulServices.length; i++) {
          try {
            const { error: singleInsertError } = await supabase
              .from('services')
              .insert(successfulServices[i]);
            
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
        insertedCount = insertedServices?.length || 0;
      }
    }

    const result = {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `Successfully imported ${insertedCount} services`
        : `Imported ${insertedCount} services with ${errors.length} errors`,
      totalRows,
      successCount: insertedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 100) // Limit to first 100 errors
    };

    console.log('Import result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Import function error:', error);
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