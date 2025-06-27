-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (clerk_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (clerk_id::text = auth.uid()::text);

-- Professional profiles table policies
CREATE POLICY "Anyone can view verified professional profiles"
  ON professional_profiles FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Providers can view their own profile"
  ON professional_profiles FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id::text = auth.uid()::text
  ));

CREATE POLICY "Providers can update their own profile"
  ON professional_profiles FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- Bookings table policies
CREATE POLICY "Seekers can view their own bookings"
  ON bookings FOR SELECT
  USING (seeker_id IN (
    SELECT id FROM users WHERE clerk_id::text = auth.uid()::text
  ));

CREATE POLICY "Providers can view bookings made with them"
  ON bookings FOR SELECT
  USING (professional_id IN (
    SELECT pp.id FROM professional_profiles pp
    JOIN users u ON u.id = pp.user_id
    WHERE u.clerk_id::text = auth.uid()::text
  ));

CREATE POLICY "Seekers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (seeker_id IN (
    SELECT id FROM users WHERE clerk_id::text = auth.uid()::text
  ));

CREATE POLICY "Seekers can update their own bookings"
  ON bookings FOR UPDATE
  USING (seeker_id IN (
    SELECT id FROM users WHERE clerk_id::text = auth.uid()::text
  ));

-- Transactions table policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id::text = auth.uid()::text
  ));

-- Reviews table policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Seekers can create reviews for their sessions"
  ON reviews FOR INSERT
  WITH CHECK (seeker_id IN (
    SELECT id FROM users WHERE clerk_id::text = auth.uid()::text
  ));

-- Notifications table policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id::text = auth.uid()::text
  )); 