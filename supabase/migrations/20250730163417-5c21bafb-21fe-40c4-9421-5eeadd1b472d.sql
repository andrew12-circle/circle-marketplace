-- Create individual vendors for each service (using INSERT without ON CONFLICT)
INSERT INTO vendors (name, description, is_verified, rating, review_count) 
SELECT '360 Branding', 'Professional branding solutions for real estate agents', true, 4.8, 42
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = '360 Branding');

INSERT INTO vendors (name, description, is_verified, rating, review_count) 
SELECT 'ActiveCampaign', 'Email marketing and automation platform', true, 4.7, 38
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = 'ActiveCampaign');

INSERT INTO vendors (name, description, is_verified, rating, review_count) 
SELECT 'Agent Fire', 'Real estate website and lead generation platform', true, 4.6, 35
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = 'Agent Fire');

INSERT INTO vendors (name, description, is_verified, rating, review_count) 
SELECT 'Buffini & Co.', 'Real estate coaching and training programs', true, 4.9, 67
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = 'Buffini & Co.');

INSERT INTO vendors (name, description, is_verified, rating, review_count) 
SELECT 'Cinc', 'Real estate CRM and lead management system', true, 4.5, 29
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = 'Cinc');

INSERT INTO vendors (name, description, is_verified, rating, review_count) 
SELECT 'Tom Ferry', 'Real estate coaching and business development', true, 4.8, 54
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = 'Tom Ferry');