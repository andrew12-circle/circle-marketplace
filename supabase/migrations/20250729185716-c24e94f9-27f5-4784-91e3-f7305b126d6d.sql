-- Update RLS policy to allow users to update their saved services
CREATE POLICY "Users can update their own saved services" 
ON saved_services 
FOR UPDATE 
USING (auth.uid() = user_id);