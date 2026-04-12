-- Migration: Add phone column to establishments
-- Description: Adds phone field for account profile

ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

COMMENT ON COLUMN establishments.phone IS 'Contact phone number for the establishment';
