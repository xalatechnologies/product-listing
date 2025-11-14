# Supabase Job Queue Migration Guide

## Overview

This guide explains how to migrate from Inngest to Supabase for background job processing.

## What Was Changed

1. ✅ Created `job_queue` table with migration SQL
2. ✅ Created Supabase Edge Function `process-jobs` to handle job processing
3. ✅ Created Next.js API endpoint `/api/process-image` for image generation
4. ✅ Updated `image.router.ts` to use Supabase queue instead of Inngest
5. ✅ Added tasks to `tasks.md`

## Setup Steps

### Step 1: Run Database Migration

Run the migration SQL in your Supabase SQL editor:

```sql
-- File: prisma/migrations/create_job_queue/migration.sql
-- This creates the job_queue table and helper functions
```

Or use Prisma:

```bash
# Add the migration to Prisma
npx prisma migrate dev --name create_job_queue
```

### Step 2: Deploy Edge Function

Deploy the `process-jobs` Edge Function to Supabase:

```bash
# Using Supabase CLI
supabase functions deploy process-jobs

# Or manually upload via Supabase Dashboard
# Dashboard > Edge Functions > New Function > Upload process-jobs/index.ts
```

### Step 3: Set Up pg_cron Schedule

Run the SQL in `scripts/setup-job-processor.sql` in your Supabase SQL editor.

**Important:** Replace placeholders:
- `YOUR_PROJECT_URL` → Your Supabase project URL
- `YOUR_SERVICE_ROLE_KEY` → Your Supabase service role key

### Step 4: Set Environment Variable

Add to your `.env`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For local dev
# Or your production URL: https://your-app.vercel.app
```

### Step 5: Test the System

1. Create a project and upload images
2. Click "Generate Complete Pack"
3. Check Supabase dashboard:
   - `job_queue` table should have a new row
   - Edge Function logs should show processing
   - Project status should update to PROCESSING → COMPLETED

## How It Works

### Flow Diagram

```
User clicks "Generate" 
  ↓
tRPC router inserts job into job_queue table
  ↓
pg_cron triggers Edge Function every 10 seconds
  ↓
Edge Function gets next pending job
  ↓
Edge Function calls /api/process-image
  ↓
API endpoint processes image generation
  ↓
Job marked as completed in job_queue
  ↓
Supabase Realtime updates UI (via Project status)
```

### Job Queue Table Structure

```sql
job_queue
├── id (UUID)
├── job_type (TEXT) - 'generate-image' or 'generate-complete-pack'
├── payload (JSONB) - Job data
├── status (TEXT) - 'pending', 'processing', 'completed', 'failed'
├── retry_count (INT)
├── max_retries (INT)
├── error_message (TEXT)
├── user_id (UUID)
├── created_at (TIMESTAMPTZ)
├── processed_at (TIMESTAMPTZ)
└── completed_at (TIMESTAMPTZ)
```

### Retry Logic

- Jobs automatically retry up to `max_retries` times
- Failed jobs are marked as 'failed' after max retries
- Retry count is incremented automatically

## Removing Inngest (Optional)

Once Supabase job queue is working, you can remove Inngest:

1. Remove `inngest` package:
   ```bash
   npm uninstall inngest
   ```

2. Delete Inngest files:
   - `inngest.config.ts`
   - `src/app/api/inngest/route.ts`
   - `src/lib/inngest/functions/` (all files)

3. Remove Inngest environment variables from `.env`

4. Update `tasks.md` to mark Inngest removal as complete

## Troubleshooting

### Jobs Not Processing

1. Check pg_cron is enabled: `SELECT * FROM cron.job;`
2. Check Edge Function logs in Supabase Dashboard
3. Verify `NEXT_PUBLIC_APP_URL` is set correctly
4. Test Edge Function manually via Supabase Dashboard

### Jobs Failing

1. Check Edge Function logs for errors
2. Check `/api/process-image` endpoint logs
3. Verify API endpoint is accessible from Edge Function
4. Check job_queue table for error messages

### Performance Issues

- Adjust pg_cron frequency (currently every 10 seconds)
- Process multiple jobs per run (modify Edge Function)
- Add more indexes if needed

## Benefits of Supabase Approach

✅ **Free** - Included with Supabase  
✅ **Integrated** - Uses existing Supabase infrastructure  
✅ **Simple** - No additional service to manage  
✅ **Reliable** - Postgres-backed, durable  
✅ **Observable** - Check jobs directly in database  

## Next Steps

- [ ] Run migration in production database
- [ ] Deploy Edge Function to production
- [ ] Set up pg_cron schedule in production
- [ ] Test end-to-end flow
- [ ] Monitor job processing performance
- [ ] Remove Inngest dependencies (optional)

