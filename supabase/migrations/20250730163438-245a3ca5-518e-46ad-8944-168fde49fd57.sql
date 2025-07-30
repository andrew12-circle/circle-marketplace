-- Update service vendor assignments to match service names
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = '360 Branding') WHERE title = '360 Branding';
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = 'ActiveCampaign') WHERE title = 'ActiveCampaign';
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = 'Agent Fire') WHERE title = 'Agent Fire';
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = 'Buffini & Co.') WHERE title = 'Buffini & Co.';
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = 'Cinc') WHERE title = 'Cinc';
UPDATE services SET vendor_id = (SELECT id FROM vendors WHERE name = 'Tom Ferry') WHERE title = 'Tom Ferry';