-- Disable RLS on tables for anonymous access
-- Note: In production, you should enable RLS and create proper policies

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;

