# RLS Policy Verification Guide

This guide helps you verify that Row Level Security (RLS) policies and storage policies are correctly configured in your Supabase project.

## Quick Verification

### 1. Check RLS is Enabled on Tables

Run this SQL query in Supabase SQL Editor:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'Project',
    'ProjectImage',
    'GeneratedImage',
    'BrandKit',
    'APlusContent',
    'Subscription',
    'CreditTransaction',
    'ApiKey'
  )
ORDER BY tablename;
```

All tables should show `rls_enabled = true`.

### 2. Check RLS Policies Exist

Run this SQL query to see all policies:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'Project',
    'ProjectImage',
    'GeneratedImage',
    'BrandKit',
    'APlusContent',
    'Subscription',
    'CreditTransaction',
    'ApiKey'
  )
ORDER BY tablename, policyname;
```

Expected policies per table:
- **Project**: 4 policies (SELECT, INSERT, UPDATE, DELETE)
- **ProjectImage**: 1 policy (ALL operations)
- **GeneratedImage**: 1 policy (SELECT)
- **BrandKit**: 1 policy (ALL operations)
- **APlusContent**: 1 policy (ALL operations)
- **Subscription**: 1 policy (SELECT)
- **CreditTransaction**: 1 policy (SELECT)
- **ApiKey**: 1 policy (ALL operations)

### 3. Check Storage Buckets

In Supabase Dashboard:
1. Go to **Storage** → **Buckets**
2. Verify these buckets exist:
   - `product-images` (public)
   - `generated-images` (public)
   - `brand-kits` (public)
   - `exports` (private)

### 4. Check Storage Policies

Run this SQL query:

```sql
SELECT 
  name as bucket_name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN (
  'product-images',
  'generated-images',
  'brand-kits',
  'exports'
)
ORDER BY name;
```

Then check storage policies:

```sql
SELECT 
  name as policy_name,
  bucket_id,
  definition,
  check_expression
FROM storage.policies
WHERE bucket_id IN (
  'product-images',
  'generated-images',
  'brand-kits',
  'exports'
)
ORDER BY bucket_id, name;
```

## Automated Verification Script

You can also use the verification script:

```bash
tsx scripts/verify-rls-policies.ts
```

**Note**: The script requires Supabase RPC functions to be set up. If they don't exist, use the manual SQL queries above.

## Troubleshooting

### RLS Not Enabled
If RLS is not enabled, run:

```sql
ALTER TABLE "TableName" ENABLE ROW LEVEL SECURITY;
```

### Missing Policies
If policies are missing, see `agent-helpers/docs/SUPABASE-SETUP.md` for the complete SQL to create all policies.

### Storage Bucket Missing
Create missing buckets in Supabase Dashboard or via SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bucket-name',
  'bucket-name',
  true, -- or false for private
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png'] -- adjust as needed
);
```

## Verification Checklist

- [ ] All tables have RLS enabled
- [ ] All tables have appropriate policies
- [ ] Storage buckets exist
- [ ] Storage buckets have correct visibility (public/private)
- [ ] Storage policies restrict access appropriately

