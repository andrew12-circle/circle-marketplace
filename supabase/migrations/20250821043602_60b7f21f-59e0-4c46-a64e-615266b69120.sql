-- Remove question 6 (Local Presence) from all existing vendor_questions
DELETE FROM vendor_questions WHERE question_number = 6;

-- Update the seed_vendor_questions function to exclude question 6
CREATE OR REPLACE FUNCTION seed_vendor_questions(p_vendor_id UUID)
RETURNS VOID AS $$
DECLARE
    question_texts TEXT[] := ARRAY[
        'Experience and Track Record',
        'Technology and Process',
        'Customer Support',
        'Performance Metrics',
        'Cost Structure',
        'Compliance and Legal',
        'Integration Process'
    ];
    i INTEGER;
BEGIN
    -- Insert the 7 default questions (removed Local Presence)
    FOR i IN 1..7 LOOP
        INSERT INTO vendor_questions (
            vendor_id,
            question_number,
            question_text,
            created_at,
            updated_at
        ) VALUES (
            p_vendor_id,
            i,
            question_texts[i],
            NOW(),
            NOW()
        ) ON CONFLICT (vendor_id, question_number) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;