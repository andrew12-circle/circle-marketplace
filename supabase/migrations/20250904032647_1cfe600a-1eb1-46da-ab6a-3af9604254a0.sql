-- Add multilingual support to services table
ALTER TABLE public.services 
ADD COLUMN title_es TEXT,
ADD COLUMN title_fr TEXT,
ADD COLUMN description_es TEXT,
ADD COLUMN description_fr TEXT;

-- Add indexes for better performance when querying translated content
CREATE INDEX idx_services_title_es ON public.services(title_es) WHERE title_es IS NOT NULL;
CREATE INDEX idx_services_title_fr ON public.services(title_fr) WHERE title_fr IS NOT NULL;
CREATE INDEX idx_services_description_es ON public.services(description_es) WHERE description_es IS NOT NULL;
CREATE INDEX idx_services_description_fr ON public.services(description_fr) WHERE description_fr IS NOT NULL;

-- Add multilingual support to vendors table
ALTER TABLE public.vendors 
ADD COLUMN name_es TEXT,
ADD COLUMN name_fr TEXT,
ADD COLUMN description_es TEXT,
ADD COLUMN description_fr TEXT;

-- Create indexes for vendor translations
CREATE INDEX idx_vendors_name_es ON public.vendors(name_es) WHERE name_es IS NOT NULL;
CREATE INDEX idx_vendors_name_fr ON public.vendors(name_fr) WHERE name_fr IS NOT NULL;

-- Add sample translations for demonstration (using proper PostgreSQL syntax)
UPDATE public.services 
SET 
  title_es = CASE 
    WHEN title LIKE '%CRM%' THEN REPLACE(title, 'CRM', 'Sistema de Gestión de Clientes')
    WHEN title LIKE '%Lead%' THEN REPLACE(title, 'Lead', 'Prospecto')
    WHEN title LIKE '%Marketing%' THEN REPLACE(title, 'Marketing', 'Mercadeo')
    ELSE title || ' (ES)'
  END,
  title_fr = CASE 
    WHEN title LIKE '%CRM%' THEN REPLACE(title, 'CRM', 'Gestion de la Relation Client')
    WHEN title LIKE '%Lead%' THEN REPLACE(title, 'Lead', 'Prospect')
    WHEN title LIKE '%Marketing%' THEN REPLACE(title, 'Marketing', 'Marketing')
    ELSE title || ' (FR)'
  END,
  description_es = CASE 
    WHEN description IS NOT NULL THEN description || ' - Descripción en español.'
    ELSE 'Descripción en español disponible próximamente.'
  END,
  description_fr = CASE 
    WHEN description IS NOT NULL THEN description || ' - Description en français.'
    ELSE 'Description en français disponible bientôt.'
  END
WHERE is_active = true 
  AND id IN (
    SELECT id FROM public.services 
    WHERE is_active = true 
    ORDER BY created_at DESC 
    LIMIT 10
  );