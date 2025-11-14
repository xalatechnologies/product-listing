# Deployment Guide

This guide covers the deployment process for the AI Product Listing & A+ Content Generator application.

## Pre-Deployment Checklist

Before deploying, ensure the following:

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] No TypeScript errors
- [ ] All environment variables documented

### Database
- [ ] Database migrations are tested locally
- [ ] Prisma schema is up to date
- [ ] Migration files are committed

### Configuration
- [ ] All required environment variables are documented
- [ ] `.env.example` is up to date
- [ ] `vercel.json` is configured correctly
- [ ] `next.config.ts` is optimized for production

### Security
- [ ] Security headers are configured (in `next.config.ts`)
- [ ] Rate limiting is implemented
- [ ] Input validation is in place
- [ ] File upload limits are set

---

## Production Environment Setup

### 1. Supabase Production Project

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note the project URL and keys

2. **Configure Database:**
   - Copy `DATABASE_URL` (connection pooler)
   - Copy `DIRECT_URL` (direct connection)
   - These will be used in Vercel environment variables

3. **Set Up Storage Buckets:**
   - Create `product-images` bucket (public)
   - Create `generated-images` bucket (public)
   - Create `brand-kits` bucket (public)
   - Create `exports` bucket (private)
   - Configure bucket policies (see Supabase setup docs)

4. **Enable Realtime:**
   - Enable Realtime for `Project` table
   - Enable Realtime for `GeneratedImage` table
   - Enable Realtime for `CreditTransaction` table

5. **Configure RLS Policies:**
   - Enable RLS on all tables
   - Create policies for user data isolation
   - Test policies in Supabase SQL Editor

### 2. Stripe Production Account

1. **Create Stripe Account:**
   - Go to [stripe.com](https://stripe.com)
   - Create production account (or use existing)
   - Switch to production mode

2. **Create Products and Prices:**
   - Create "Starter Plan" product
   - Create recurring monthly price ($29/month)
   - Copy price ID to `STRIPE_PRICE_STARTER`
   - Repeat for Professional ($79/month) and Agency ($299/month)

3. **Set Up Webhook:**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

4. **Get API Keys:**
   - Copy secret key to `STRIPE_SECRET_KEY`
   - Copy publishable key to `STRIPE_PUBLISHABLE_KEY`

### 3. AI Services Configuration

1. **OpenAI:**
   - Get API key from [platform.openai.com](https://platform.openai.com)
   - Set `OPENAI_API_KEY` in environment variables

2. **Remove.bg (Optional):**
   - Get API key from [remove.bg](https://remove.bg)
   - Set `REMOVEBG_API_KEY` in environment variables

3. **Inngest:**
   - Create project at [inngest.com](https://inngest.com)
   - Get event key and signing key
   - Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

---

## Vercel Deployment

### Step 1: Connect Repository

1. Push code to GitHub (if not already)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Select the repository

### Step 2: Configure Project Settings

1. **Project Name:** Set your project name
2. **Framework Preset:** Next.js (auto-detected)
3. **Root Directory:** `./` (default)
4. **Build Command:** `npm run build` (default)
5. **Output Directory:** `.next` (default)
6. **Install Command:** `npm install` (default)

### Step 3: Configure Environment Variables

Add all required environment variables in Vercel Dashboard:

#### Database
- `DATABASE_URL` - Supabase connection pooler URL
- `DIRECT_URL` - Supabase direct connection URL

#### Authentication
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Production URL (e.g., `https://your-domain.com`)

#### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

#### Stripe
- `STRIPE_SECRET_KEY` - Stripe secret key (`sk_live_...`)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (`pk_live_...`)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (`whsec_...`)
- `STRIPE_PRICE_STARTER` - Starter plan price ID
- `STRIPE_PRICE_PROFESSIONAL` - Professional plan price ID
- `STRIPE_PRICE_AGENCY` - Agency plan price ID

#### AI Services
- `OPENAI_API_KEY` - OpenAI API key
- `REMOVEBG_API_KEY` - Remove.bg API key (optional)

#### Inngest
- `INNGEST_EVENT_KEY` - Inngest event key
- `INNGEST_SIGNING_KEY` - Inngest signing key

#### Email
- `RESEND_API_KEY` - Resend API key
- `EMAIL_FROM` - Sender email address

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Check build logs for errors
4. Visit deployment URL to verify

### Step 5: Post-Deployment

1. **Run Database Migrations:**
```bash
# Pull production environment variables
npx vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

2. **Verify Deployment:**
   - Visit production URL
   - Test authentication flow
   - Test file upload
   - Test image generation (if credits available)
   - Test subscription checkout

3. **Update Stripe Webhook URL:**
   - Go to Stripe Dashboard → Webhooks
   - Update webhook URL to production domain
   - Test webhook with test event

---

## Database Migrations in Production

### Running Migrations

```bash
# Pull production environment variables
npx vercel env pull .env.production

# Deploy migrations
npx prisma migrate deploy

# Verify migrations
npx prisma studio
```

### Migration Best Practices

- Always test migrations locally first
- Use `prisma migrate deploy` (not `prisma migrate dev`) in production
- Never use `prisma db push` in production
- Review migration SQL before deploying
- Have a rollback plan

---

## Monitoring Setup

### Error Tracking (Sentry)

1. **Create Sentry Project:**
   - Go to [sentry.io](https://sentry.io)
   - Create new project (Next.js)
   - Get DSN

2. **Install Sentry:**
```bash
npm install @sentry/nextjs
```

3. **Configure Sentry:**
   - Add DSN to environment variables
   - Configure in `sentry.client.config.ts` and `sentry.server.config.ts`
   - Set up error boundaries

### Performance Monitoring

- Use Vercel Analytics (built-in)
- Set up custom performance tracking
- Monitor API response times
- Track image generation times

### Uptime Monitoring

- Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- Configure alerts for downtime
- Monitor critical endpoints

---

## Domain Configuration

### Custom Domain Setup

1. **Add Domain in Vercel:**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Configure DNS:**
   - Add CNAME record pointing to Vercel
   - Wait for DNS propagation (up to 48 hours)

3. **Update Environment Variables:**
   - Update `NEXTAUTH_URL` to custom domain
   - Update Stripe webhook URL to custom domain
   - Update any other domain references

4. **SSL Certificate:**
   - Vercel automatically provisions SSL certificates
   - Verify HTTPS is working

---

## Post-Deployment Verification

### Functional Tests

- [ ] Homepage loads correctly
- [ ] Authentication flow works
- [ ] User can create projects
- [ ] File upload works
- [ ] Image generation queues correctly
- [ ] A+ content generation works
- [ ] Export functionality works
- [ ] Subscription checkout works
- [ ] Webhooks are receiving events

### Performance Tests

- [ ] Page load times are acceptable
- [ ] API response times are fast
- [ ] Image upload is responsive
- [ ] Database queries are optimized

### Security Tests

- [ ] HTTPS is enforced
- [ ] Security headers are present
- [ ] Rate limiting is working
- [ ] File upload validation works
- [ ] Authentication is required for protected routes

---

## Troubleshooting

### Build Failures

- Check build logs in Vercel Dashboard
- Verify all environment variables are set
- Ensure `prisma generate` runs in build command
- Check for TypeScript errors

### Database Connection Issues

- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Check Supabase project is active
- Verify IP allowlist in Supabase (if enabled)
- Test connection with `npx prisma studio`

### Deployment Issues

- Check Vercel build logs
- Verify Node.js version compatibility
- Ensure all dependencies are in `package.json`
- Check for missing environment variables

---

## Rollback Procedure

If deployment fails:

1. **Revert Code:**
   - Revert to previous commit
   - Push to trigger new deployment

2. **Rollback Database:**
   - If migrations caused issues, manually rollback
   - Use `prisma migrate resolve --rolled-back <migration_name>`

3. **Restore Environment Variables:**
   - Check previous deployment's environment variables
   - Restore if needed

---

## Continuous Deployment

### GitHub Integration

- Vercel automatically deploys on push to main branch
- Preview deployments for pull requests
- Configure branch protection rules

### Deployment Workflow

1. Make changes in feature branch
2. Create pull request
3. Review and test preview deployment
4. Merge to main
5. Production deployment triggers automatically
6. Run post-deployment verification

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Supabase Production Guide](https://supabase.com/docs/guides/platform)

