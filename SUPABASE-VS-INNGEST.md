# Using Supabase Instead of Inngest

## Yes, You Can Use Supabase! ✅

Supabase offers several options for background job processing:

1. **Supabase Queues** (New - Postgres-native message queue)
2. **Supabase Edge Functions** (HTTP-triggered background tasks)
3. **Database Triggers + pg_cron** (Scheduled tasks)
4. **Supabase Realtime** (Already using for status updates)

## Option 1: Supabase Queues (Recommended)

Supabase Queues is a **Postgres-native durable message queue** that's perfect for background jobs.

### How It Works

```typescript
// 1. Create a job queue table
CREATE TABLE job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

// 2. Insert job into queue
INSERT INTO job_queue (job_type, payload)
VALUES ('generate-images', '{"projectId": "...", "userId": "..."}');

// 3. Edge Function processes jobs
// supabase/functions/process-jobs/index.ts
```

### Implementation

**Step 1: Create Job Queue Table**

```sql
-- Migration: create_job_queue.sql
CREATE TABLE job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_job_queue_status ON job_queue(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_job_queue_type ON job_queue(job_type);
```

**Step 2: Create Edge Function to Process Jobs**

```typescript
// supabase/functions/process-jobs/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get next pending job
  const { data: job, error } = await supabase
    .from("job_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!job) {
    return new Response(JSON.stringify({ message: "No jobs to process" }), {
      status: 200,
    });
  }

  // Mark as processing
  await supabase
    .from("job_queue")
    .update({ status: "processing", processed_at: new Date().toISOString() })
    .eq("id", job.id);

  try {
    // Process job based on type
    switch (job.job_type) {
      case "generate-images":
        await processImageGeneration(job.payload);
        break;
      case "generate-complete-pack":
        await processCompletePack(job.payload);
        break;
      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }

    // Mark as completed
    await supabase
      .from("job_queue")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", job.id);

    return new Response(JSON.stringify({ success: true, jobId: job.id }));
  } catch (error) {
    // Handle retries
    const retryCount = job.retry_count + 1;
    if (retryCount < job.max_retries) {
      await supabase
        .from("job_queue")
        .update({
          status: "pending",
          retry_count: retryCount,
          error_message: error.message,
        })
        .eq("id", job.id);
    } else {
      await supabase
        .from("job_queue")
        .update({
          status: "failed",
          error_message: error.message,
        })
        .eq("id", job.id);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});

async function processImageGeneration(payload: any) {
  // Your image generation logic here
  // Call your existing generators
}

async function processCompletePack(payload: any) {
  // Your complete pack generation logic here
}
```

**Step 3: Schedule Job Processing**

Use **pg_cron** to run the Edge Function every few seconds:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job processor to run every 10 seconds
SELECT cron.schedule(
  'process-job-queue',
  '*/10 * * * * *', -- Every 10 seconds
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/process-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
```

**Step 4: Update tRPC Router**

```typescript
// src/lib/api/routers/image.router.ts
generateCompletePack: protectedProcedure
  .input(z.object({
    projectId: z.string(),
    includeAPlus: z.boolean().default(false),
  }))
  .mutation(async ({ ctx, input }) => {
    // ... credit checks ...

    // Insert job into queue instead of Inngest
    const { data: job, error } = await ctx.db.$executeRaw`
      INSERT INTO job_queue (job_type, payload)
      VALUES ('generate-complete-pack', ${JSON.stringify({
        projectId: input.projectId,
        userId: ctx.session.user.id,
        includeAPlus: input.includeAPlus,
      })})
      RETURNING id
    `;

    return {
      jobId: job.id,
      status: "queued",
      message: "Job queued successfully",
    };
  }),
```

## Option 2: Direct Edge Function Calls

Simpler approach - call Edge Functions directly:

```typescript
// src/lib/api/routers/image.router.ts
generateCompletePack: protectedProcedure
  .mutation(async ({ ctx, input }) => {
    // ... credit checks ...

    // Call Supabase Edge Function directly
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-complete-pack`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          projectId: input.projectId,
          userId: ctx.session.user.id,
          includeAPlus: input.includeAPlus,
        }),
      }
    );

    // Edge function processes in background
    // Returns immediately with job ID
    const result = await response.json();
    return result;
  }),
```

## Comparison: Supabase vs Inngest

| Feature | Supabase Queues | Inngest |
|---------|----------------|---------|
| **Cost** | ✅ Free (included with Supabase) | ⚠️ Free tier: 25k/month, then $20/month |
| **Setup Complexity** | ⚠️ Medium (need queue table + Edge Function + pg_cron) | ✅ Low (just install and configure) |
| **Retry Logic** | ⚠️ Manual (need to implement) | ✅ Built-in (automatic) |
| **Observability** | ⚠️ Basic (database queries) | ✅ Excellent (dashboard, logs) |
| **Scheduling** | ✅ pg_cron (built-in) | ✅ Built-in scheduler |
| **Long-running Jobs** | ⚠️ Limited (Edge Function timeout ~60s) | ✅ Unlimited |
| **Error Handling** | ⚠️ Manual | ✅ Built-in |
| **Status Tracking** | ✅ Via database + Realtime | ✅ Built-in |
| **Integration** | ✅ Already using Supabase | ⚠️ Another service |

## Recommendation

### Use Supabase If:
- ✅ You want to keep everything in one platform
- ✅ You're already using Supabase (which you are)
- ✅ You want to avoid another service dependency
- ✅ Cost is a concern (free vs $20/month)
- ✅ Your jobs complete in < 60 seconds

### Use Inngest If:
- ✅ You need jobs that run longer than 60 seconds
- ✅ You want built-in retry logic and observability
- ✅ You want less code to maintain
- ✅ You need advanced scheduling features

## Migration Path

**Option A: Replace Inngest with Supabase Queues**

1. Create `job_queue` table
2. Create Edge Function `process-jobs`
3. Set up pg_cron schedule
4. Update tRPC routers to insert jobs instead of calling Inngest
5. Remove Inngest dependency

**Option B: Hybrid Approach**

- Use Supabase Queues for simple, fast jobs (< 60s)
- Use Inngest for complex, long-running jobs (> 60s)

**Option C: Keep Inngest**

- It's already working
- Free tier is sufficient for your use case
- Less code to maintain

## My Recommendation

**For your use case (image generation):**

1. **Image generation takes 30-60 seconds per image** - Edge Functions can handle this ✅
2. **Complete pack takes 5-10 minutes** - This might exceed Edge Function timeout ⚠️
3. **You're already using Supabase** - One less service to manage ✅
4. **Cost matters** - Supabase is free ✅

**Best approach: Use Supabase Queues with chunked processing**

Process images one at a time, updating status after each:
- Image 1 → Update status → Image 2 → Update status → etc.
- Each step completes in < 60 seconds
- Users see progress in real-time

Would you like me to implement the Supabase Queues solution?

