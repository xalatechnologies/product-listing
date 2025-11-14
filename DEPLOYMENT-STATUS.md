# Deployment Status - Supabase Job Queue

## ✅ Completed Steps

### 1. Database Migration ✅
- **Status:** COMPLETE
- **Table Created:** `job_queue`
- **Functions Created:**
  - `get_next_job()`
  - `mark_job_processing()`
  - `mark_job_completed()`
  - `mark_job_failed()`
- **Indexes Created:** All indexes for efficient querying
- **pg_cron Extension:** Enabled

### 2. Edge Function Deployment ✅
- **Status:** COMPLETE
- **Function Name:** `process-jobs`
- **Version:** 2
- **Status:** ACTIVE
- **URL:** `https://smifwqcvetmtrnmsicxr.supabase.co/functions/v1/process-jobs`

## ⚠️ Remaining Steps

### 3. Set Up pg_cron Schedule ⚠️ REQUIRED

**You need to run this SQL in Supabase Dashboard → SQL Editor:**

```sql
-- Get your service role key from: Settings → API → service_role key
-- Replace YOUR_SERVICE_ROLE_KEY below with your actual service role key

SELECT cron.schedule(
  'process-job-queue',
  '*/10 * * * * *', -- Every 10 seconds
  $$
  SELECT net.http_post(
    url := 'https://smifwqcvetmtrnmsicxr.supabase.co/functions/v1/process-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**To get your service role key:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy the `service_role` key (keep it secret!)

**Verify cron job is scheduled:**
```sql
SELECT * FROM cron.job WHERE jobname = 'process-job-queue';
```

### 4. Set Environment Variables ⚠️ REQUIRED

**In your deployment platform (Vercel/Netlify/etc.) or `.env` file:**

```env
# Required
DATABASE_URL=your-database-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app  # or your production URL
NEXT_PUBLIC_SUPABASE_URL=https://smifwqcvetmtrnmsicxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# For AI generation (if not already set)
OPENAI_API_KEY=your-openai-key
REMOVEBG_API_KEY=your-removebg-key
```

**For Edge Function:**
- Go to Supabase Dashboard → Edge Functions → process-jobs
- Add environment variable: `NEXT_PUBLIC_APP_URL` = your production app URL

### 5. Verify Deployment ✅

**Test the Edge Function:**
```bash
curl -X POST https://smifwqcvetmtrnmsicxr.supabase.co/functions/v1/process-jobs \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

Should return: `{"message":"No jobs to process"}`

**Test job creation:**
1. Create a project in your app
2. Upload a product image
3. Click "Generate Complete Pack"
4. Check `job_queue` table in Supabase
5. Wait 10-30 seconds
6. Check Edge Function logs for processing

## 📊 Current Status

- ✅ Database migration: COMPLETE
- ✅ Edge Function: DEPLOYED
- ⚠️ pg_cron schedule: NEEDS SETUP (requires service role key)
- ⚠️ Environment variables: NEEDS SETUP
- ⚠️ Testing: PENDING

## 🎯 Next Actions

1. **Set up pg_cron** (5 minutes)
   - Get service role key from Supabase Dashboard
   - Run the SQL above in SQL Editor

2. **Set environment variables** (2 minutes)
   - Add to your deployment platform
   - Add to Edge Function settings

3. **Test the system** (5 minutes)
   - Create a test project
   - Generate images
   - Verify jobs are processed

## 🔍 Verification Queries

**Check job_queue table:**
```sql
SELECT * FROM job_queue ORDER BY created_at DESC LIMIT 10;
```

**Check cron job:**
```sql
SELECT * FROM cron.job WHERE jobname = 'process-job-queue';
```

**Check cron job runs:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-job-queue')
ORDER BY start_time DESC 
LIMIT 10;
```

## 📝 Notes

- The Edge Function is deployed and active
- The database migration is complete
- You just need to set up pg_cron and environment variables
- Once pg_cron is set up, jobs will process automatically every 10 seconds

