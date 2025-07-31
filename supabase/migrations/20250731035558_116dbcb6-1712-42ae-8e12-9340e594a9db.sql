-- Make vendor_id optional in services table
ALTER TABLE public.services 
ALTER COLUMN vendor_id DROP NOT NULL;

-- Add a comment to clarify the separation
COMMENT ON TABLE public.vendors IS 'Lenders, title companies, and other real estate/financial vendors';
COMMENT ON TABLE public.services IS 'CRM, lead generation, and other software/marketing services';