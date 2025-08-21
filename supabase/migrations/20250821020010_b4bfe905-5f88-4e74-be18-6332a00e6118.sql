-- Enable facilitator checkout feature
INSERT INTO public.app_config (facilitator_checkout_enabled) 
VALUES (true)
ON CONFLICT DO NOTHING;

-- If record exists, update it
UPDATE public.app_config 
SET facilitator_checkout_enabled = true 
WHERE EXISTS (SELECT 1 FROM public.app_config);