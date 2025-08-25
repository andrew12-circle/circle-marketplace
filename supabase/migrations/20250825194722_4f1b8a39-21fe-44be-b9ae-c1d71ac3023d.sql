-- Fix the missing gen_random_bytes function by properly enabling pgcrypto
-- This should resolve the React mounting issues and admin authentication failures

-- Enable the pgcrypto extension (required for gen_random_bytes function)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify the function is available by testing it
DO $$
BEGIN
  -- Test that gen_random_bytes is now available
  PERFORM encode(gen_random_bytes(16), 'hex');
  RAISE NOTICE 'pgcrypto extension successfully enabled - gen_random_bytes is available';
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to enable pgcrypto extension: %', SQLERRM;
END
$$;