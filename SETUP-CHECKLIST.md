# Supabase Job Queue Setup Checklist

## ✅ Completed

- [x] **Code Implementation**
  - [x] Job queue utilities (`src/lib/utils/jobQueue.ts`)
  - [x] API endpoints with secure authorization
  - [x] Edge Function (`supabase/functions/process-jobs/index.ts`)
  - [x] Database migration SQL (`prisma/migrations/create_job_queue/migration.sql`)
  - [x] Setup scripts (`scripts/setup-job-processor.sql`)

- [x] **Testing**
  - [x] Job queue integration tests
  - [x] AI generation integration tests (with real API calls)
  - [x] End-to-end integration tests
  - [x] Error handling tests
  - [x] Test utilities and helpers

- [x] **Documentation**
  - [x] Testing guide (`TESTING-GUIDE.md`)
  - [x] Implementation summary (`SUPABASE-JOBS-COMPLETE.md`)
  - [x] Verification script (`scripts/verify-job-queue-setup.ts`)

## 📋 To Do (Deployment Steps)

### Step 1: Run Database Migration ⚠️ REQUIRED

**In Supabase Dashboard → SQL Editor:**

1. Open `prisma/migrations/create_job_queue/migration.sql`
2. Copy the entire SQL content
3. Paste into Supabase SQL Editor
4. Click "Run"

**Or via Supabase CLI:**
```bash
supabase db push
```

**Verify:**
```bash
npm run verify:job-queue
```

### Step 2: Deploy Edge Function ⚠️ REQUIRED

```bash
supabase functions deploy process-jobs
```

**Or via Dashboard:**
1. Go to Supabase Dashboard → Edge Functions
2. Click "New Function"
3. Name: `process-jobs`
4. Copy contents from `supabase/functions/process-jobs/index.ts`
5. Set environment variables:
   - `SUPABASE_URL` (auto-set)
   - `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
   - `NEXT_PUBLIC_APP_URL` (your app URL)
6. Click "Deploy"

### Step 3: Set Up pg_cron ⚠️ REQUIRED

**In Supabase Dashboard → SQL Editor:**

1. Open `scripts/setup-job-processor.sql`
2. Replace placeholders:
   - `YOUR_PROJECT_URL` → Your Supabase URL (e.g., `https://xxxxx.supabase.co`)
   - `YOUR_SERVICE_ROLE_KEY` → Your service role key (from Settings → API)
3. Run the SQL

**Verify:**
```sql
SELECT * FROM cron.job WHERE jobname = 'process-job-queue';
```

### Step 4: Set Environment Variables ⚠️ REQUIRED

**In your `.env` file:**
```env
# Required
DATABASE_URL=your-database-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL

# Optional (for AI generation tests)
OPENAI_API_KEY=your-openai-key
REMOVEBG_API_KEY=your-removebg-key
```

### Step 5: Test the Setup ✅

**Run verification:**
```bash
npm run verify:job-queue
```

**Run tests:**
```bash
# Start Next.js server first
npm run dev

# In another terminal, run tests
npm run test:integration
```

## 🧪 Testing

### Quick Test

1. **Create a test job:**
   ```typescript
   import { createJob } from '@/lib/utils/jobQueue';
   
   const jobId = await createJob('generate-image', {
     projectId: 'your-project-id',
     imageType: 'MAIN_IMAGE',
   }, 'your-user-id');
   ```

2. **Check job status:**
   ```sql
   SELECT * FROM job_queue WHERE id = 'your-job-id';
   ```

3. **Manually trigger Edge Function:**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/process-jobs \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

### Full Integration Test

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run tests
npm run test:integration -- jobQueue.integration.test.ts
```

## 📊 Monitoring

### View Jobs
```sql
-- All jobs
SELECT * FROM job_queue ORDER BY created_at DESC LIMIT 10;

-- Pending jobs
SELECT * FROM job_queue WHERE status = 'pending';

-- Failed jobs
SELECT * FROM job_queue WHERE status = 'failed';

-- Job statistics
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
FROM job_queue
GROUP BY status;
```

### Check pg_cron Schedule
```sql
SELECT * FROM cron.job WHERE jobname = 'process-job-queue';
```

### Edge Function Logs
- Supabase Dashboard → Edge Functions → process-jobs → Logs

## 🐛 Troubleshooting

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
4. Check `job_queue.error_message` column

### Edge Function Can't Reach Next.js API?

- **Local dev:** Use `http://localhost:3000` (must be accessible from Supabase)
- **Production:** Use your production URL
- **Consider:** Using a tunnel (ngrok) for local testing

## ✅ Verification Checklist

- [ ] `job_queue` table exists (run migration)
- [ ] Database functions exist (`get_next_job`, `mark_job_processing`, etc.)
- [ ] Edge Function is deployed (`process-jobs`)
- [ ] pg_cron schedule is active
- [ ] Environment variables are set
- [ ] Verification script passes (`npm run verify:job-queue`)
- [ ] Tests pass (`npm run test:integration`)

## 🎯 Success Criteria

✅ Jobs are created when calling tRPC endpoints
✅ Jobs appear in `job_queue` table
✅ Edge Function processes jobs
✅ Images are generated successfully
✅ Project status updates correctly
✅ Failed jobs retry automatically

## 📚 Additional Resources

- `TESTING-GUIDE.md` - Comprehensive testing guide
- `SUPABASE-JOBS-COMPLETE.md` - Implementation summary
- `QUICK-SETUP-SUPABASE-QUEUE.md` - Quick setup guide
- `SUPABASE-MIGRATION-GUIDE.md` - Detailed migration guide

