-- Add public read access to services for unauthenticated users
CREATE POLICY "Public can view services" ON services
FOR SELECT 
USING (true);

-- Add public read access to vendors for unauthenticated users  
CREATE POLICY "Public can view vendors" ON vendors
FOR SELECT
USING (true);