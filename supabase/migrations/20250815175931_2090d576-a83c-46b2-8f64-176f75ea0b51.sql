-- Create vendor_content table to store media and documents
CREATE TABLE public.vendor_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'video_youtube', 'video_vimeo', 'image', 'document'
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT NOT NULL, -- YouTube/Vimeo URL or file storage path
  thumbnail_url TEXT, -- For videos and documents
  file_size INTEGER, -- For uploaded files
  mime_type TEXT, -- For uploaded files
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all vendor content" 
ON public.vendor_content 
FOR ALL 
USING (get_user_admin_status());

CREATE POLICY "Vendors can manage their own content" 
ON public.vendor_content 
FOR ALL 
USING (auth.uid() = vendor_id);

CREATE POLICY "Content is viewable by everyone when active" 
ON public.vendor_content 
FOR SELECT 
USING (is_active = true);

-- Create indexes for better performance
CREATE INDEX idx_vendor_content_vendor_id ON public.vendor_content(vendor_id);
CREATE INDEX idx_vendor_content_type ON public.vendor_content(content_type);
CREATE INDEX idx_vendor_content_active ON public.vendor_content(is_active);
CREATE INDEX idx_vendor_content_display_order ON public.vendor_content(display_order);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vendor_content_updated_at
BEFORE UPDATE ON public.vendor_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for vendor content files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-content', 'vendor-content', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for vendor content
CREATE POLICY "Vendor content is publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vendor-content');

CREATE POLICY "Admins can upload vendor content" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vendor-content' AND get_user_admin_status());

CREATE POLICY "Admins can update vendor content" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vendor-content' AND get_user_admin_status());

CREATE POLICY "Admins can delete vendor content" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vendor-content' AND get_user_admin_status());