-- Move pg_net extension from public schema to extensions schema
-- First, drop the extension from public schema
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- Then install it in the extensions schema
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;