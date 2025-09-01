-- Create service discount interest tracking table
CREATE TABLE public.service_discount_interest (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  vendor_id UUID,
  agent_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'marketplace',
  user_agent TEXT,
  ip_address INET,
  UNIQUE(agent_id, service_id)
);

-- Create service interest counters table
CREATE TABLE public.service_interest_counters (
  service_id UUID NOT NULL PRIMARY KEY,
  total_likes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.service_discount_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_interest_counters ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_discount_interest
CREATE POLICY "Users can insert their own discount interest" 
ON public.service_discount_interest 
FOR INSERT 
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can view their own discount interest" 
ON public.service_discount_interest 
FOR SELECT 
USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all discount interest" 
ON public.service_discount_interest 
FOR SELECT 
USING (get_user_admin_status());

-- RLS policies for service_interest_counters (public read access for counts)
CREATE POLICY "Anyone can view service interest counters" 
ON public.service_interest_counters 
FOR SELECT 
USING (true);

-- Prevent direct client modifications to counters
CREATE POLICY "No direct client modifications to counters" 
ON public.service_interest_counters 
FOR ALL 
USING (false);

-- Function to update interest counters
CREATE OR REPLACE FUNCTION public.update_service_interest_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the counter
  INSERT INTO public.service_interest_counters (service_id, total_likes, updated_at)
  VALUES (NEW.service_id, 1, now())
  ON CONFLICT (service_id) 
  DO UPDATE SET 
    total_likes = service_interest_counters.total_likes + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically update counters
CREATE TRIGGER update_interest_counter_on_insert
  AFTER INSERT ON public.service_discount_interest
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_interest_counter();