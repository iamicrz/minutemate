-- Table for providers to block specific dates when unavailable
CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate blocked dates for same professional
  UNIQUE(professional_id, blocked_date)
);

-- Index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_blocked_dates_professional_date 
ON blocked_dates(professional_id, blocked_date);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date 
ON blocked_dates(blocked_date);
