-- Create individual vendors for each service
INSERT INTO vendors (name, description, is_verified, rating, review_count) VALUES
('360 Branding', 'Professional branding solutions for real estate agents', true, 4.8, 42),
('ActiveCampaign', 'Email marketing and automation platform', true, 4.7, 38),
('Agent Fire', 'Real estate website and lead generation platform', true, 4.6, 35),
('Buffini & Co.', 'Real estate coaching and training programs', true, 4.9, 67),
('Cinc', 'Real estate CRM and lead management system', true, 4.5, 29),
('Tom Ferry', 'Real estate coaching and business development', true, 4.8, 54)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_verified = EXCLUDED.is_verified,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count;

-- Update service vendor assignments to match service names
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = '360 Branding') WHERE title = '360 Branding';
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = 'ActiveCampaign') WHERE title = 'ActiveCampaign';
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = 'Agent Fire') WHERE title = 'Agent Fire';
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = 'Buffini & Co.') WHERE title = 'Buffini & Co.';
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = 'Cinc') WHERE title = 'Cinc';
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = 'Tom Ferry') WHERE title = 'Tom Ferry';