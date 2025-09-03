-- Add email notifications column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;