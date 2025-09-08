-- Create profile for Andrew if it doesn't exist
INSERT INTO profiles (id, is_admin, is_creator, creator_verified, created_at, updated_at)
VALUES ('11ea4b95-676e-48cf-83ba-0b6977b4b7cf', true, false, false, now(), now())
ON CONFLICT (id) DO UPDATE SET 
  is_admin = true, 
  updated_at = now();