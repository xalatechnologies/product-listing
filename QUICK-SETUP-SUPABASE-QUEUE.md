# Quick Setup: Supabase Job Queue

## 🚀 5-Minute Setup Guide

### Step 1: Run Database Migration (2 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `prisma/migrations/create_job_queue/migration.sql`
3. Click "Run"
4. Verify: Check Tables → `job_queue` table should exist

### Step 2: Deploy Edge Function (1 minute)

**Option A: Using Supabase CLI**
```bash
supabase functions deploy process-jobs
```

**Option B: Using Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Click "New Function"
3. Name: `process-jobs`
4. Copy contents from `supabase/functions/process-jobs/index.ts`
5. Click "Deploy"

### Step 3: Set Up pg_cron (1 minute)

1. Open Supabase Dashboard → SQL Editor
2. Open `scripts/setup-job-processor.sql`
3. Replace placeholders:
   - `YOUR_PROJECT_URL` → Your Supabase URL (e.g., `https://xxxxx.supabase.co`)
   - `YOUR_SERVICE_ROLE_KEY` → Your service role key (from Settings → API)
4. Run the SQL

### Step 4: Add Environment Variable (30 seconds)

Add to your `.env`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Or for production:
# NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 5: Test (30 seconds)

1. Start your dev server: `npm run dev`
2. Create a project and upload an image
3. Click "Generate Complete Pack"
4. Check Supabase Dashboard:
   - `job_queue` table → Should see new job
   - Edge Functions → Logs → Should see processing

## ✅ Verification Checklist

- [ ] `job_queue` table exists in Supabase
- [ ] `process-jobs` Edge Function is deployed
- [ ] pg_cron schedule is active (check: `SELECT * FROM cron.job;`)
- [ ] `NEXT_PUBLIC_APP_URL` is set in `.env`
- [ ] Jobs appear in `job_queue` when clicking "Generate"
- [ ] Edge Function logs show job processing
- [ ] Images are generated successfully

## 🔍 Troubleshooting

### Jobs Not Processing?

1. **Check pg_cron is running:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-job-queue';
   ```

2. **Check Edge Function logs:**
   - Supabase Dashboard → Edge Functions → process-jobs → Logs

3. **Test Edge Function manually:**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/process-jobs \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

4. **Check job_queue table:**
   ```sql
   SELECT * FROM job_queue ORDER BY created_at DESC LIMIT 10;
   ```

### Jobs Failing?

1. Check Edge Function logs for errors
2. Check `/api/process-image` endpoint logs
3. Verify `NEXT_PUBLIC_APP_URL` is correct
4. Check job_queue `error_message` column

### Edge Function Can't Reach Next.js API?

- For local dev: Use `http://localhost:3000` (must be accessible from Supabase)
- For production: Use your production URL
- Consider using a tunnel (ngrok) for local testing

## 📊 Monitoring Jobs

### View All Jobs
```sql
SELECT * FROM job_queue ORDER BY created_at DESC;
```

### View Pending Jobs
```sql
SELECT * FROM job_queue WHERE status = 'pending';
```

### View Failed Jobs
```sql
SELECT * FROM job_queue WHERE status = 'failed';
```

### View Job Statistics
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
FROM job_queue
GROUP BY status;
```

## 🎯 That's It!

Your Supabase job queue is now set up and ready to process background jobs!

