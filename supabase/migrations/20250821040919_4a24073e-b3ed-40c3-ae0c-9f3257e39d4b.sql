-- Add service_id to admin_notes table to make notes per service
ALTER TABLE public.admin_notes 
ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE CASCADE;

-- Update RLS policies to include service_id filtering
DROP POLICY IF EXISTS "Admins can view all notes" ON public.admin_notes;
DROP POLICY IF EXISTS "Admins can create notes" ON public.admin_notes;
DROP POLICY IF EXISTS "Admins can update their own notes" ON public.admin_notes;
DROP POLICY IF EXISTS "Admins can delete their own notes" ON public.admin_notes;

-- Recreate policies with service context
CREATE POLICY "Admins can view all service notes" 
ON public.admin_notes 
FOR SELECT 
USING (get_user_admin_status());

CREATE POLICY "Admins can create service notes" 
ON public.admin_notes 
FOR INSERT 
WITH CHECK (get_user_admin_status() AND auth.uid() = created_by AND service_id IS NOT NULL);

CREATE POLICY "Admins can update their own service notes" 
ON public.admin_notes 
FOR UPDATE 
USING (get_user_admin_status() AND auth.uid() = created_by);

CREATE POLICY "Admins can delete their own service notes" 
ON public.admin_notes 
FOR DELETE 
USING (get_user_admin_status() AND auth.uid() = created_by);