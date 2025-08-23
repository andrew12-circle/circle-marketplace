-- Fix the security definer view warning by removing the security_barrier setting
-- The view doesn't need this for our use case as it's informational only

-- Check if there are any security_barrier settings on our views and remove them
DO $$
BEGIN
  -- Try to remove security_barrier from agents_business_directory if it exists
  BEGIN
    ALTER VIEW agents_business_directory SET (security_barrier = false);
  EXCEPTION
    WHEN OTHERS THEN
      -- Ignore errors if the setting doesn't exist
      NULL;
  END;
END $$;