-- Add pricing tiers structure to services table
ALTER TABLE public.services 
ADD COLUMN base_pricing_tiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN pro_pricing_tiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN copay_pricing_tiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN supports_copay BOOLEAN DEFAULT false,
ADD COLUMN pricing_structure_version INTEGER DEFAULT 1;

-- Update existing services to migrate current pricing to new structure
UPDATE public.services 
SET 
  base_pricing_tiers = CASE 
    WHEN retail_price IS NOT NULL THEN 
      jsonb_build_array(
        jsonb_build_object(
          'id', 'basic',
          'name', 'Basic',
          'price', (retail_price::numeric * 0.75)::text,
          'features', jsonb_build_array('Essential features', 'Email support')
        ),
        jsonb_build_object(
          'id', 'standard', 
          'name', 'Standard',
          'price', retail_price,
          'features', jsonb_build_array('All basic features', 'Priority support', 'Advanced reporting'),
          'popular', true
        ),
        jsonb_build_object(
          'id', 'premium',
          'name', 'Premium', 
          'price', (retail_price::numeric * 1.5)::text,
          'features', jsonb_build_array('All standard features', 'Dedicated support', '24/7 assistance')
        ),
        jsonb_build_object(
          'id', 'enterprise',
          'name', 'Enterprise',
          'price', (retail_price::numeric * 2)::text, 
          'features', jsonb_build_array('All premium features', 'Custom integrations', 'Account manager')
        )
      )
    ELSE '[]'::jsonb
  END,
  pro_pricing_tiers = CASE 
    WHEN pro_price IS NOT NULL THEN
      jsonb_build_array(
        jsonb_build_object(
          'id', 'pro_basic',
          'name', 'Circle Pro Basic',
          'price', (pro_price::numeric * 0.75)::text,
          'features', jsonb_build_array('Essential features', 'Pro member support')
        ),
        jsonb_build_object(
          'id', 'pro_standard',
          'name', 'Circle Pro Standard', 
          'price', pro_price,
          'features', jsonb_build_array('All basic features', 'Pro priority support', 'Advanced reporting'),
          'popular', true
        ),
        jsonb_build_object(
          'id', 'pro_premium',
          'name', 'Circle Pro Premium',
          'price', (pro_price::numeric * 1.5)::text,
          'features', jsonb_build_array('All standard features', 'Pro dedicated support', 'Exclusive resources')
        ),
        jsonb_build_object(
          'id', 'pro_enterprise', 
          'name', 'Circle Pro Enterprise',
          'price', (pro_price::numeric * 2)::text,
          'features', jsonb_build_array('All premium features', 'White-glove service', 'Custom solutions')
        )
      )
    ELSE '[]'::jsonb
  END,
  copay_pricing_tiers = CASE 
    WHEN co_pay_price IS NOT NULL THEN
      jsonb_build_array(
        jsonb_build_object(
          'id', 'copay_basic',
          'name', 'Co-Pay Basic',
          'price', (co_pay_price::numeric * 0.75)::text,
          'features', jsonb_build_array('Essential features', 'Co-pay benefits')
        ),
        jsonb_build_object(
          'id', 'copay_standard',
          'name', 'Co-Pay Standard',
          'price', co_pay_price,
          'features', jsonb_build_array('All basic features', 'Enhanced co-pay benefits'),
          'popular', true
        ),
        jsonb_build_object(
          'id', 'copay_premium', 
          'name', 'Co-Pay Premium',
          'price', (co_pay_price::numeric * 1.5)::text,
          'features', jsonb_build_array('All standard features', 'Premium co-pay benefits')
        ),
        jsonb_build_object(
          'id', 'copay_enterprise',
          'name', 'Co-Pay Enterprise', 
          'price', (co_pay_price::numeric * 2)::text,
          'features', jsonb_build_array('All premium features', 'Maximum co-pay benefits')
        )
      )
    ELSE '[]'::jsonb
  END,
  supports_copay = CASE WHEN co_pay_price IS NOT NULL THEN true ELSE false END;

-- Add helpful indexes for pricing queries
CREATE INDEX idx_services_supports_copay ON public.services(supports_copay);
CREATE INDEX idx_services_pricing_structure_version ON public.services(pricing_structure_version);

-- Add comments for documentation
COMMENT ON COLUMN public.services.base_pricing_tiers IS 'Array of base pricing tier objects with id, name, price, features';
COMMENT ON COLUMN public.services.pro_pricing_tiers IS 'Array of Circle Pro member pricing tier objects';
COMMENT ON COLUMN public.services.copay_pricing_tiers IS 'Array of co-pay pricing tier objects for eligible services';
COMMENT ON COLUMN public.services.supports_copay IS 'Whether this service supports co-pay pricing options';
COMMENT ON COLUMN public.services.pricing_structure_version IS 'Version number for pricing structure migrations';