# Quick Start: Supabase Job Queue System

## 🚀 5-Minute Setup

### Step 1: Database Migration (2 min)

**In Supabase Dashboard → SQL Editor:**

```sql
-- Copy and paste entire file:
-- prisma/migrations/create_job_queue/migration.sql
```

**Or verify it exists:**
```bash
npm run verify:job-queue
```

### Step 2: Deploy Edge Function (1 min)

```bash
supabase functions deploy process-jobs
```

**Or via Dashboard:**
1. Edge Functions → New Function
2. Name: `process-jobs`
3. Copy from `supabase/functions/process-jobs/index.ts`
4. Deploy

### Step 3: Set Up pg_cron (1 min)

**In Supabase Dashboard → SQL Editor:**

```sql
-- Edit scripts/setup-job-processor.sql
-- Replace YOUR_PROJECT_URL and YOUR_SERVICE_ROLE_KEY
-- Run the SQL
```

**Verify:**
```sql
SELECT * FROM cron.job WHERE jobname = 'process-job-queue';
```

### Step 4: Environment Variables (30 sec)

```env
DATABASE_URL=your-database-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Test (30 sec)

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run verify:job-queue
npm run test:integration
```

## ✅ Verification Checklist

- [ ] `job_queue` table exists
- [ ] Database functions exist
- [ ] Edge Function deployed
- [ ] pg_cron scheduled
- [ ] Environment variables set
- [ ] Verification script passes
- [ ] Tests pass

## 📊 Quick Commands

### Check Job Status
```typescript
import { getJob } from '@/lib/utils/jobQueue';
const job = await getJob('job-id');
console.log(job.status); // pending | processing | completed | failed
```

### Create a Job
```typescript
import { createJob } from '@/lib/utils/jobQueue';
const jobId = await createJob('generate-image', {
  projectId: 'project-id',
  imageType: 'MAIN_IMAGE',
}, userId);
```

### View Jobs in Database
```sql
-- All jobs
SELECT * FROM job_queue ORDER BY created_at DESC LIMIT 10;

-- Pending jobs
SELECT * FROM job_queue WHERE status = 'pending';

-- User's jobs
SELECT * FROM job_queue WHERE user_id = 'user-id';
```

### Monitor Jobs
```sql
-- Job statistics
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
FROM job_queue
GROUP BY status;
```

## 🎯 Usage Examples

### Generate Single Image
```typescript
const result = await api.image.generate.mutate({
  projectId: 'project-id',
  type: ImageType.MAIN_IMAGE,
});

// Job is queued, status tracked automatically
console.log(result.jobId);
```

### Generate Complete Pack
```typescript
const result = await api.image.generateCompletePack.mutate({
  projectId: 'project-id',
  includeAPlus: false,
});

// Returns jobId for tracking
console.log(result.jobId);
```

### Track Job Status (Frontend)
```tsx
import { JobStatus } from '@/components/JobStatus';

<JobStatus
  jobId={jobId}
  onComplete={() => {
    // Refresh data
  }}
  onError={(error) => {
    console.error(error);
  }}
/>
```

## 🐛 Troubleshooting

### Jobs Not Processing?

1. **Check pg_cron:**
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

### Jobs Failing?

1. Check `job_queue.error_message` column
2. Check Edge Function logs
3. Verify `NEXT_PUBLIC_APP_URL` is correct
4. Check API endpoint logs

### Frontend Not Showing Status?

1. Verify `jobId` is being set in mutation `onSuccess`
2. Check browser console for errors
3. Verify tRPC router includes `job` router
4. Check network tab for API calls

## 📚 Documentation

- `SETUP-CHECKLIST.md` - Detailed setup steps
- `TESTING-GUIDE.md` - Comprehensive testing guide
- `FRONTEND-JOB-TRACKING.md` - Frontend integration guide
- `SUPABASE-JOBS-COMPLETE.md` - Implementation summary

## 🎉 That's It!

Your job queue system is ready to process background AI generation jobs!

