-- Enable RLS on vendors table if not already enabled
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to vendors
CREATE POLICY "Enable read access for all users" ON public.vendors
FOR SELECT USING (true);

-- Update content table policy to allow public read access to published content
DROP POLICY IF EXISTS "Published content visibility with location filter" ON public.content;

CREATE POLICY "Enable read access to published content" ON public.content
FOR SELECT USING (is_published = true);

-- Also ensure services table has public read access
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.services
FOR SELECT USING (true);