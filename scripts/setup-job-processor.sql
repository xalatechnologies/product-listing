-- Setup pg_cron to process jobs every 10 seconds
-- Run this SQL in your Supabase SQL editor after creating the job_queue table

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Get your Supabase project URL and service role key from environment
-- Replace these placeholders with your actual values:
-- YOUR_PROJECT_URL: https://your-project.supabase.co
-- YOUR_SERVICE_ROLE_KEY: your-service-role-key

-- Schedule job processor to run every 10 seconds
SELECT cron.schedule(
  'process-job-queue',
  '*/10 * * * * *', -- Every 10 seconds (cron format: second minute hour day month weekday)
  $$
  SELECT net.http_post(
    url := 'YOUR_PROJECT_URL/functions/v1/process-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- To check if the schedule is active:
-- SELECT * FROM cron.job WHERE jobname = 'process-job-queue';

-- To unschedule (if needed):
-- SELECT cron.unschedule('process-job-queue');

-- Note: For local development, you can also trigger manually:
-- SELECT net.http_post(
--   url := 'http://localhost:54321/functions/v1/process-jobs',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--   )
-- );

