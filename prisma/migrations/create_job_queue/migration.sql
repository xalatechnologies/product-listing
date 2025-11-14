-- Create job queue table for background job processing
-- This replaces Inngest with a Supabase-native solution

CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE
);

-- Indexes for efficient job processing
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(job_type);
CREATE INDEX IF NOT EXISTS idx_job_queue_user ON job_queue(user_id);

-- Enable pg_cron extension for scheduled job processing
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to get next pending job (for processing)
CREATE OR REPLACE FUNCTION get_next_job()
RETURNS TABLE (
  id UUID,
  job_type TEXT,
  payload JSONB,
  retry_count INT,
  max_retries INT,
  user_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jq.id,
    jq.job_type,
    jq.payload,
    jq.retry_count,
    jq.max_retries,
    jq.user_id
  FROM job_queue jq
  WHERE jq.status = 'pending'
  ORDER BY jq.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job as processing
CREATE OR REPLACE FUNCTION mark_job_processing(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE job_queue
  SET status = 'processing',
      processed_at = NOW()
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job as completed
CREATE OR REPLACE FUNCTION mark_job_completed(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE job_queue
  SET status = 'completed',
      completed_at = NOW()
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job as failed (with retry logic)
CREATE OR REPLACE FUNCTION mark_job_failed(job_id UUID, error_msg TEXT)
RETURNS void AS $$
DECLARE
  current_retry_count INT;
  max_retries_count INT;
BEGIN
  SELECT retry_count, max_retries INTO current_retry_count, max_retries_count
  FROM job_queue
  WHERE id = job_id;

  IF current_retry_count < max_retries_count THEN
    -- Retry: mark as pending again
    UPDATE job_queue
    SET status = 'pending',
        retry_count = current_retry_count + 1,
        error_message = error_msg,
        processed_at = NULL
    WHERE id = job_id;
  ELSE
    -- Max retries reached: mark as failed
    UPDATE job_queue
    SET status = 'failed',
        error_message = error_msg,
        completed_at = NOW()
    WHERE id = job_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

