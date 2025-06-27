-- Create session settings table for provider booking preferences
CREATE TABLE IF NOT EXISTS session_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id TEXT NOT NULL REFERENCES professional_profiles(user_id) ON DELETE CASCADE,
    buffer_time_minutes INTEGER DEFAULT 15,
    max_advance_booking_days INTEGER DEFAULT 30,
    min_advance_booking_hours INTEGER DEFAULT 24,
    auto_accept_bookings BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(professional_id)
);

-- Insert default settings for existing professionals
INSERT INTO session_settings (professional_id) 
SELECT user_id FROM professional_profiles 
WHERE user_id NOT IN (SELECT professional_id FROM session_settings);
