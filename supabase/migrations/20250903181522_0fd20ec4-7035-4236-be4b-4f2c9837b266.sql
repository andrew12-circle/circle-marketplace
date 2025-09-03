-- Fix the app_events foreign key constraint issue with correct syntax
-- First check what foreign key constraints exist on app_events
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'app_events'
  AND tc.table_schema = 'public';

-- Drop the problematic foreign key constraint using correct syntax
ALTER TABLE public.app_events DROP CONSTRAINT IF EXISTS app_events_user_id_fkey;

-- Make sure user_id column allows NULL values
ALTER TABLE public.app_events ALTER COLUMN user_id DROP NOT NULL;