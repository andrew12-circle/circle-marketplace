-- Create storage buckets for playbook covers and agent headshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('playbook-covers', 'playbook-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('agent-headshots', 'agent-headshots', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for playbook covers bucket
CREATE POLICY "Public read access for playbook covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'playbook-covers');

CREATE POLICY "Authenticated users can upload playbook covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'playbook-covers' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update playbook covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'playbook-covers' 
  AND auth.role() = 'authenticated'
);

-- Create RLS policies for agent headshots bucket
CREATE POLICY "Public read access for agent headshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-headshots');

CREATE POLICY "Authenticated users can upload agent headshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agent-headshots' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update agent headshots"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'agent-headshots' 
  AND auth.role() = 'authenticated'
);