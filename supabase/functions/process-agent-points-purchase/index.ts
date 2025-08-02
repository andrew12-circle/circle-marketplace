import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface PurchaseRequest {
  service_id: string;
  agent_id: string;
  vendor_id?: string;
  total_amount: number;
  order_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing agent points purchase request');
    
    const { service_id, agent_id, vendor_id, total_amount, order_id } = await req.json() as PurchaseRequest;

    if (!service_id || !agent_id || !total_amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: service_id, agent_id, total_amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Request data:', { service_id, agent_id, vendor_id, total_amount, order_id });

    // First, get service details to understand vendor and pricing
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('vendor_id, respa_category, title')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      console.error('Service lookup error:', serviceError);
      return new Response(
        JSON.stringify({ error: 'Service not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const effectiveVendorId = vendor_id || service.vendor_id;

    if (!effectiveVendorId) {
      return new Response(
        JSON.stringify({ error: 'No vendor specified for this service' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Service details:', service);
    console.log('Using vendor ID:', effectiveVendorId);

    // Calculate RESPA-compliant coverage
    const { data: coverage, error: coverageError } = await supabase.rpc(
      'calculate_respa_compliant_usage',
      {
        p_service_id: service_id,
        p_agent_id: agent_id,
        p_total_amount: total_amount
      }
    );

    if (coverageError) {
      console.error('Coverage calculation error:', coverageError);
      return new Response(
        JSON.stringify({ error: 'Failed to calculate RESPA coverage', details: coverageError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Coverage calculation:', coverage);

    // Check if agent has enough points to cover
    if (!coverage.can_cover_full_amount) {
      const shortfall = total_amount - coverage.total_max_coverage;
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient points for purchase',
          coverage_details: coverage,
          shortfall: shortfall,
          message: `Need ${shortfall.toFixed(2)} more in points or payment to complete purchase`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the RESPA-compliant transaction
    const { data: transactionResult, error: transactionError } = await supabase.rpc(
      'process_respa_compliant_transaction',
      {
        p_service_id: service_id,
        p_agent_id: agent_id,
        p_vendor_id: effectiveVendorId,
        p_total_amount: total_amount,
        p_order_id: order_id
      }
    );

    if (transactionError) {
      console.error('Transaction processing error:', transactionError);
      return new Response(
        JSON.stringify({ error: 'Failed to process transaction', details: transactionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transaction result:', transactionResult);

    // Create order record
    if (order_id) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      if (orderError) {
        console.warn('Failed to update order status:', orderError);
      }
    }

    // Log the successful purchase
    await supabase
      .from('audit_log')
      .insert({
        table_name: 'agent_points_purchase',
        operation: 'PURCHASE',
        user_id: agent_id,
        new_data: {
          service_id,
          service_title: service.title,
          total_amount,
          coverage_used: coverage.total_max_coverage,
          vendor_id: effectiveVendorId,
          respa_category: service.respa_category,
          transaction_ids: {
            respa: transactionResult.transactions?.respa_transaction_id,
            non_respa: transactionResult.transactions?.non_respa_transaction_id
          }
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Purchase completed successfully with agent points',
        coverage_breakdown: coverage.coverage_breakdown,
        transactions: transactionResult.transactions,
        service_title: service.title,
        respa_compliance: {
          category: service.respa_category,
          respa_points_used: Math.ceil(coverage.coverage_breakdown.respa_portion || 0),
          non_respa_points_used: Math.ceil(coverage.coverage_breakdown.non_respa_portion || 0),
          agent_balance_due: coverage.coverage_breakdown.agent_pays || 0
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});