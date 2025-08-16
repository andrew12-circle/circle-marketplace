-- Create order_items table to track individual items in orders
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  vendor_id UUID REFERENCES public.vendors(id),
  item_type TEXT NOT NULL DEFAULT 'service', -- 'service', 'course', 'co-pay-request'
  item_title TEXT NOT NULL,
  item_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  vendor_commission_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items
CREATE POLICY "Users can view their own order items" ON public.order_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Vendors can view order items for their services" ON public.order_items
FOR SELECT
USING (vendor_id = auth.uid());

CREATE POLICY "Admins can view all order items" ON public.order_items
FOR SELECT
USING (get_user_admin_status());

CREATE POLICY "System can insert order items" ON public.order_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update order items" ON public.order_items
FOR UPDATE
USING (true);

-- Add indexes for performance
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_vendor_id ON public.order_items(vendor_id);
CREATE INDEX idx_order_items_service_id ON public.order_items(service_id);

-- Add updated_at trigger
CREATE TRIGGER update_order_items_updated_at
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();