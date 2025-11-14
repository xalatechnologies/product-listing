# Deployment Action Plan - Supabase Job Queue

## 🎯 Pre-Deployment Checklist

### ✅ Code Complete
- [x] All code implemented
- [x] Tests written
- [x] Documentation complete
- [x] Build passes
- [x] No linting errors

### ⚠️ Deployment Required

## 📋 Step-by-Step Deployment

### Step 1: Database Migration (5 minutes)

**In Supabase Dashboard:**

1. Go to **SQL Editor**
2. Open `prisma/migrations/create_job_queue/migration.sql`
3. Copy entire SQL content
4. Paste into SQL Editor
5. Click **Run**
6. Verify: Check Tables → `job_queue` should exist

**Verify:**
```sql
SELECT * FROM job_queue LIMIT 1;
SELECT * FROM pg_proc WHERE proname = 'get_next_job';
```

### Step 2: Deploy Edge Function (5 minutes)

**Option A: Using Supabase CLI**
```bash
supabase functions deploy process-jobs
```

**Option B: Using Dashboard**
1. Go to **Edge Functions** → **New Function**
2. Name: `process-jobs`
3. Copy contents from `supabase/functions/process-jobs/index.ts`
4. Set environment variables:
   - `NEXT_PUBLIC_APP_URL` = Your app URL (e.g., `https://your-app.vercel.app`)
5. Click **Deploy**

**Verify:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-jobs \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

Should return: `{"message":"No jobs to process"}`

### Step 3: Set Up pg_cron (5 minutes)

**In Supabase Dashboard → SQL Editor:**

1. Open `scripts/setup-job-processor.sql`
2. Replace placeholders:
   - `YOUR_PROJECT_URL` → Your Supabase URL (e.g., `https://xxxxx.supabase.co`)
   - `YOUR_SERVICE_ROLE_KEY` → Your service role key (Settings → API)
3. Run the SQL

**Verify:**
```sql
SELECT * FROM cron.job WHERE jobname = 'process-job-queue';
```

Should show 1 row with schedule `*/10 * * * * *`

### Step 4: Environment Variables (2 minutes)

**In your deployment platform (Vercel/Netlify/etc.):**

Add these environment variables:
```env
DATABASE_URL=your-database-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# For AI generation (if not already set)
OPENAI_API_KEY=your-openai-key
REMOVEBG_API_KEY=your-removebg-key
```

### Step 5: Deploy Application (5 minutes)

```bash
# If using Vercel
vercel --prod

# Or push to main branch (if auto-deploy is set up)
git push origin main
```

### Step 6: Verify Deployment (5 minutes)

**1. Check Database:**
```sql
SELECT COUNT(*) FROM job_queue;
```

**2. Check Edge Function:**
- Go to Supabase Dashboard → Edge Functions → process-jobs → Logs
- Should see recent invocations

**3. Check pg_cron:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-job-queue')
ORDER BY start_time DESC 
LIMIT 5;
```

**4. Test End-to-End:**
1. Create a project
2. Upload product image
3. Click "Generate Complete Pack"
4. Check `job_queue` table for new job
5. Wait 10-30 seconds
6. Check Edge Function logs for processing
7. Verify images are generated

## 🧪 Post-Deployment Testing

### Manual Test Checklist

- [ ] Create a project
- [ ] Upload product image
- [ ] Generate single image → Verify job created → Verify image generated
- [ ] Generate complete pack → Verify 6 jobs created → Verify all images generated
- [ ] Check job status in frontend → Verify status updates
- [ ] Test error handling → Verify retry logic works

### Automated Tests

```bash
# Run integration tests (requires running server)
npm run dev  # Terminal 1
npm run test:integration  # Terminal 2
```

## 📊 Monitoring

### Key Metrics to Watch

1. **Job Queue Status:**
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration
FROM job_queue
GROUP BY status;
```

2. **Failed Jobs:**
```sql
SELECT * FROM job_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

3. **Edge Function Logs:**
- Supabase Dashboard → Edge Functions → process-jobs → Logs
- Watch for errors or timeouts

4. **pg_cron Status:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-job-queue')
ORDER BY start_time DESC 
LIMIT 10;
```

## 🐛 Troubleshooting

### Jobs Not Processing?

1. **Check pg_cron is running:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-job-queue';
   ```

2. **Check Edge Function logs:**
   - Look for errors in Supabase Dashboard

3. **Test Edge Function manually:**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/process-jobs \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

4. **Check job_queue table:**
   ```sql
   SELECT * FROM job_queue WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5;
   ```

### Edge Function Errors?

1. **Check environment variables:**
   - `NEXT_PUBLIC_APP_URL` must be correct
   - `SUPABASE_SERVICE_ROLE_KEY` must be set

2. **Check Next.js API endpoints:**
   - Verify `/api/process-image` is accessible
   - Check Next.js logs for errors

3. **Check authorization:**
   - Edge Function must send `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` header

### Jobs Failing?

1. **Check error messages:**
   ```sql
   SELECT error_message, retry_count FROM job_queue WHERE status = 'failed';
   ```

2. **Check AI API keys:**
   - Verify `OPENAI_API_KEY` is set
   - Verify `REMOVEBG_API_KEY` is set

3. **Check project has images:**
   - Jobs fail if project has no product images

## ✅ Success Criteria

After deployment, you should see:

1. ✅ Jobs appear in `job_queue` when generating images
2. ✅ Edge Function processes jobs every 10 seconds
3. ✅ Images are generated successfully
4. ✅ Project status updates to COMPLETED
5. ✅ Frontend shows job status updates
6. ✅ No failed jobs (or failed jobs retry automatically)

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Edge Function logs
3. Check job_queue table for error messages
4. Verify all environment variables are set
5. Check Next.js API endpoint logs

## 🎉 Deployment Complete!

Once all steps are complete and verified, your Supabase job queue system is live and processing background jobs!

