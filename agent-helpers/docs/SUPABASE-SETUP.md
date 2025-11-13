# Supabase Setup Guide

## Overview

This project uses Supabase for:
- **PostgreSQL Database** - Primary database with Prisma ORM
- **Storage** - File storage for images, exports, and assets
- **Realtime** - Live updates for project status and image generation
- **Row Level Security (RLS)** - Database-level security policies

## Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (from Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### Getting Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)
4. Navigate to **Settings** → **Database**
5. Copy:
   - **Connection string** → `DATABASE_URL` (use the URI format)
   - **Direct connection** → `DIRECT_URL` (for migrations)

## Storage Buckets Setup

Create the following storage buckets in Supabase:

1. Go to **Storage** in your Supabase dashboard
2. Create these buckets:

### 1. `product-images`
- **Public**: Yes (images need to be accessible)
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### 2. `generated-images`
- **Public**: Yes
- **File size limit**: 20 MB
- **Allowed MIME types**: `image/png`, `image/jpeg`

### 3. `brand-kits`
- **Public**: Yes
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/png`, `image/svg+xml`

### 4. `exports`
- **Public**: No (use signed URLs)
- **File size limit**: 100 MB
- **Allowed MIME types**: `application/zip`, `application/octet-stream`

## Row Level Security (RLS) Policies

### Enable RLS on Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GeneratedImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BrandKit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "APlusContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies

```sql
-- Project policies: Users can only access their own projects
CREATE POLICY "Users can view own projects"
  ON "Project" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own projects"
  ON "Project" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own projects"
  ON "Project" FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own projects"
  ON "Project" FOR DELETE
  USING (auth.uid()::text = "userId");

-- ProjectImage policies
CREATE POLICY "Users can manage own project images"
  ON "ProjectImage" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Project"
      WHERE "Project".id = "ProjectImage"."projectId"
      AND "Project"."userId" = auth.uid()::text
    )
  );

-- GeneratedImage policies
CREATE POLICY "Users can view own generated images"
  ON "GeneratedImage" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Project"
      WHERE "Project".id = "GeneratedImage"."projectId"
      AND "Project"."userId" = auth.uid()::text
    )
  );

-- BrandKit policies
CREATE POLICY "Users can manage own brand kits"
  ON "BrandKit" FOR ALL
  USING (auth.uid()::text = "userId");

-- APlusContent policies
CREATE POLICY "Users can manage own A+ content"
  ON "APlusContent" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Project"
      WHERE "Project".id = "APlusContent"."projectId"
      AND "Project"."userId" = auth.uid()::text
    )
  );

-- Subscription policies
CREATE POLICY "Users can view own subscriptions"
  ON "Subscription" FOR SELECT
  USING (auth.uid()::text = "userId");

-- CreditTransaction policies
CREATE POLICY "Users can view own credit transactions"
  ON "CreditTransaction" FOR SELECT
  USING (auth.uid()::text = "userId");

-- ApiKey policies
CREATE POLICY "Users can manage own API keys"
  ON "ApiKey" FOR ALL
  USING (auth.uid()::text = "userId");
```

### Storage RLS Policies

Go to **Storage** → **Policies** and create policies for each bucket:

#### product-images bucket
```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own images
CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

#### generated-images bucket
```sql
-- Similar policies as product-images
CREATE POLICY "Users can upload generated images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own generated images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'generated-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

#### brand-kits bucket
```sql
CREATE POLICY "Users can manage own brand kits"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'brand-kits' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

#### exports bucket
```sql
CREATE POLICY "Users can manage own exports"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Realtime Setup

Realtime is automatically enabled for tables with RLS. To enable Realtime for specific tables:

```sql
-- Enable Realtime for Project table
ALTER PUBLICATION supabase_realtime ADD TABLE "Project";

-- Enable Realtime for GeneratedImage table
ALTER PUBLICATION supabase_realtime ADD TABLE "GeneratedImage";

-- Enable Realtime for CreditTransaction table
ALTER PUBLICATION supabase_realtime ADD TABLE "CreditTransaction";
```

## Database Functions

### Credit Balance Function

Create a function to calculate user credit balance:

```sql
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id TEXT)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM "CreditTransaction"
  WHERE "userId" = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Usage

```sql
SELECT get_user_credit_balance('user-id-here');
```

## Testing Setup

1. **Test Storage Upload**:
   ```typescript
   import { uploadProductImage } from "@/lib/storage";
   
   const url = await uploadProductImage(userId, projectId, file, "test.jpg");
   ```

2. **Test Realtime**:
   ```typescript
   import { subscribeToProjectStatus } from "@/lib/supabase/realtime";
   
   const channel = subscribeToProjectStatus(projectId, (payload) => {
     console.log("Status changed:", payload);
   });
   
   // Later: channel.unsubscribe();
   ```

## Security Notes

1. **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Only use it server-side.
2. **RLS**: Always enable RLS on tables containing user data.
3. **Storage Policies**: Ensure storage policies match your RLS policies.
4. **Realtime**: Only enable Realtime on tables that need live updates.

## Migration from S3

If you were using S3 before, the new Supabase Storage functions are drop-in replacements:
- `uploadFile()` → `uploadProductImage()` / `uploadGeneratedImage()`
- Same return format (public URL)
- Automatic CDN via Supabase

