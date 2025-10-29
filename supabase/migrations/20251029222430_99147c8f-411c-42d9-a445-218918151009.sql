-- Update luxury playbook to use new image filename
UPDATE playbooks 
SET cover_url = '/images/luxury-mansion-evening.jpg', 
    updated_at = now()
WHERE id = 'db0d52f1-d4ca-447b-8bfb-3bbff2f612aa';