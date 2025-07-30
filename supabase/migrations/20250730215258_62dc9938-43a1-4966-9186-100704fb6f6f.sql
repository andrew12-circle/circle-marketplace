-- Update the service-images bucket to support PNG, JPEG, and SVG files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg']
WHERE id = 'service-images';

-- Also update file size limit to 10MB to match our client-side validation
UPDATE storage.buckets 
SET file_size_limit = 10485760
WHERE id = 'service-images';