-- Add disclaimer_id column to services table to allow per-service disclaimers
ALTER TABLE public.services 
ADD COLUMN disclaimer_id UUID REFERENCES public.respa_disclaimers(id);

-- Create index for better performance
CREATE INDEX idx_services_disclaimer_id ON public.services(disclaimer_id);

-- Add some example disclaimers for different service types
INSERT INTO public.respa_disclaimers (title, content, button_text, button_url, is_active) VALUES
('RESPA Co-Pay Disclosure', 'This service allows for co-payment arrangements in compliance with RESPA regulations. Co-pay percentages are capped at legally compliant limits and are subject to vendor approval and compliance review.', 'Learn More', '/legal/copay-compliance', true),
('Marketing Co-Pay Notice', 'Co-marketing arrangements are available for this service. All agreements comply with RESPA Section 8 requirements and industry best practices for ethical business conduct.', 'View Guidelines', '/legal/marketing-guidelines', true),
('Premium Service Disclosure', 'This premium service includes enhanced features and priority support. Co-pay options may be available subject to compliance review and vendor approval.', 'Premium Details', '/services/premium-info', true);