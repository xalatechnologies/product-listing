# Developer Guide

This guide is for developers who want to contribute to or extend the ListingAI application.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Setup Process](#setup-process)
3. [Environment Variables](#environment-variables)
4. [Database Schema](#database-schema)
5. [Architecture Overview](#architecture-overview)
6. [Development Workflow](#development-workflow)
7. [Deployment Process](#deployment-process)

---

## Project Structure

```
product-listing/
├── agent-helpers/          # AI agent helper files
│   ├── docs/              # Documentation files
│   └── tasks/             # Task checklists
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Prisma schema definition
│   └── migrations/        # Database migration files
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # NextAuth routes
│   │   │   ├── inngest/    # Inngest webhook
│   │   │   ├── trpc/       # tRPC endpoint
│   │   │   ├── upload/     # File upload endpoint
│   │   │   └── webhooks/   # External webhooks (Stripe)
│   │   ├── auth/           # Auth pages (signin, signout, etc.)
│   │   ├── billing/        # Billing dashboard
│   │   ├── brand-kits/     # Brand kit management
│   │   ├── dashboard/      # Main dashboard
│   │   ├── pricing/        # Pricing page
│   │   └── projects/       # Project management pages
│   ├── components/         # React components
│   │   ├── landing/       # Landing page components
│   │   ├── theme/          # Theme provider and toast
│   │   └── ui/             # UI components
│   ├── hooks/              # React hooks
│   ├── lib/                # Core libraries and utilities
│   │   ├── ai/             # AI generation utilities
│   │   │   ├── generators/ # Image generators
│   │   │   ├── prompts/    # AI prompts
│   │   │   ├── templates/  # Template definitions
│   │   │   └── validation/ # Image validation
│   │   ├── api/            # tRPC API
│   │   │   ├── routers/    # tRPC routers
│   │   │   └── root.ts     # Root router
│   │   ├── aplus/          # A+ content generation
│   │   ├── auth/           # Authentication utilities
│   │   ├── export/         # Marketplace export utilities
│   │   ├── inngest/        # Inngest functions
│   │   ├── supabase/       # Supabase client utilities
│   │   ├── trpc/           # tRPC client setup
│   │   └── utils/           # Shared utilities
│   └── stories/            # Storybook stories
├── supabase/               # Supabase functions
├── .cursorrules            # Cursor IDE rules
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

---

## Setup Process

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Git

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd product-listing
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in all required environment variables (see [Environment Variables](#environment-variables))

### Step 4: Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy database connection strings to `.env`:
   - `DATABASE_URL` - Connection pooler URL
   - `DIRECT_URL` - Direct connection URL
3. Run migrations:

```bash
npx prisma migrate dev
```

4. Generate Prisma client:

```bash
npx prisma generate
```

### Step 5: Supabase Storage Setup

1. Create storage buckets in Supabase Dashboard:
   - `product-images` (public)
   - `generated-images` (public)
   - `brand-kits` (public)
   - `exports` (private)
2. Configure bucket policies (see Supabase setup docs)

### Step 6: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

### Required Variables

#### Database
- `DATABASE_URL` - PostgreSQL connection string (Supabase pooler)
- `DIRECT_URL` - Direct PostgreSQL connection (for migrations)

#### Authentication
- `NEXTAUTH_SECRET` - Secret for session encryption (generate: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL (`http://localhost:3000` for dev)

#### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)

#### Stripe (for billing)
- `STRIPE_SECRET_KEY` - Stripe secret key (`sk_...`)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (`pk_...`)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (`whsec_...`)
- `STRIPE_PRICE_STARTER` - Starter plan price ID
- `STRIPE_PRICE_PROFESSIONAL` - Professional plan price ID
- `STRIPE_PRICE_AGENCY` - Agency plan price ID

### Optional Variables

#### AI Services
- `OPENAI_API_KEY` - OpenAI API key (for image generation)
- `REMOVEBG_API_KEY` - Remove.bg API key (for background removal)

#### Inngest
- `INNGEST_EVENT_KEY` - Inngest event key
- `INNGEST_SIGNING_KEY` - Inngest signing key

#### Email
- `EMAIL_SERVER_PASSWORD` - Resend API key
- `EMAIL_FROM` - Sender email address

---

## Database Schema

### Key Models

#### User
- Stores user account information
- Linked to NextAuth sessions
- Has relationships: projects, brandKits, subscriptions, credits

#### Project
- Main project entity
- Contains: name, description, productName, status
- Relationships: productImages, generatedImages, aPlusContent, brandKit

#### ProjectImage
- User-uploaded product images
- Stores: url, dimensions, size, order

#### GeneratedImage
- AI-generated listing images
- Stores: type, style, url, dimensions, metadata

#### BrandKit
- Brand identity configuration
- Stores: logo, colors, fontFamily

#### APlusContent
- Amazon A+ content modules
- Stores: modules (JSON), isPremium flag

#### Subscription
- User subscription information
- Linked to Stripe subscriptions
- Tracks: plan, status, period dates

#### CreditTransaction
- Credit balance tracking
- Records: amount, type, description, metadata

### Relationships

- User → Projects (one-to-many)
- User → BrandKits (one-to-many)
- User → Subscriptions (one-to-many)
- User → CreditTransactions (one-to-many)
- Project → ProjectImages (one-to-many, cascade delete)
- Project → GeneratedImages (one-to-many, cascade delete)
- Project → APlusContent (one-to-one)
- Project → BrandKit (many-to-one)

### Indexes

- `Project.userId` - Fast user project queries
- `Project.status` - Status filtering
- `ProjectImage.projectId` - Fast image queries
- `GeneratedImage.projectId` - Fast generated image queries
- `GeneratedImage.type` - Type filtering
- `BrandKit.userId` - User brand kit queries
- `Subscription.userId` - User subscription queries
- `CreditTransaction.userId` - User credit queries
- `CreditTransaction.createdAt` - Transaction history sorting

---

## Architecture Overview

### Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL (via Prisma)
- **Storage:** Supabase Storage
- **API:** tRPC (type-safe APIs)
- **Auth:** NextAuth.js (database sessions)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Background Jobs:** Inngest
- **Payments:** Stripe

### API Architecture

#### tRPC Routers

All API logic is organized into routers:

- `project.router.ts` - Project CRUD operations
- `image.router.ts` - Image upload and generation
- `brandKit.router.ts` - Brand kit management
- `aPlus.router.ts` - A+ content generation
- `export.router.ts` - Marketplace exports
- `subscription.router.ts` - Billing and credits

#### Procedure Types

- `publicProcedure` - No authentication required
- `protectedProcedure` - Requires authentication, provides `ctx.session.user`

#### Error Handling

- All procedures use `TRPCError` with appropriate error codes
- Zod validation errors are automatically formatted
- Error messages are user-friendly

### File Upload Flow

1. Client uploads file to `/api/upload`
2. Server validates file (type, size)
3. File uploaded to Supabase Storage
4. Database record created via `image.upload` procedure
5. Client receives image URL and metadata

### Image Generation Flow

1. User triggers generation via `image.generate` procedure
2. Procedure queues Inngest job
3. Inngest function processes generation:
   - Removes background (if needed)
   - Generates image via AI
   - Validates image compliance
   - Uploads to Supabase Storage
   - Creates database record
4. Client polls for updates via Realtime or refetch

### A+ Content Generation Flow

1. User triggers generation via `aPlus.generate` procedure
2. Procedure analyzes product data using GPT-5
3. Generates module layouts based on analysis
4. Applies brand kit styling
5. Creates APlusContent record with modules
6. User can edit and export modules

---

## Development Workflow

### Code Style

- **Components:** Functional components only, use `"use client"` when needed
- **Naming:** PascalCase for components, camelCase for functions/variables
- **File Size:** Keep files under 200-300 lines, refactor when needed
- **Imports:** Sort: external → internal → sibling → styles

### Adding a New Feature

1. **Database Changes:**
   - Update `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name feature_name`
   - Run `npx prisma generate`

2. **API Changes:**
   - Add procedures to appropriate router in `src/lib/api/routers/`
   - Use Zod for input validation
   - Use `protectedProcedure` for authenticated endpoints
   - Verify user ownership for all operations

3. **Frontend Changes:**
   - Create components in `src/components/`
   - Create pages in `src/app/`
   - Use tRPC hooks: `api.router.procedure.useQuery()` or `useMutation()`
   - Add loading states and error handling

4. **Testing:**
   - Run `npm run build` to check for TypeScript errors
   - Run `npm run lint` to check code style
   - Test manually in development

### Common Patterns

#### Creating a New Router

```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const myRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    // Implementation
  }),
  
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // Implementation
    }),
});
```

#### Adding to Root Router

```typescript
// src/lib/api/root.ts
import { myRouter } from "./routers/my.router";

export const appRouter = createTRPCRouter({
  project: projectRouter,
  // ... other routers
  my: myRouter, // Add here
});
```

---

## Deployment Process

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Security headers configured
- [ ] Error tracking configured (Sentry, etc.)

### Vercel Deployment

1. **Connect Repository:**
   - Push code to GitHub
   - Import repository in Vercel

2. **Configure Environment Variables:**
   - Add all variables from `.env.example`
   - Set `NEXTAUTH_URL` to production domain
   - Set `DATABASE_URL` to production database

3. **Configure Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy:**
   - Vercel will automatically deploy on push
   - Or trigger manual deployment

5. **Post-Deployment:**
   - Run migrations: `npx prisma migrate deploy`
   - Configure Stripe webhook URL
   - Set up custom domain (optional)
   - Configure monitoring and alerts

### Database Migrations in Production

```bash
# Pull production environment variables
npx vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

### Monitoring

- **Error Tracking:** Set up Sentry or similar
- **Performance:** Use Vercel Analytics
- **Uptime:** Configure uptime monitoring
- **Alerts:** Set up alerts for errors and downtime

---

## Troubleshooting

### Build Errors

- **TypeScript Errors:** Run `npx prisma generate` to ensure Prisma types are up to date
- **Import Errors:** Check file paths and ensure all dependencies are installed
- **Environment Variables:** Verify all required variables are set

### Database Issues

- **Connection Errors:** Check `DATABASE_URL` and `DIRECT_URL`
- **Migration Errors:** Ensure database is accessible and migrations are in order
- **RLS Errors:** Verify RLS policies are configured in Supabase

### Development Issues

- **Hot Reload Not Working:** Restart dev server
- **Type Errors:** Run `npx prisma generate` and restart TypeScript server
- **Module Not Found:** Check import paths and ensure files exist

---

## Contributing

### Code Standards

- Follow TypeScript strict mode
- Use functional components
- Keep components small and focused
- Add proper error handling
- Include loading states
- Use TypeScript types, avoid `any`

### Commit Messages

Use semantic commit messages:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### Pull Request Process

1. Create feature branch
2. Make changes
3. Run `npm run build` and `npm run lint`
4. Test changes
5. Create pull request with description
6. Address review feedback

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)


