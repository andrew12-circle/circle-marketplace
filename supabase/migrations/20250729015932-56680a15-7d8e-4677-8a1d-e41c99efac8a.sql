-- Add requires_quote column to services table
ALTER TABLE public.services ADD COLUMN requires_quote BOOLEAN DEFAULT false;

-- Update some existing services to require quotes (custom high-value services)
UPDATE public.services 
SET requires_quote = true 
WHERE title IN ('Facebook & Google Ads Campaign', 'Social Media Management Package');

-- Add more sample services with different pricing and quote requirements
INSERT INTO public.services (vendor_id, title, description, category, price, original_price, discount_percentage, image_url, tags, is_featured, is_top_pick, contribution_amount, estimated_roi, duration, requires_quote) VALUES

-- Direct purchase items
((SELECT id FROM public.vendors WHERE name = 'PrintCraft Solutions'), 'Real Estate Flyer Template Pack', 'Professional flyer templates for listings and open houses', 'Print Marketing', 49.00, 79.00, 38, 'https://via.placeholder.com/300x200', ARRAY['Templates', 'Print Marketing', 'DIY'], false, false, 0.00, 1.5, 'Instant Download', false),

((SELECT id FROM public.vendors WHERE name = 'Digital Marketing Pro'), 'Social Media Content Calendar', 'Pre-made social media posts for 30 days', 'Social Media Management', 99.00, 149.00, 34, 'https://via.placeholder.com/300x200', ARRAY['Social Media', 'Content', 'Templates'], true, false, 0.00, 2.0, 'Instant Access', false),

((SELECT id FROM public.vendors WHERE name = 'Elite Title Solutions'), 'Basic Title Insurance Quote', 'Standard residential title insurance', 'Legal Services', 299.00, 399.00, 25, 'https://via.placeholder.com/300x200', ARRAY['Title Insurance', 'Legal', 'Residential'], false, false, 50.00, 1.8, '2-3 days', false),

-- Quote required items  
((SELECT id FROM public.vendors WHERE name = 'Digital Marketing Pro'), 'Custom Website Design & Development', 'Full custom real estate website with IDX integration', 'Web Development', 0.00, 0.00, 0, 'https://via.placeholder.com/300x200', ARRAY['Website', 'Custom Development', 'IDX'], true, true, 500.00, 4.2, '4-6 weeks', true),

((SELECT id FROM public.vendors WHERE name = 'PrintCraft Solutions'), 'Large Scale Direct Mail Campaign', 'Custom direct mail campaign for 10,000+ recipients', 'Print Marketing', 0.00, 0.00, 0, 'https://via.placeholder.com/300x200', ARRAY['Direct Mail', 'Large Scale', 'Custom'], true, false, 1000.00, 3.5, '2-3 weeks', true),

((SELECT id FROM public.vendors WHERE name = 'Apex Mortgage Solutions'), 'Custom Co-Marketing Campaign Setup', 'Joint marketing campaign setup with lender partnership', 'Co-Marketing', 0.00, 0.00, 0, 'https://via.placeholder.com/300x200', ARRAY['Co-Marketing', 'Partnership', 'Custom'], false, true, 750.00, 5.0, '3-4 weeks', true);