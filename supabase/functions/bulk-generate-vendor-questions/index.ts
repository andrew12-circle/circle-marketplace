import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active vendors that don't have questions yet
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('is_active', true);

    if (vendorsError) {
      throw new Error(`Failed to fetch vendors: ${vendorsError.message}`);
    }

    console.log(`Found ${vendors?.length || 0} vendors to process`);

    let processed = 0;
    let errors = 0;
    const results = [];

    // Process each vendor
    for (const vendor of vendors || []) {
      try {
        console.log(`Processing vendor: ${vendor.name}`);
        
        // Check if vendor already has questions
        const { data: existingQuestions } = await supabase
          .from('vendor_questions')
          .select('id')
          .eq('vendor_id', vendor.id)
          .limit(1);

        if (existingQuestions && existingQuestions.length > 0) {
          console.log(`Vendor ${vendor.name} already has questions, skipping`);
          continue;
        }

        // Call the generate-vendor-questions function
        const generateResponse = await fetch(`${supabaseUrl}/functions/v1/generate-vendor-questions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendorId: vendor.id
          })
        });

        const result = await generateResponse.json();

        if (result.success) {
          processed++;
          results.push({
            vendorId: vendor.id,
            vendorName: vendor.name,
            success: true,
            message: result.message
          });
          console.log(`✓ Successfully processed ${vendor.name}`);
        } else {
          errors++;
          results.push({
            vendorId: vendor.id,
            vendorName: vendor.name,
            success: false,
            error: result.error
          });
          console.log(`✗ Failed to process ${vendor.name}: ${result.error}`);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errors++;
        results.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          success: false,
          error: error.message
        });
        console.error(`Error processing vendor ${vendor.name}:`, error);
      }
    }

    console.log(`Bulk generation complete. Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: {
          totalVendors: vendors?.length || 0,
          processed,
          errors,
          skipped: (vendors?.length || 0) - processed - errors
        },
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bulk-generate-vendor-questions function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});