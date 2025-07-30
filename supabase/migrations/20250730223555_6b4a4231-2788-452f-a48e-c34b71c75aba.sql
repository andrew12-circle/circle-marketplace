-- Restore deleted vendors from audit log
INSERT INTO vendors (id, name, description, logo_url, website_url, contact_email, phone, location, service_states, mls_areas, vendor_type, license_states, service_zip_codes, individual_name, individual_title, individual_phone, individual_email, individual_license_number, nmls_id, rating, review_count, is_verified, campaigns_funded, co_marketing_agents, is_active, service_radius_miles, latitude, longitude, parent_vendor_id, created_at, updated_at)
VALUES 
-- Digital Marketing Pro
('626e046e-2cc6-40bd-960b-12538ddd2ea7', 'Digital Marketing Pro', 'Expert digital marketing solutions for real estate agents', NULL, 'https://digitalmarketingpro.com', 'hello@digitalmarketingpro.com', NULL, 'Nashville, TN', NULL, NULL, 'company', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4.8, 124, true, 88, 45, true, NULL, NULL, NULL, NULL, '2025-07-29T01:44:26.655619+00:00', '2025-07-29T23:56:50.44513+00:00'),

-- Real Geeks (PrintCraft)
('6c97b132-4ecd-449b-bc99-58c9dd11081e', 'Real Geeks', 'Professional print marketing materials and campaigns', NULL, 'https://printcraft.com', 'info@printcraft.com', NULL, 'Franklin, TN', NULL, NULL, 'company', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4.9, 95, true, 60, 30, true, NULL, NULL, NULL, NULL, '2025-07-29T01:44:26.655619+00:00', '2025-07-30T16:32:41.690318+00:00'),

-- Cinc
('27b7292c-83dd-4c48-b7c7-49c657360ffc', 'Cinc', 'Real estate CRM and lead management system', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'company', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4.5, 29, true, 0, 0, true, NULL, NULL, NULL, NULL, '2025-07-30T16:34:14.527377+00:00', '2025-07-30T16:34:14.527377+00:00'),

-- Tom Ferry
('ff2277a8-30e4-4a0f-b874-10950b66cd22', 'Tom Ferry', 'Real estate coaching and business development', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'company', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4.8, 54, true, 0, 0, true, NULL, NULL, NULL, NULL, '2025-07-30T16:34:14.527377+00:00', '2025-07-30T16:34:14.527377+00:00'),

-- Buffini & Co.
('38b3291c-345e-4178-9046-680df7af9b87', 'Buffini & Co.', 'Real estate coaching and training programs', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'company', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4.9, 67, true, 0, 0, true, NULL, NULL, NULL, NULL, '2025-07-30T16:34:14.527377+00:00', '2025-07-30T16:34:14.527377+00:00'),

-- 360 Branding Solutions
('c5bdee67-59ed-49e3-b632-c77bb9ee39cf', '360 Branding Solutions', 'Professional branding solutions for real estate agents', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'company', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4.7, 33, true, 0, 0, true, NULL, NULL, NULL, NULL, '2025-07-30T16:34:14.527377+00:00', '2025-07-30T16:34:14.527377+00:00'),

-- Chime Technologies
('9b8c7a65-4321-9876-5432-1098765fedcb', 'Chime Technologies', 'Real estate technology solutions and lead generation', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'company', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4.6, 41, true, 0, 0, true, NULL, NULL, NULL, NULL, '2025-07-30T16:34:14.527377+00:00', '2025-07-30T16:34:14.527377+00:00'),

-- The Close
('1a2b3c4d-5e6f-7890-abcd-ef1234567890', 'The Close', 'Real estate marketing automation platform', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'company', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4.4, 22, true, 0, 0, true, NULL, NULL, NULL, NULL, '2025-07-30T16:34:14.527377+00:00', '2025-07-30T16:34:14.527377+00:00');

-- Now restore the services
INSERT INTO services (id, vendor_id, title, description, category, price, retail_price, pro_price, co_pay_price, duration, contribution_amount, requires_quote, estimated_roi, rating, image_url, tags, is_featured, is_top_pick, original_price, discount_percentage, created_at, updated_at)
VALUES
-- Digital Marketing Pro Services
(gen_random_uuid(), '626e046e-2cc6-40bd-960b-12538ddd2ea7', 'Facebook Ad Campaign Setup', 'Complete Facebook advertising campaign setup and optimization for real estate agents', 'Marketing', '$497', '$797', '$447', '$199', '2-3 weeks', '$149', false, 4.5, 4.8, 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop', ARRAY['facebook ads', 'marketing', 'lead generation'], true, true, '$797', '38%', now(), now()),

(gen_random_uuid(), '626e046e-2cc6-40bd-960b-12538ddd2ea7', 'Google Ads Management', 'Professional Google Ads campaign management for real estate professionals', 'Marketing', '$697', '$997', '$547', '$299', '1 month', '$199', false, 5.2, 4.9, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop', ARRAY['google ads', 'ppc', 'lead generation'], true, false, '$997', '30%', now(), now()),

-- Real Geeks Services  
(gen_random_uuid(), '6c97b132-4ecd-449b-bc99-58c9dd11081e', 'Professional Listing Flyers', 'High-quality printed listing flyers and marketing materials', 'Marketing', '$297', '$497', '$247', '$149', '1 week', '$89', false, 3.8, 4.7, 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop', ARRAY['print marketing', 'flyers', 'listings'], false, false, '$497', '40%', now(), now()),

(gen_random_uuid(), '6c97b132-4ecd-449b-bc99-58c9dd11081e', 'Direct Mail Campaign', 'Targeted direct mail campaigns for lead generation', 'Marketing', '$897', '$1297', '$747', '$399', '2-3 weeks', '$249', false, 4.2, 4.8, 'https://images.unsplash.com/photo-1596526131083-e8c25515c913?w=400&h=300&fit=crop', ARRAY['direct mail', 'lead generation', 'postcards'], true, false, '$1297', '31%', now(), now()),

-- Cinc Services
(gen_random_uuid(), '27b7292c-83dd-4c48-b7c7-49c657360ffc', 'CRM Setup & Training', 'Complete CRM setup and agent training program', 'Technology', '$597', '$897', '$497', '$297', '2 weeks', '$179', false, 6.5, 4.6, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop', ARRAY['crm', 'training', 'lead management'], true, true, '$897', '33%', now(), now()),

-- Tom Ferry Services
(gen_random_uuid(), 'ff2277a8-30e4-4a0f-b874-10950b66cd22', 'Business Coaching Program', 'Comprehensive business coaching for real estate professionals', 'Education', '$1997', '$2997', '$1697', '$997', '3 months', '$599', false, 8.5, 4.9, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', ARRAY['coaching', 'business development', 'training'], true, true, '$2997', '33%', now(), now()),

-- Buffini & Co Services
(gen_random_uuid(), '38b3291c-345e-4178-9046-680df7af9b87', 'Referral System Training', 'Learn the proven referral system for sustainable business growth', 'Education', '$497', '$797', '$397', '$247', '6 weeks', '$149', false, 7.2, 4.8, 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop', ARRAY['referrals', 'training', 'business systems'], false, true, '$797', '38%', now(), now()),

-- 360 Branding Solutions Services
(gen_random_uuid(), 'c5bdee67-59ed-49e3-b632-c77bb9ee39cf', 'Personal Brand Package', 'Complete personal branding package for real estate agents', 'Marketing', '$897', '$1297', '$747', '$447', '2-3 weeks', '$269', false, 5.5, 4.7, 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop', ARRAY['branding', 'design', 'marketing materials'], true, false, '$1297', '31%', now(), now()),

-- Chime Technologies Services
(gen_random_uuid(), '9b8c7a65-4321-9876-5432-1098765fedcb', 'Lead Generation Platform', 'Automated lead generation platform for real estate agents', 'Technology', '$397', '$597', '$297', '$197', 'Monthly', '$119', false, 6.8, 4.5, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', ARRAY['lead generation', 'automation', 'technology'], false, false, '$597', '33%', now(), now()),

-- The Close Services
(gen_random_uuid(), '1a2b3c4d-5e6f-7890-abcd-ef1234567890', 'Email Marketing Automation', 'Automated email marketing campaigns for nurturing leads', 'Marketing', '$297', '$497', '$247', '$147', '1-2 weeks', '$89', false, 4.8, 4.4, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop', ARRAY['email marketing', 'automation', 'nurturing'], false, false, '$497', '40%', now(), now());