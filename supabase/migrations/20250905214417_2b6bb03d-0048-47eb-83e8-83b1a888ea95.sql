-- Create enums that may be missing
CREATE TYPE order_status AS ENUM ('created', 'awaiting_quote', 'awaiting_payment', 'paid', 'in_fulfillment', 'fulfilled', 'canceled', 'refunded');
CREATE TYPE quote_status AS ENUM ('submitted', 'approved', 'rejected');
CREATE TYPE attribution_event_type AS ENUM ('click', 'trial_started', 'trial_converted', 'purchase');

-- Add missing columns to existing orders table (if not already added)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vendor_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS listing_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_session_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_cents INTEGER;

-- Add foreign key constraint conditionally
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_listing_id_fkey' 
    AND table_name = 'orders'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_listing_id_fkey 
      FOREIGN KEY (listing_id) REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Convert existing amount to amount_cents if needed
UPDATE public.orders SET amount_cents = amount * 100 WHERE amount_cents IS NULL AND amount IS NOT NULL;

-- Update status to use new enum (with default fallback)
UPDATE public.orders SET status = 'created' WHERE status IS NULL;
ALTER TABLE public.orders ALTER COLUMN status TYPE order_status USING 
  CASE 
    WHEN status = 'pending' THEN 'created'::order_status
    WHEN status = 'paid' THEN 'paid'::order_status
    WHEN status = 'completed' THEN 'fulfilled'::order_status
    WHEN status = 'cancelled' THEN 'canceled'::order_status
    WHEN status = 'refunded' THEN 'refunded'::order_status
    ELSE 'created'::order_status
  END;