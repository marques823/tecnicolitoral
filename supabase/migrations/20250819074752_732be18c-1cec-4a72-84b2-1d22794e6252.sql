-- Fix auth.users email_change column to handle NULL values properly
-- This addresses the "converting NULL to string is unsupported" error

-- Update any existing NULL email_change values to empty string
UPDATE auth.users 
SET email_change = '' 
WHERE email_change IS NULL;

-- Set a default value for the email_change column to prevent future NULL issues
ALTER TABLE auth.users 
ALTER COLUMN email_change SET DEFAULT '';

-- Update any other auth-related columns that might have similar issues
UPDATE auth.users 
SET email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, '')
WHERE email_change_token_new IS NULL 
   OR email_change_token_current IS NULL 
   OR phone_change IS NULL 
   OR phone_change_token IS NULL;