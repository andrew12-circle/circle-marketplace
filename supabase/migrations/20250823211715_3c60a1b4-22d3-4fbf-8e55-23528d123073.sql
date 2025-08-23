-- Force cache bust to ensure users get updated frontend code
UPDATE public.app_config 
SET force_cache_bust_after = now() + interval '1 minute'
WHERE force_cache_bust_after IS NULL OR force_cache_bust_after < now();