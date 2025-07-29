-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  phone TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  location TEXT,
  co_marketing_agents INTEGER DEFAULT 0,
  campaigns_funded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services/products table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  discount_percentage INTEGER,
  image_url TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_top_pick BOOLEAN DEFAULT false,
  contribution_amount DECIMAL(10,2) DEFAULT 0,
  estimated_roi DECIMAL(4,2),
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  business_name TEXT,
  phone TEXT,
  location TEXT,
  circle_points INTEGER DEFAULT 0,
  is_pro_member BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved services table (user's saved/favorited services)
CREATE TABLE public.saved_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_services ENABLE ROW LEVEL SECURITY;

-- Create policies for vendors table
CREATE POLICY "Vendors are viewable by everyone" 
ON public.vendors 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert vendors" 
ON public.vendors 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update vendors" 
ON public.vendors 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create policies for services table
CREATE POLICY "Services are viewable by everyone" 
ON public.services 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert services" 
ON public.services 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update services" 
ON public.services 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create policies for profiles table
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for saved services table
CREATE POLICY "Users can view their own saved services" 
ON public.saved_services 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can save services for themselves" 
ON public.saved_services 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own saved services" 
ON public.saved_services 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.vendors (name, description, logo_url, website_url, contact_email, rating, review_count, is_verified, location, co_marketing_agents, campaigns_funded) VALUES
('Digital Marketing Pro', 'Expert digital marketing solutions for real estate agents', 'https://via.placeholder.com/80x80', 'https://digitalmarketingpro.com', 'hello@digitalmarketingpro.com', 4.8, 124, true, 'Nashville, TN', 45, 88),
('PrintCraft Solutions', 'Professional print marketing materials and campaigns', 'https://via.placeholder.com/80x80', 'https://printcraft.com', 'info@printcraft.com', 4.9, 95, true, 'Franklin, TN', 30, 60),
('Elite Title Solutions', 'Trusted title and escrow services', 'https://via.placeholder.com/80x80', 'https://elitetitle.com', 'contact@elitetitle.com', 4.9, 87, true, 'Nashville, TN', 25, 45),
('Apex Mortgage Solutions', 'Your trusted partner for seamless home financing', 'https://via.placeholder.com/80x80', 'https://apexmortgage.com', 'loans@apexmortgage.com', 4.8, 120, true, 'Brentwood, TN', 40, 75);

INSERT INTO public.services (vendor_id, title, description, category, price, original_price, discount_percentage, image_url, tags, is_featured, is_top_pick, contribution_amount, estimated_roi, duration) VALUES
((SELECT id FROM public.vendors WHERE name = 'Digital Marketing Pro'), 'Facebook & Google Ads Campaign', 'Professional setup and management of targeted digital ads', 'Digital Ads', 899.00, 1299.00, 31, 'https://via.placeholder.com/300x200', ARRAY['Digital Marketing', 'Lead Generation', 'Facebook', 'Google'], true, true, 200.00, 3.5, '30 days'),
((SELECT id FROM public.vendors WHERE name = 'PrintCraft Solutions'), 'Just Listed Postcard Campaign', 'Eye-catching postcards for your latest listings', 'Print Marketing', 299.00, 399.00, 25, 'https://via.placeholder.com/300x200', ARRAY['Print Marketing', 'Postcards', 'Listings'], true, false, 100.00, 2.8, '2 weeks'),
((SELECT id FROM public.vendors WHERE name = 'Digital Marketing Pro'), 'Social Media Management Package', 'Complete social media content creation and posting', 'Social Media Management', 599.00, 799.00, 25, 'https://via.placeholder.com/300x200', ARRAY['Social Media', 'Content Creation', 'Instagram', 'Facebook'], false, true, 150.00, 2.2, '30 days'),
((SELECT id FROM public.vendors WHERE name = 'PrintCraft Solutions'), 'Geo-Farm Postcard Series', 'Targeted postcard campaigns for your farm area', 'Print Marketing', 499.00, 699.00, 29, 'https://via.placeholder.com/300x200', ARRAY['Print Marketing', 'Geo-Farm', 'Postcards'], true, false, 125.00, 3.1, '6 weeks');