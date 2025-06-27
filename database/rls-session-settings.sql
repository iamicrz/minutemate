-- Enable RLS on the session_settings table
ALTER TABLE session_settings ENABLE ROW LEVEL SECURITY;

-- Allow providers to select their own session settings
CREATE POLICY "Providers can view their own session settings"
  ON session_settings FOR SELECT
  USING (professional_id IN (
    SELECT clerk_id FROM users WHERE id::text = auth.uid()::text
  ));

-- Allow providers to update their own session settings
CREATE POLICY "Providers can update their own session settings"
  ON session_settings FOR UPDATE
  USING (professional_id IN (
    SELECT clerk_id FROM users WHERE id::text = auth.uid()::text
  ));

-- Allow providers to insert their own session settings
CREATE POLICY "Providers can insert their own session settings"
  ON session_settings FOR INSERT
  WITH CHECK (professional_id IN (
    SELECT clerk_id FROM users WHERE id::text = auth.uid()::text
  ));

-- Allow providers to delete their own session settings (if needed)
CREATE POLICY "Providers can delete their own session settings"
  ON session_settings FOR DELETE
  USING (professional_id IN (
    SELECT clerk_id FROM users WHERE id::text = auth.uid()::text
  ));
