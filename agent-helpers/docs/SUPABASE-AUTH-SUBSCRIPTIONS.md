# Supabase Auth & Subscriptions Setup

## Overview

This project uses:
- **Supabase Auth** - For authentication (alongside NextAuth)
- **Supabase Edge Functions** - For serverless functions (webhooks, image processing)
- **Stripe** - For payment processing
- **Supabase Realtime** - For live updates

## Supabase Auth Setup

### 1. Enable Auth Providers

In Supabase Dashboard → Authentication → Providers:

1. **Email/Password**: Enable (default)
2. **Magic Links**: Enable for passwordless login
3. **OAuth Providers**: Enable as needed:
   - Google
   - GitHub
   - Apple
   - etc.

### 2. Configure Auth Settings

**Settings → Authentication:**

- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: 
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/auth/callback` (for development)
- **Enable Email Confirmations**: Optional (recommended for production)
- **Enable Email Change Confirmations**: Yes

### 3. Environment Variables

Add to `.env`:

```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_AGENCY=price_...
```

## Stripe Setup

### 1. Create Products and Prices

In Stripe Dashboard:

1. **Create Products:**
   - Starter Plan - $19/month
   - Professional Plan - $49/month
   - Agency Plan - $199/month

2. **Create Prices** for each product (recurring monthly)

3. **Copy Price IDs** to environment variables

### 2. Set Up Webhooks

**Stripe Dashboard → Developers → Webhooks:**

1. **Add endpoint**: `https://your-domain.com/api/webhooks/stripe`
   - Or use Supabase Edge Function: `https://your-project.supabase.co/functions/v1/stripe-webhook`

2. **Select events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

3. **Copy webhook signing secret** to `STRIPE_WEBHOOK_SECRET`

### 3. Test Webhooks Locally

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Supabase Edge Functions

### Deployment

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login:**
   ```bash
   supabase login
   ```

3. **Link project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Deploy functions:**
   ```bash
   supabase functions deploy stripe-webhook
   supabase functions deploy process-image
   ```

### Environment Secrets

Set secrets for Edge Functions:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Update Stripe Webhook URL

After deploying Edge Function, update Stripe webhook URL to:
```
https://your-project.supabase.co/functions/v1/stripe-webhook
```

## Auth Flow

### Option 1: Supabase Auth Only

Use Supabase Auth for all authentication:

```typescript
import { signInWithPassword, signUpWithPassword } from "@/lib/auth/supabase";

// Sign in
await signInWithPassword(email, password);

// Sign up
await signUpWithPassword(email, password, { name: "John Doe" });
```

### Option 2: Hybrid (NextAuth + Supabase Auth)

Use NextAuth for session management, Supabase Auth for OAuth:

```typescript
// Use NextAuth for email/password
// Use Supabase Auth for OAuth providers
```

### Option 3: Sync Both

Sync Supabase Auth users to Prisma:

```typescript
import { syncUserToPrisma } from "@/lib/auth/supabase";

// After Supabase auth, sync to Prisma
await syncUserToPrisma(supabaseUserId);
```

## Subscription Management

### Creating a Subscription

```typescript
import { api } from "@/lib/trpc/react";

const { mutate: createCheckout } = api.subscription.createCheckout.useMutation();

createCheckout({
  plan: "PROFESSIONAL",
}, {
  onSuccess: (data) => {
    window.location.href = data.url; // Redirect to Stripe Checkout
  },
});
```

### Checking Credits

```typescript
const { data: credits } = api.subscription.getCredits.useQuery();

// Check if user has enough credits
const { data: check } = api.subscription.checkCredits.useQuery({
  required: 5,
});
```

### Deducting Credits

```typescript
const { mutate: deduct } = api.subscription.deductCredits.useMutation();

await deduct({
  amount: 5,
  description: "Generated 5 listing images",
  metadata: { projectId: "..." },
});
```

## Realtime Subscriptions

### Subscribe to Project Status

```typescript
import { subscribeToProjectStatus } from "@/lib/supabase/realtime";

const channel = subscribeToProjectStatus(projectId, (payload) => {
  console.log("Status:", payload.status);
  console.log("Progress:", payload.progress);
});

// Unsubscribe later
channel.unsubscribe();
```

### Subscribe to Generated Images

```typescript
import { subscribeToGeneratedImages } from "@/lib/supabase/realtime";

const channel = subscribeToGeneratedImages(projectId, (image) => {
  console.log("New image:", image.url);
  // Update UI with new image
});
```

## Database Functions

### Credit Balance Function

Create in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id TEXT)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM "CreditTransaction"
  WHERE "userId" = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Monthly Credit Allocation

Create a scheduled function to add monthly credits:

```sql
CREATE OR REPLACE FUNCTION allocate_monthly_subscription_credits()
RETURNS void AS $$
DECLARE
  subscription_record RECORD;
  credit_amount INTEGER;
BEGIN
  FOR subscription_record IN
    SELECT s.*, u.id as user_id
    FROM "Subscription" s
    JOIN "User" u ON s."userId" = u.id
    WHERE s.status = 'ACTIVE'
    AND s."currentPeriodStart" <= NOW()
    AND s."currentPeriodStart" > NOW() - INTERVAL '1 day'
  LOOP
    -- Determine credit amount based on plan
    CASE subscription_record.plan
      WHEN 'STARTER' THEN credit_amount := 10;
      WHEN 'PROFESSIONAL' THEN credit_amount := 50;
      WHEN 'AGENCY' THEN credit_amount := 999999;
      ELSE credit_amount := 0;
    END CASE;

    IF credit_amount > 0 THEN
      INSERT INTO "CreditTransaction" ("userId", amount, type, description)
      VALUES (
        subscription_record.user_id,
        credit_amount,
        'SUBSCRIPTION',
        'Monthly subscription credits for ' || subscription_record.plan || ' plan'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

Schedule with pg_cron (if enabled):

```sql
SELECT cron.schedule(
  'allocate-monthly-credits',
  '0 0 1 * *', -- First day of every month at midnight
  $$SELECT allocate_monthly_subscription_credits()$$
);
```

## Testing

### Test Auth

```typescript
// Test sign up
const { data } = await signUpWithPassword("test@example.com", "password123");
console.log("User:", data.user);

// Test sign in
const { data } = await signInWithPassword("test@example.com", "password123");
console.log("Session:", data.session);
```

### Test Subscriptions

1. Use Stripe test mode
2. Use test card: `4242 4242 4242 4242`
3. Check webhook events in Stripe Dashboard
4. Verify database updates

### Test Edge Functions Locally

```bash
supabase functions serve stripe-webhook --env-file .env.local
```

## Security Best Practices

1. **Never expose service role key** to client
2. **Use RLS policies** for all database tables
3. **Validate webhook signatures** in Edge Functions
4. **Use HTTPS** for all webhook endpoints
5. **Rate limit** API endpoints
6. **Validate user permissions** before credit operations
7. **Log all credit transactions** for audit trail

## Troubleshooting

### Auth Issues

- Check Supabase Auth logs in dashboard
- Verify redirect URLs are correct
- Check email templates if using email auth

### Webhook Issues

- Check Stripe webhook logs
- Verify webhook secret matches
- Test with Stripe CLI locally

### Credit Issues

- Check credit transactions in database
- Verify subscription status
- Check RLS policies allow credit operations

