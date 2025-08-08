-- Phase 1: Database Schema & Data Cleanup

-- Create a dedicated system user for auto-imported content
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'system@circle-platform.com',
  '{"system_user": true, "display_name": "System Auto-Import"}'::jsonb,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding profile for system user
INSERT INTO public.profiles (
  user_id,
  display_name,
  bio,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'System Auto-Import',
  'Automated content import system',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  updated_at = now();

-- Clean up corrupted channels data where creator_id contains YouTube Channel IDs instead of UUIDs
UPDATE public.channels 
SET creator_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE creator_id::text ~ '^UC[a-zA-Z0-9_-]+$' -- YouTube Channel ID pattern
   OR creator_id::text ~ '^[a-zA-Z0-9_-]{24}$' -- Another YouTube ID pattern
   OR LENGTH(creator_id::text) != 36; -- Not a proper UUID length

-- Clean up corrupted content data where creator_id contains invalid UUIDs
UPDATE public.content 
SET creator_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE creator_id IS NOT NULL 
  AND (creator_id::text ~ '^UC[a-zA-Z0-9_-]+$' -- YouTube Channel ID pattern
       OR creator_id::text ~ '^[a-zA-Z0-9_-]{24}$' -- Another YouTube ID pattern
       OR LENGTH(creator_id::text) != 36); -- Not a proper UUID length

-- Remove any channels records that have completely invalid data
DELETE FROM public.channels 
WHERE youtube_channel_id IS NULL 
  AND name IS NULL 
  AND creator_id IS NULL;

-- Remove any content records that have completely invalid data and no metadata
DELETE FROM public.content 
WHERE title IS NULL 
  AND content_url IS NULL 
  AND metadata IS NULL;

-- Update auto-imported channels to ensure they have proper creator_id
UPDATE public.channels 
SET creator_id = '00000000-0000-0000-0000-000000000001'::uuid,
    auto_imported = true
WHERE auto_imported = true 
  AND creator_id != '00000000-0000-0000-0000-000000000001'::uuid;

-- Ensure all auto-imported content has proper creator_id
UPDATE public.content 
SET creator_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE metadata->>'auto_imported' = 'true'
  AND creator_id != '00000000-0000-0000-0000-000000000001'::uuid;

-- Add validation function for UUID fields
CREATE OR REPLACE FUNCTION public.validate_uuid_field(input_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if the input is a valid UUID format
  IF input_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- Add trigger to prevent invalid UUID insertion in channels
CREATE OR REPLACE FUNCTION public.validate_channels_creator_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validate creator_id is a proper UUID
  IF NEW.creator_id IS NOT NULL AND NOT public.validate_uuid_field(NEW.creator_id::text) THEN
    RAISE EXCEPTION 'Invalid UUID format for creator_id: %', NEW.creator_id;
  END IF;
  
  -- If it's an auto-import and no valid creator_id, use system user
  IF NEW.auto_imported = true AND NEW.creator_id IS NULL THEN
    NEW.creator_id = '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for channels validation
DROP TRIGGER IF EXISTS validate_channels_creator_id_trigger ON public.channels;
CREATE TRIGGER validate_channels_creator_id_trigger
  BEFORE INSERT OR UPDATE ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_channels_creator_id();

-- Add trigger to prevent invalid UUID insertion in content
CREATE OR REPLACE FUNCTION public.validate_content_creator_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validate creator_id is a proper UUID
  IF NEW.creator_id IS NOT NULL AND NOT public.validate_uuid_field(NEW.creator_id::text) THEN
    RAISE EXCEPTION 'Invalid UUID format for creator_id: %', NEW.creator_id;
  END IF;
  
  -- If it's auto-imported content and no valid creator_id, use system user
  IF NEW.metadata->>'auto_imported' = 'true' AND NEW.creator_id IS NULL THEN
    NEW.creator_id = '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for content validation
DROP TRIGGER IF EXISTS validate_content_creator_id_trigger ON public.content;
CREATE TRIGGER validate_content_creator_id_trigger
  BEFORE INSERT OR UPDATE ON public.content
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_content_creator_id();