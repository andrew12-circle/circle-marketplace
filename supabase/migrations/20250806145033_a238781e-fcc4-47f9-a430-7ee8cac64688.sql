-- Fix security issues from linter

-- 1. Fix function search path for existing functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Add missing policies for lenders table
CREATE POLICY "Authenticated users can insert lenders" ON public.lenders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update lenders" ON public.lenders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete lenders" ON public.lenders FOR DELETE USING (auth.uid() IS NOT NULL);

-- 3. Add missing policies for title_companies table  
CREATE POLICY "Authenticated users can insert title companies" ON public.title_companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update title companies" ON public.title_companies FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete title companies" ON public.title_companies FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. Add missing policies for agent_relationships table
CREATE POLICY "Users can insert relationships for their agent" ON public.agent_relationships FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.agents WHERE 
    (agents.id = agent_relationships.agent_a_id OR agents.id = agent_relationships.agent_b_id) 
    AND agents.user_id = auth.uid())
);
CREATE POLICY "Users can update relationships for their agent" ON public.agent_relationships FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.agents WHERE 
    (agents.id = agent_relationships.agent_a_id OR agents.id = agent_relationships.agent_b_id) 
    AND agents.user_id = auth.uid())
);
CREATE POLICY "Users can delete relationships for their agent" ON public.agent_relationships FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.agents WHERE 
    (agents.id = agent_relationships.agent_a_id OR agents.id = agent_relationships.agent_b_id) 
    AND agents.user_id = auth.uid())
);

-- 5. Add missing policies for transactions table
CREATE POLICY "Users can insert transactions for their agent profile" ON public.transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = transactions.agent_id AND agents.user_id = auth.uid())
);
CREATE POLICY "Users can update transactions for their agent profile" ON public.transactions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = transactions.agent_id AND agents.user_id = auth.uid())
);
CREATE POLICY "Users can delete transactions for their agent profile" ON public.transactions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = transactions.agent_id AND agents.user_id = auth.uid())
);