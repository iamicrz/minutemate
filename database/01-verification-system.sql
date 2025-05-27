-- =====================================================
-- VERIFICATION SYSTEM TABLES
-- Purpose: Handle professional verification workflow
-- =====================================================

-- Table to store verification requests from users wanting to become providers
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Professional information submitted for verification
  professional_title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  bio TEXT NOT NULL,
  credentials TEXT NOT NULL,
  experience TEXT NOT NULL,
  
  -- Verification status and review information
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback TEXT,
  
  -- Timestamps and reviewer tracking
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id)
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
