-- Create playbooks table
CREATE TABLE IF NOT EXISTS public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_url TEXT,
  teaser_one_liner TEXT,
  duration_minutes INTEGER,
  price_usd NUMERIC(10,2),
  member_price_usd NUMERIC(10,2),
  market_city TEXT,
  market_state TEXT,
  agent_name TEXT,
  agent_headshot_url TEXT,
  production_units_l12m INTEGER,
  production_volume_l12m NUMERIC(12,2),
  tier_label TEXT,
  team_size TEXT,
  niches JSONB DEFAULT '[]'::jsonb,
  tools_used JSONB DEFAULT '[]'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  outcomes JSONB DEFAULT '[]'::jsonb,
  preview_video_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('live', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  playbook_id UUID REFERENCES public.playbooks(id) ON DELETE CASCADE,
  price_paid NUMERIC(10,2),
  payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on playbooks
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

-- Playbooks are viewable by everyone if live
CREATE POLICY "Playbooks are viewable by everyone if live"
ON public.playbooks
FOR SELECT
USING (status = 'live');

-- Enable RLS on purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own purchases
CREATE POLICY "Users can insert their own purchases"
ON public.purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_playbooks_status ON public.playbooks(status);
CREATE INDEX IF NOT EXISTS idx_playbooks_market ON public.playbooks(market_city, market_state);
CREATE INDEX IF NOT EXISTS idx_playbooks_slug ON public.playbooks(slug);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_playbook_id ON public.purchases(playbook_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_playbooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_playbooks_updated_at
BEFORE UPDATE ON public.playbooks
FOR EACH ROW
EXECUTE FUNCTION public.update_playbooks_updated_at();