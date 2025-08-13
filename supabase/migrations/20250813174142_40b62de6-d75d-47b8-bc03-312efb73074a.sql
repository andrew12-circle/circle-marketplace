-- Create tables for spiritual dedication system
CREATE TABLE IF NOT EXISTS public.scriptures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL,
  text TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT CHECK (kind IN ('dedication','deploy','daily','manual')) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  meta JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.scriptures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

-- RLS policies for scriptures (readable by all authenticated users)
CREATE POLICY "Scriptures are viewable by authenticated users" 
ON public.scriptures FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage scriptures" 
ON public.scriptures FOR ALL 
USING (get_user_admin_status());

-- RLS policies for prayers (readable by admins, insertable by system)
CREATE POLICY "Admins can view prayers" 
ON public.prayers FOR SELECT 
USING (get_user_admin_status());

CREATE POLICY "System can insert prayers" 
ON public.prayers FOR INSERT 
WITH CHECK (true);

-- Seed KJV verses
INSERT INTO public.scriptures (ref, text, tags) VALUES
('Psalm 91:1-2','He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty. I will say of the Lord, He is my refuge and my fortress: my God; in him will I trust.', '{covering,protection}'),
('Isaiah 54:17','No weapon that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn. This is the heritage of the servants of the Lord, and their righteousness is of me, saith the Lord.', '{protection,victory}'),
('Revelation 12:11','And they overcame him by the blood of the Lamb, and by the word of their testimony; and they loved not their lives unto the death.', '{victory,testimony}'),
('Numbers 6:24-26','The Lord bless thee, and keep thee. The Lord make his face shine upon thee, and be gracious unto thee. The Lord lift up his countenance upon thee, and give thee peace.', '{blessing,peace}'),
('Psalm 91:11','For he shall give his angels charge over thee, to keep thee in all thy ways.', '{protection,angels}'),
('Ephesians 6:11','Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.', '{spiritual warfare,armor}'),
('2 Corinthians 10:4','For the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds.', '{spiritual warfare,victory}')
ON CONFLICT DO NOTHING;