-- Create backup tables for financial data protection
CREATE TABLE public.financial_data_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL, -- 'daily', 'transaction', 'monthly_reconciliation'
  backup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_hash TEXT NOT NULL, -- SHA-256 hash for integrity verification
  backup_data JSONB NOT NULL,
  backup_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create backup monitoring table
CREATE TABLE public.backup_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_id UUID REFERENCES public.financial_data_backups(id),
  check_type TEXT NOT NULL, -- 'integrity', 'completeness', 'recovery_test'
  check_result BOOLEAN NOT NULL,
  check_details JSONB DEFAULT '{}',
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit log checksums for immutability
CREATE TABLE public.audit_log_checksums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_log_id UUID NOT NULL,
  checksum TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on backup tables
ALTER TABLE public.financial_data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log_checksums ENABLE ROW LEVEL SECURITY;

-- RLS policies for backup tables (admin only)
CREATE POLICY "Only admins can view backups" 
ON public.financial_data_backups 
FOR SELECT 
USING (get_user_admin_status());

CREATE POLICY "System can create backups" 
ON public.financial_data_backups 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view backup monitoring" 
ON public.backup_monitoring 
FOR SELECT 
USING (get_user_admin_status());

CREATE POLICY "System can create monitoring records" 
ON public.backup_monitoring 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view checksums" 
ON public.audit_log_checksums 
FOR SELECT 
USING (get_user_admin_status());

CREATE POLICY "System can create checksums" 
ON public.audit_log_checksums 
FOR INSERT 
WITH CHECK (true);

-- Function to create data checksums
CREATE OR REPLACE FUNCTION public.create_data_checksum(data_json JSONB)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Create SHA-256 hash of the JSON data
  RETURN encode(digest(data_json::text, 'sha256'), 'hex');
END;
$$;

-- Function to backup financial data
CREATE OR REPLACE FUNCTION public.backup_financial_data(backup_type_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  backup_id UUID;
  backup_data JSONB;
  data_hash TEXT;
  backup_size_val INTEGER;
BEGIN
  -- Compile all financial data
  SELECT jsonb_build_object(
    'point_allocations', (SELECT jsonb_agg(to_jsonb(pa)) FROM public.point_allocations pa),
    'point_transactions', (SELECT jsonb_agg(to_jsonb(pt)) FROM public.point_transactions pt),
    'point_charges', (SELECT jsonb_agg(to_jsonb(pc)) FROM public.point_charges pc),
    'profiles_financial', (SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', p.user_id,
        'circle_points', p.circle_points,
        'total_earnings', p.total_earnings,
        'revenue_share_percentage', p.revenue_share_percentage
      )
    ) FROM public.profiles p),
    'backup_timestamp', now()
  ) INTO backup_data;
  
  -- Calculate hash and size
  data_hash := public.create_data_checksum(backup_data);
  backup_size_val := octet_length(backup_data::text);
  
  -- Insert backup record
  INSERT INTO public.financial_data_backups (
    backup_type, data_hash, backup_data, backup_size
  ) VALUES (
    backup_type_param, data_hash, backup_data, backup_size_val
  ) RETURNING id INTO backup_id;
  
  RETURN backup_id;
END;
$$;

-- Function to verify backup integrity
CREATE OR REPLACE FUNCTION public.verify_backup_integrity(backup_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  backup_record RECORD;
  calculated_hash TEXT;
  is_valid BOOLEAN := false;
BEGIN
  -- Get backup record
  SELECT * INTO backup_record
  FROM public.financial_data_backups
  WHERE id = backup_id_param;
  
  IF backup_record.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Recalculate hash
  calculated_hash := public.create_data_checksum(backup_record.backup_data);
  
  -- Check if hashes match
  is_valid := (calculated_hash = backup_record.data_hash);
  
  -- Log monitoring result
  INSERT INTO public.backup_monitoring (
    backup_id, check_type, check_result, check_details
  ) VALUES (
    backup_id_param, 'integrity', is_valid,
    jsonb_build_object(
      'original_hash', backup_record.data_hash,
      'calculated_hash', calculated_hash
    )
  );
  
  RETURN is_valid;
END;
$$;