-- Add RLS policies for spiritual tables
-- Prayers table policies
CREATE POLICY "Users can view prayers" ON public.prayers FOR SELECT USING (true);
CREATE POLICY "System can insert prayers" ON public.prayers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage prayers" ON public.prayers FOR ALL USING (get_user_admin_status());

-- Scriptures table policies  
CREATE POLICY "Users can view scriptures" ON public.scriptures FOR SELECT USING (true);
CREATE POLICY "Admins can manage scriptures" ON public.scriptures FOR ALL USING (get_user_admin_status());