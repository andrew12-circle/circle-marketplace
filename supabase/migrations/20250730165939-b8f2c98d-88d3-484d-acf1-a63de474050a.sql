-- Insert sample vendor availability data
INSERT INTO public.vendor_availability (vendor_id, is_available_now, availability_message, calendar_link)
SELECT 
  id,
  CASE 
    WHEN name = '360 Branding' THEN true
    WHEN name = 'ActiveCampaign' THEN false
    ELSE (random() > 0.5)
  END as is_available_now,
  CASE 
    WHEN name = '360 Branding' THEN 'Available now - typically responds within 30 minutes'
    WHEN name = 'ActiveCampaign' THEN 'Next available slot tomorrow at 2 PM'
    ELSE 'Usually responds within 2-4 hours'
  END as availability_message,
  'https://calendly.com/' || lower(replace(name, ' ', '-')) || '/consultation' as calendar_link
FROM public.vendors
WHERE name IN ('360 Branding', 'ActiveCampaign', 'Agent Fire', 'Buffini & Co.', 'Cinc', 'Tom Ferry')
ON CONFLICT (vendor_id) DO UPDATE SET
  is_available_now = EXCLUDED.is_available_now,
  availability_message = EXCLUDED.availability_message,
  calendar_link = EXCLUDED.calendar_link;