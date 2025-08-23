-- Create RLS policies for content table to allow playbook creation

-- Allow users to view published content (public read access)
CREATE POLICY "Allow public read access to published content" 
ON public.content 
FOR SELECT 
USING (is_published = true);

-- Allow users to view their own content (private access)
CREATE POLICY "Allow users to view their own content" 
ON public.content 
FOR SELECT 
USING (auth.uid() = creator_id);

-- Allow authenticated users to create content
CREATE POLICY "Allow authenticated users to create content" 
ON public.content 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id AND auth.uid() IS NOT NULL);

-- Allow users to update their own content
CREATE POLICY "Allow users to update their own content" 
ON public.content 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- Allow users to delete their own content
CREATE POLICY "Allow users to delete their own content" 
ON public.content 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Create RLS policies for playbook_creation_progress table
CREATE POLICY "Allow users to view their own playbook progress" 
ON public.playbook_creation_progress 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Allow users to create their own playbook progress" 
ON public.playbook_creation_progress 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update their own playbook progress" 
ON public.playbook_creation_progress 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Allow users to delete their own playbook progress" 
ON public.playbook_creation_progress 
FOR DELETE 
USING (auth.uid() = creator_id);