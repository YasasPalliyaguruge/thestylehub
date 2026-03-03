-- Migration: Add active column to admin_users table
-- This fixes a bug where the auth code queries for active=true but the column didn't exist

-- Add active column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'active'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN active BOOLEAN DEFAULT true;
    -- Set all existing admins to active
    UPDATE admin_users SET active = true WHERE active IS NULL;
  END IF;
END $$;
