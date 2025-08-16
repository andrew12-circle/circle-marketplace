import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { items, metadata = {} } = await req.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Items array is required and must not be empty");
    }

    logStep("Received items", { itemCount: items.length, metadata });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role for writes
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user (for user attribution)
    const authHeader = req.headers.get("Authorization");
    let user = null;
    let userEmail = "guest@example.com";

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseService.auth.getUser(token);
      user = userData.user;
      userEmail = user?.email || userEmail;
      logStep("User authenticated", { userId: user?.id, email: userEmail });
    } else {
      logStep("No authentication - proceeding as guest");
    }

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Convert cart items to Stripe line items
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          description: item.description || "",
          metadata: {
            item_id: item.id,
            item_type: item.type || 'service',
            vendor_id: item.vendor_id || '',
          }
        },
        unit_amount: Math.round((item.price || 0) * 100), // Convert to cents
      },
      quantity: item.quantity || 1,
    }));

    logStep("Created line items", { lineItemCount: lineItems.length });

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.price || 0) * (item.quantity || 1), 0
    );

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        user_id: user?.id || '',
        total_amount: totalAmount.toString(),
        item_count: items.length.toString(),
        ...metadata
      }
    });

    logStep("Stripe session created", { sessionId: session.id, amount: totalAmount });

    // Create order record in Supabase
    const { data: orderData, error: orderError } = await supabaseService
      .from('orders')
      .insert({
        user_id: user?.id,
        stripe_session_id: session.id,
        amount: Math.round(totalAmount * 100), // Store in cents
        currency: 'usd',
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      logStep("Failed to create order", { error: orderError });
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep("Order created", { orderId: orderData.id });

    // Create order items for tracking
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      service_id: item.id,
      vendor_id: item.vendor_id,
      item_type: item.type || 'service',
      item_title: item.title,
      item_price: item.price || 0,
      quantity: item.quantity || 1,
      vendor_commission_percentage: item.vendor_commission_percentage || 0,
    }));

    const { error: itemsError } = await supabaseService
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      logStep("Failed to create order items", { error: itemsError });
      // Don't throw here - order is created, items are optional for checkout
    } else {
      logStep("Order items created", { itemCount: orderItems.length });
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id,
        order_id: orderData.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});