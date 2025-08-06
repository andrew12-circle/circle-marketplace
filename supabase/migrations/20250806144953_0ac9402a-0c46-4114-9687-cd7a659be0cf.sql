-- Create agents table for profile and contact information
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  brokerage TEXT,
  nmls_id TEXT,
  years_active INTEGER,
  bio TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  social_youtube TEXT,
  social_zillow TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lenders table
CREATE TABLE public.lenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create title_companies table
CREATE TABLE public.title_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  property_address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  close_date DATE NOT NULL,
  price NUMERIC NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buyer', 'seller')),
  property_type TEXT NOT NULL CHECK (property_type IN ('SFH', 'TH', 'Condo', 'Commercial')),
  loan_type TEXT CHECK (loan_type IN ('Conventional', 'FHA', 'VA', 'Other', 'Cash')),
  lender_id UUID REFERENCES public.lenders(id),
  title_company_id UUID REFERENCES public.title_companies(id),
  listing_id TEXT,
  mls_number TEXT,
  commission_percentage NUMERIC,
  commission_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_relationships table for tracking connections
CREATE TABLE public.agent_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_a_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  agent_b_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('direct_closing', 'shared_office', 'indirect_coop')),
  transaction_id UUID REFERENCES public.transactions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_a_id, agent_b_id, transaction_id)
);

-- Create deals table for tracking deal progress
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  close_date DATE,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller')),
  sale_price NUMERIC,
  lender_name TEXT,
  title_company TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_contract', 'closed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agents
CREATE POLICY "Agents are viewable by everyone" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Users can update their own agent profile" ON public.agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own agent profile" ON public.agents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for lenders
CREATE POLICY "Lenders are viewable by everyone" ON public.lenders FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage lenders" ON public.lenders FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for title_companies
CREATE POLICY "Title companies are viewable by everyone" ON public.title_companies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage title companies" ON public.title_companies FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for transactions
CREATE POLICY "Users can view transactions for their agent profile" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = transactions.agent_id AND agents.user_id = auth.uid())
);
CREATE POLICY "Users can manage transactions for their agent profile" ON public.transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.agents WHERE agents.id = transactions.agent_id AND agents.user_id = auth.uid())
);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (get_user_admin_status());

-- Create RLS policies for agent_relationships
CREATE POLICY "Users can view relationships for their agent" ON public.agent_relationships FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agents WHERE 
    (agents.id = agent_relationships.agent_a_id OR agents.id = agent_relationships.agent_b_id) 
    AND agents.user_id = auth.uid())
);
CREATE POLICY "Users can manage relationships for their agent" ON public.agent_relationships FOR ALL USING (
  EXISTS (SELECT 1 FROM public.agents WHERE 
    (agents.id = agent_relationships.agent_a_id OR agents.id = agent_relationships.agent_b_id) 
    AND agents.user_id = auth.uid())
);

-- Create RLS policies for deals
CREATE POLICY "Users can manage their own deals" ON public.deals FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_transactions_agent_id ON public.transactions(agent_id);
CREATE INDEX idx_transactions_close_date ON public.transactions(close_date);
CREATE INDEX idx_transactions_side ON public.transactions(side);
CREATE INDEX idx_transactions_property_type ON public.transactions(property_type);
CREATE INDEX idx_agent_relationships_agent_a ON public.agent_relationships(agent_a_id);
CREATE INDEX idx_agent_relationships_agent_b ON public.agent_relationships(agent_b_id);
CREATE INDEX idx_deals_user_id ON public.deals(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();