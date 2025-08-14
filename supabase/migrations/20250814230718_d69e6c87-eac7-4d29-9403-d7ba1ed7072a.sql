-- Temporarily set Circle Marketplace to unverified for testing
UPDATE public.vendors SET is_verified = false WHERE name = 'Circle Marketplace';