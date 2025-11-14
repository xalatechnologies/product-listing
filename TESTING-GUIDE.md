# Testing Guide for Supabase Job Queue Integration

## Overview

This guide covers the comprehensive test suite for the Supabase job queue integration and AI content generation system.

## Test Structure

### 1. Job Queue Integration Tests
**File:** `src/lib/api/routers/__tests__/jobQueue.integration.test.ts`

Tests the core job queue functionality:
- Job creation (generate-image, generate-complete-pack, generate-aplus)
- Job retrieval (by ID, status, user)
- Status updates (pending → processing → completed/failed)
- Retry logic (automatic retries on failure)
- Database functions (get_next_job, mark_job_processing, etc.)

**Run:** `npm run test:integration -- jobQueue.integration.test.ts`

### 2. AI Generation Integration Tests
**File:** `src/lib/api/routers/__tests__/aiGeneration.integration.test.ts`

Tests AI image and content generation with **real API calls**:
- Main image generation via job queue
- Infographic generation
- Complete pack generation (queues 6 image jobs)
- A+ content generation

**Requirements:**
- `OPENAI_API_KEY` environment variable
- `REMOVEBG_API_KEY` environment variable
- `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Running Next.js server (for API endpoints)

**Run:** `npm run test:integration -- aiGeneration.integration.test.ts`

**Note:** These tests are skipped if API keys are not available.

### 3. End-to-End Integration Tests
**File:** `src/lib/api/routers/__tests__/endToEnd.integration.test.ts`

Tests the complete flow from user action to AI generation:
- tRPC endpoint → Job queue → API endpoint → AI generation → Database update
- Credit deduction
- Error handling (invalid project, missing images, unauthorized)
- Complete pack generation flow

**Requirements:** Same as AI Generation tests

**Run:** `npm run test:integration -- endToEnd.integration.test.ts`

## Running Tests

### Prerequisites

1. **Environment Variables:**
   ```bash
   OPENAI_API_KEY=your-openai-key
   REMOVEBG_API_KEY=your-removebg-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DATABASE_URL=your-database-url
   ```

2. **Database Setup:**
   - Ensure the `job_queue` table exists (run migration)
   - Test database should be accessible

3. **Next.js Server:**
   - Start the dev server: `npm run dev`
   - Server should be running on `http://localhost:3000`

### Running All Integration Tests

```bash
npm run test:integration
```

### Running Specific Test Files

```bash
# Job queue tests only
npm run test:integration -- jobQueue.integration.test.ts

# AI generation tests only
npm run test:integration -- aiGeneration.integration.test.ts

# End-to-end tests only
npm run test:integration -- endToEnd.integration.test.ts
```

### Running Tests with Coverage

```bash
npm run test:coverage
```

## Test Utilities

### Job Queue Utilities
**File:** `src/lib/utils/jobQueue.ts`

Helper functions for testing:
- `createJob()` - Create a job in the queue
- `getJob()` - Get a job by ID
- `getPendingJobs()` - Get all pending jobs
- `getJobsByStatus()` - Get jobs by status
- `getUserJobs()` - Get jobs for a user
- `waitForJobCompletion()` - Wait for job to complete (for testing)
- `cleanupTestJobs()` - Clean up test jobs

### Test Setup Utilities
**File:** `tests/integration/setup.ts`

- `createTestUser()` - Create a test user
- `createTestProject()` - Create a test project
- `createTestBrandKit()` - Create a test brand kit

## Test Scenarios

### 1. Single Image Generation

```typescript
// Create job
const jobId = await createJob("generate-image", {
  projectId,
  imageType: ImageType.MAIN_IMAGE,
}, userId);

// Process job
const response = await fetch("/api/process-image", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${serviceRoleKey}`,
  },
  body: JSON.stringify({
    projectId,
    imageType: ImageType.MAIN_IMAGE,
    userId,
  }),
});

// Verify image generated
const images = await prisma.generatedImage.findMany({
  where: { projectId, type: ImageType.MAIN_IMAGE },
});
expect(images.length).toBeGreaterThan(0);
```

### 2. Complete Pack Generation

```typescript
// Create complete pack job
const jobId = await createJob("generate-complete-pack", {
  projectId,
  includeAPlus: false,
}, userId);

// Process job (queues 6 individual image jobs)
const response = await fetch("/api/process-complete-pack", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${serviceRoleKey}`,
  },
  body: JSON.stringify({
    projectId,
    includeAPlus: false,
    userId,
  }),
});

// Verify jobs queued
const pendingJobs = await getPendingJobs(10);
expect(pendingJobs.length).toBeGreaterThanOrEqual(6);
```

### 3. Error Handling

```typescript
// Test invalid project
const response = await fetch("/api/process-image", {
  method: "POST",
  body: JSON.stringify({
    projectId: "invalid-id",
    imageType: ImageType.MAIN_IMAGE,
    userId,
  }),
});
expect(response.status).toBe(404);

// Test unauthorized
const response = await fetch("/api/process-image", {
  method: "POST",
  headers: {
    Authorization: "Bearer invalid-key",
  },
});
expect(response.status).toBe(401);
```

## Troubleshooting

### Tests Fail with "No jobs to process"

- Ensure the `job_queue` table exists
- Check that jobs are being created correctly
- Verify database connection

### Tests Fail with "Unauthorized"

- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify the authorization header format: `Bearer ${key}`

### AI Generation Tests Timeout

- AI generation can take 30-120 seconds
- Increase test timeout: `it("...", async () => { ... }, 180000)`
- Check API keys are valid
- Verify OpenAI and RemoveBG services are accessible

### Tests Fail with "Project not found"

- Ensure test projects are created in `beforeEach`
- Check that `projectId` is correct
- Verify database cleanup isn't deleting test data prematurely

## Continuous Integration

For CI/CD pipelines:

1. Set up test database
2. Run migrations: `npx prisma migrate deploy`
3. Set environment variables
4. Start Next.js server in background
5. Run tests: `npm run test:integration`

Example GitHub Actions workflow:

```yaml
- name: Run Integration Tests
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    REMOVEBG_API_KEY: ${{ secrets.REMOVEBG_API_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    npm run dev &
    sleep 10
    npm run test:integration
```

## Best Practices

1. **Always clean up test data** - Use `afterEach` to clean up jobs and test data
2. **Use unique test data** - Generate unique emails/IDs to avoid conflicts
3. **Mock external services in unit tests** - Only use real APIs in integration tests
4. **Set appropriate timeouts** - AI generation can take time
5. **Test error cases** - Don't just test happy paths
6. **Verify database state** - Check that data is persisted correctly

## Next Steps

1. Add performance tests for job queue throughput
2. Add load tests for concurrent job processing
3. Add monitoring/alerting tests
4. Add tests for Edge Function deployment
5. Add tests for pg_cron scheduling

