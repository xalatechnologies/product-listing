# Integration Tests Guide

This guide explains how to set up and run integration tests with real database connections.

## Prerequisites

1. **Database Setup**: You need a PostgreSQL database (via Supabase or local PostgreSQL)
2. **Environment Variables**: Set up your `.env` file with database connection:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"
   DIRECT_URL="postgresql://user:password@host:port/database"
   ```

## Setup Steps

### 1. Run Database Migrations

First, ensure your database schema is up to date:

```bash
npx prisma migrate dev
```

Or if you're using an existing database:

```bash
npx prisma db push
```

### 2. Seed Test Data

Create test users and sample data:

```bash
npm run seed:test
```

This will create:
- 3 test users with different subscription plans
- Test projects, brand kits, images, and exports
- Credit transactions

**Note**: Test users have IDs starting with `test-` to make cleanup easier.

### 3. Run Integration Tests

Run all integration tests:

```bash
npm run test:integration
```

Run in watch mode (for development):

```bash
npm run test:integration:watch
```

## Test Data

After seeding, you'll have:

### Test Users

- **test-user-1@example.com** (Starter Plan, 10 credits)
  - 2 projects (1 Draft, 1 Completed)
  - 2 brand kits
  - Project images

- **test-user-2@example.com** (Free Plan, 5 credits)
  - 1 project (Draft)

- **test-user-3@example.com** (Professional Plan, 48 credits)
  - 1 project (Completed)
  - Generated images
  - A+ content
  - Export history

### Test Projects

- Test Project 1 (User 1, Draft, with brand kit)
- Test Project 2 (User 1, Completed, with brand kit)
- Other User Project (User 2, Draft)
- Professional User Project (User 3, Completed, with images and A+ content)

## Cleanup

The integration test setup automatically cleans up test data after each test run. However, if you need to manually clean up:

```bash
# The seed script cleans up before seeding
npm run seed:test
```

Or manually delete test users:

```sql
-- Delete all test data (run in Supabase SQL Editor)
DELETE FROM "GeneratedImage" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "userId" LIKE 'test-%');
DELETE FROM "ProjectImage" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "userId" LIKE 'test-%');
DELETE FROM "APlusContent" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "userId" LIKE 'test-%');
DELETE FROM "Export" WHERE "userId" LIKE 'test-%';
DELETE FROM "Project" WHERE "userId" LIKE 'test-%';
DELETE FROM "BrandKit" WHERE "userId" LIKE 'test-%';
DELETE FROM "CreditTransaction" WHERE "userId" LIKE 'test-%';
DELETE FROM "Subscription" WHERE "userId" LIKE 'test-%';
DELETE FROM "ApiKey" WHERE "userId" LIKE 'test-%';
DELETE FROM "Account" WHERE "userId" LIKE 'test-%';
DELETE FROM "Session" WHERE "userId" LIKE 'test-%';
DELETE FROM "User" WHERE id LIKE 'test-%';
```

## Running Specific Tests

Run a specific integration test file:

```bash
npx vitest run --config vitest.integration.config.ts src/lib/api/routers/__tests__/project.integration.test.ts
```

## Troubleshooting

### Database Connection Errors

If you see "Tenant or user not found" or connection errors:

1. Check your `.env` file has correct `DATABASE_URL`
2. Verify your database is accessible
3. For Supabase: Make sure your project is active and not paused
4. Check network connectivity

### Migration Errors

If migrations fail:

```bash
# Reset database (WARNING: This deletes all data!)
npx prisma migrate reset

# Or push schema without migrations
npx prisma db push
```

### Test Failures

If tests fail:

1. Check that test data was seeded: `npm run seed:test`
2. Verify database connection works: Check `.env` file
3. Check that RLS policies allow test operations (if using Supabase)
4. Review test output for specific error messages

## Test Coverage

Integration tests cover:

- ✅ Project CRUD operations
- ✅ Image upload and management
- ✅ Brand kit management
- ✅ Authorization and user isolation
- ✅ Input validation
- ✅ Error handling

## Next Steps

After running integration tests successfully:

1. Review test output for any failures
2. Fix any issues found
3. Add more test cases as needed
4. Consider adding E2E tests for full user flows

