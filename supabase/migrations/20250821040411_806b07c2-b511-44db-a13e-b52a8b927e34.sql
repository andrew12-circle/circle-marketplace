-- Create admin notes table
CREATE TABLE public.admin_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_text text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all notes" 
ON public.admin_notes 
FOR SELECT 
USING (get_user_admin_status());

CREATE POLICY "Admins can create notes" 
ON public.admin_notes 
FOR INSERT 
WITH CHECK (get_user_admin_status() AND auth.uid() = created_by);

CREATE POLICY "Admins can update their own notes" 
ON public.admin_notes 
FOR UPDATE 
USING (get_user_admin_status() AND auth.uid() = created_by);

CREATE POLICY "Admins can delete their own notes" 
ON public.admin_notes 
FOR DELETE 
USING (get_user_admin_status() AND auth.uid() = created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();