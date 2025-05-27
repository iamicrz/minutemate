-- Allow null roles in users table
ALTER TABLE users ALTER COLUMN role DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IS NULL OR role IN ('seeker', 'provider', 'admin')); 