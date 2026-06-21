-- ============================================================
-- DISABLE RLS + GRANT FULL ACCESS TO ANON KEY
-- Run this in Supabase SQL Editor
-- ============================================================

-- Disable RLS on all tables
ALTER TABLE admins               DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations  DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_dates          DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop                 DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon role (used by the publishable/anon key)
GRANT ALL ON admins               TO anon;
GRANT ALL ON event_registrations  TO anon;
GRANT ALL ON event_dates          TO anon;
GRANT ALL ON shop                 TO anon;

-- Also grant to authenticated role (for logged-in users)
GRANT ALL ON admins               TO authenticated;
GRANT ALL ON event_registrations  TO authenticated;
GRANT ALL ON event_dates          TO authenticated;
GRANT ALL ON shop                 TO authenticated;
