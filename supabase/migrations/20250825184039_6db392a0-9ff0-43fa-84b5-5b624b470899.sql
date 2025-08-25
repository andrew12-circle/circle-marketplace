-- Enable pgcrypto extension for gen_random_bytes() function
-- This is required for admin security functionality
CREATE EXTENSION IF NOT EXISTS pgcrypto;