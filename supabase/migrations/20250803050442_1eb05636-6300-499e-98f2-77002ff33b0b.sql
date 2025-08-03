-- Clean up redundant RLS policies on vendors table
DROP POLICY IF EXISTS "Enable read access for all users" ON vendors;
DROP POLICY IF EXISTS "Public read access to active vendors" ON vendors;

-- Clean up redundant RLS policies on services table  
DROP POLICY IF EXISTS "Enable read access for all users" ON services;
DROP POLICY IF EXISTS "Public read access to services" ON services;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;

-- Keep only the essential policies for vendors
-- (Vendors are viewable by everyone policy remains)
-- (Admin management policies remain)

-- Keep only the essential policies for services
-- (Services are viewable by everyone policy remains)
-- (Admin and vendor management policies remain)

-- Add optimized indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vendors_active_sort ON vendors(is_active, sort_order DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_services_vendor_featured ON services(vendor_id, is_featured, sort_order);

-- Analyze tables to update statistics
ANALYZE vendors;
ANALYZE services;