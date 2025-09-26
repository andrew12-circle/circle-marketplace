-- Seed data for lender marketplace demo with proper UUIDs
-- Insert CrossCountry Mortgage vendor org
INSERT INTO public.lender_vendor_org (id, name, type, nationwide, support_email, support_phone)
VALUES (
  gen_random_uuid(),
  'CrossCountry Mortgage',
  'lender',
  true,
  'support@ccmortgage.com',
  '+1-555-123-4567'
);

-- Get the vendor org ID for subsequent inserts
DO $$ 
DECLARE
    vendor_org_uuid uuid;
    admin_user_uuid uuid := gen_random_uuid();
    approver_user_uuid uuid := gen_random_uuid();
    test_agent_uuid uuid := gen_random_uuid();
    test_sku_uuid uuid := gen_random_uuid();
    test_request_uuid uuid := gen_random_uuid();
BEGIN
    -- Get the vendor org ID
    SELECT id INTO vendor_org_uuid FROM public.lender_vendor_org WHERE name = 'CrossCountry Mortgage';
    
    -- Insert admin and approver users for CrossCountry Mortgage
    INSERT INTO public.lender_vendor_user (vendor_org_id, user_id, role, is_active)
    VALUES 
      (vendor_org_uuid, admin_user_uuid, 'admin', true),
      (vendor_org_uuid, approver_user_uuid, 'approver', true);

    -- Insert vendor rules for CrossCountry Mortgage
    INSERT INTO public.lender_vendor_rule (
      vendor_org_id, 
      min_buyers_12mo, 
      min_units_12mo, 
      geo_scope, 
      states, 
      auto_approve_threshold,
      allow_counter_offer
    )
    VALUES (
      vendor_org_uuid,
      12,
      18,
      'national',
      ARRAY['TN', 'KY', 'AL', 'GA', 'NC', 'SC'],
      75.0,
      true
    );

    -- Insert vendor priorities
    INSERT INTO public.lender_vendor_priorities (vendor_org_id, tie_breaker, distance_km)
    VALUES (vendor_org_uuid, 'distance', 50);

    -- Insert three roster entries near Franklin, TN
    INSERT INTO public.lender_vendor_roster (
      vendor_org_id, 
      name, 
      email, 
      phone, 
      geo_point,
      states,
      is_active,
      review_count,
      review_avg
    )
    VALUES 
      (
        vendor_org_uuid,
        'Sarah Johnson',
        'sarah.johnson@ccmortgage.com',
        '+1-615-555-0101',
        ST_GeogFromText('POINT(-86.8689 35.9251)'), -- Franklin, TN
        ARRAY['TN', 'KY'],
        true,
        24,
        4.8
      ),
      (
        vendor_org_uuid,
        'Mike Thompson', 
        'mike.thompson@ccmortgage.com',
        '+1-615-555-0102',
        ST_GeogFromText('POINT(-86.8450 35.9100)'), -- Near Franklin
        ARRAY['TN', 'AL'],
        true,
        18,
        4.6
      ),
      (
        vendor_org_uuid,
        'Lisa Rodriguez',
        'lisa.rodriguez@ccmortgage.com', 
        '+1-615-555-0103',
        ST_GeogFromText('POINT(-86.8800 35.9400)'), -- Near Franklin
        ARRAY['TN', 'GA'],
        true,
        31,
        4.9
      );

    -- Create test agent and request
    INSERT INTO public.lender_request (
      id,
      agent_id,
      sku_id,
      requested_vendor_share,
      agent_latlon,
      status
    )
    VALUES (
      test_request_uuid,
      test_agent_uuid,
      test_sku_uuid,
      100.0,
      ST_GeogFromText('POINT(-86.8689 35.9251)'), -- Franklin, TN
      'searching'
    );

    -- Insert request snapshot
    INSERT INTO public.lender_request_snapshot (
      request_id,
      agent_stats_json,
      goals_json,
      geo_json
    )
    VALUES (
      test_request_uuid,
      '{"buyers_12mo": 14, "total_units": 22}',
      '{"description": "Looking to expand mortgage lending partnerships"}',
      '{"location": "Franklin, TN", "market": "Nashville Metro"}'
    );
    
    RAISE NOTICE 'Seed data created successfully with vendor org ID: %', vendor_org_uuid;
END $$;