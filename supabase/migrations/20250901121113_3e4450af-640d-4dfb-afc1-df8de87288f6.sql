-- Fix infinite recursion in storage policies by updating compliance_team_members policies
-- and ensuring proper storage bucket policies

-- First, drop and recreate the problematic compliance_team_members policies
DROP POLICY IF EXISTS "compliance_team_members_select_policy" ON compliance_team_members;
DROP POLICY IF EXISTS "compliance_team_members_insert_policy" ON compliance_team_members;
DROP POLICY IF EXISTS "compliance_team_members_update_policy" ON compliance_team_members;
DROP POLICY IF EXISTS "compliance_team_members_delete_policy" ON compliance_team_members;

-- Create simple, non-recursive policies for compliance_team_members
CREATE POLICY "compliance_team_members_select_policy" ON compliance_team_members
FOR SELECT USING (
  auth.uid() IS NOT NULL
);

CREATE POLICY "compliance_team_members_insert_policy" ON compliance_team_members
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "compliance_team_members_update_policy" ON compliance_team_members
FOR UPDATE USING (
  auth.uid() IS NOT NULL
);

CREATE POLICY "compliance_team_members_delete_policy" ON compliance_team_members
For DELETE USING (
  auth.uid() IS NOT NULL
);

-- Ensure avatars bucket exists and has proper policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Service images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage service images" ON storage.objects;

-- Create simple storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload to avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);