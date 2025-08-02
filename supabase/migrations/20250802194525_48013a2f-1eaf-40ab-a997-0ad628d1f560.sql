-- Create creator_webhooks table
CREATE TABLE public.creator_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL DEFAULT 'mixed',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on creator_webhooks
ALTER TABLE public.creator_webhooks ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own webhooks
CREATE POLICY "Creators can manage their own webhooks" 
ON public.creator_webhooks 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create creator_api_configs table
CREATE TABLE public.creator_api_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  youtube_api_key TEXT,
  mailchimp_api_key TEXT,
  zapier_webhook TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on creator_api_configs
ALTER TABLE public.creator_api_configs ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own API configs
CREATE POLICY "Creators can manage their own API configs" 
ON public.creator_api_configs 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create rss_import_feeds table
CREATE TABLE public.rss_import_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feed_url TEXT NOT NULL,
  feed_title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_imported_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rss_import_feeds
ALTER TABLE public.rss_import_feeds ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own RSS feeds
CREATE POLICY "Creators can manage their own RSS feeds" 
ON public.rss_import_feeds 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_creator_webhooks_updated_at
BEFORE UPDATE ON public.creator_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_api_configs_updated_at
BEFORE UPDATE ON public.creator_api_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rss_import_feeds_updated_at
BEFORE UPDATE ON public.rss_import_feeds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();