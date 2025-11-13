# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 full-stack product listing application for Amazon sellers, designed to generate AI-powered product images, A+ content, and brand-consistent listings. The stack is optimized for AI coding assistants.

**Tech Stack:**
- Next.js 15 (App Router) with TypeScript
- Prisma ORM with PostgreSQL (Supabase)
- tRPC for type-safe APIs
- NextAuth.js for authentication
- Tailwind CSS for styling
- Inngest for background jobs
- Multiple AI providers (OpenAI GPT-5, Gemini, Perplexity)
- AWS S3 for file storage
- Storybook for component development

## Essential Commands

### Development
```bash
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production (runs prisma generate first)
npm start                # Start production server
npm run lint             # Lint src and app directories
```

### Database
```bash
npx prisma migrate dev   # Create and apply migrations (REQUIRED - never use db push)
npx prisma generate      # Generate Prisma Client
npx prisma studio        # Open Prisma Studio GUI
```

### Storybook
```bash
npm run storybook        # Start Storybook on port 6006
npm run build-storybook  # Build Storybook for production
```

### Testing Single Files
```bash
# Run specific test file (when tests exist)
npm test -- path/to/test.spec.ts
```

## Critical Coding Standards

### Component Architecture
- **ALWAYS** use functional components with `"use client"` directive when client-side features needed
- Server components by default in App Router
- Name components in PascalCase under `src/components/`
- Keep components small and focused
- Use TypeScript interfaces for all props

### UI & Styling
- **NEVER** use Radix UI or shadcn components - use Tailwind classes directly for all UI
- Use `lucide-react` for icons (PascalCase naming)
- Custom icons go in `src/components/icons`
- Use `react-toastify` for notifications: `toast.success()`, `toast.error()`, etc.
- Dark mode with Tailwind's `dark:` prefix
- Use Framer Motion for animations
- Extend brand tokens in `tailwind.config.ts`

### Database & Prisma
- Manage all DB logic with Prisma in `prisma/schema.prisma`
- Access database via `src/lib/db.ts` (exports `prisma` client)
- **NEVER** write raw SQL
- Database naming: snake_case tables → camelCase fields in Prisma
- **CRITICAL:** Always use `npx prisma migrate dev` - NEVER use `npx prisma db push`

### tRPC Architecture
- All routers live in `src/lib/api/routers/`
- Compose routers in `src/lib/api/root.ts`
- Use `publicProcedure` or `protectedProcedure` with Zod validation
- Access from React via `@/lib/trpc/react`
- **Existing routers:** `project`, `brandKit`, `image`, `subscription`, `aPlus`

### AI Integration
- **ALWAYS** use `generateChatCompletion` from `src/lib/aiClient.ts` for ALL AI calls
- **Prefer GPT-5 model** for all AI operations
- Available models: `GPT_5`, `O1`, `GPT_4O`, `GPT_4O_MINI`, `SONNET`, `GEMINI_PRO`, `GEMINI_FLASH`, `PERPLEXITY_SMALL`, `PERPLEXITY_LARGE`
- Use `parseJsonResponse()` to extract JSON from AI responses
- Use `generateGeminiWebResponse()` for web-grounded Gemini queries

### Inngest Background Jobs
- Configure in `inngest.config.ts`
- API route at `src/app/api/inngest/route.ts`
- **CRITICAL:** Use polling to update UI when Inngest events complete - NEVER rely on tRPC success response
- Define typed events in `AppEvents` type

### File Organization
- Next.js routes: kebab-case (e.g., `app/brand-kits/page.tsx`)
- Shared types: `src/lib/types.ts`
- Reusable utilities: `src/lib/utils.ts`
- Server-side utilities: `src/lib/trpc/server.ts` or `src/lib/supabase/server.ts`
- Sort imports: external → internal → sibling → styles

### TypeScript Standards
- Strict mode enabled - avoid `any` types
- Use optional chaining (`?.`)
- Prefer union types over enums
- Always define interfaces for component props

## Project Structure Deep Dive

### Database Schema (Prisma)
The application models a complete product listing system:
- **User & Auth:** `User`, `Account`, `Session`, `VerificationToken`, `Allowlist`
- **Products:** `Project` (main entity), `ProjectImage`, `GeneratedImage` (AI-generated)
- **Branding:** `BrandKit` (logos, colors, fonts)
- **Content:** `APlusContent` (Amazon A+ modules)
- **Billing:** `Subscription`, `CreditTransaction`, `ApiKey`

Key relationships:
- `Project` belongs to `User` and optionally uses a `BrandKit`
- `Project` has many `ProjectImage` (uploaded) and `GeneratedImage` (AI-generated)
- `GeneratedImage` types: `MAIN_IMAGE`, `INFOGRAPHIC`, `LIFESTYLE`, `COMPARISON_CHART`, etc.

### App Router Structure
```
src/app/
├── auth/          # Authentication pages (signin, verify, error)
├── dashboard/     # Main dashboard
├── projects/      # Project CRUD
│   ├── new/       # Create new project
│   └── [id]/      # View/edit project
├── brand-kits/    # Brand kit management
│   ├── new/       # Create brand kit
│   └── [id]/      # Edit brand kit
└── api/
    ├── auth/      # NextAuth API routes
    ├── trpc/      # tRPC API handler
    ├── inngest/   # Inngest background jobs
    ├── webhooks/  # External webhooks (Stripe, etc.)
    ├── transcribe/# Audio transcription endpoint
    └── upload/    # File upload handling
```

### Key Architectural Patterns

1. **Authentication Flow:**
   - NextAuth.js with Prisma adapter
   - Session management via `src/lib/auth`
   - Protected routes use `getServerAuthSession()`

2. **File Storage:**
   - AWS S3 via `src/lib/storage.ts`
   - Supabase storage available via `src/lib/supabase/`
   - Images stored with metadata in database

3. **Type Safety:**
   - End-to-end type safety via tRPC
   - Zod schemas in `src/lib/zod/` for validation
   - Prisma types auto-generated

4. **AI Workflow:**
   - Generate product images using `generateChatCompletion()`
   - Queue long-running AI jobs via Inngest
   - Poll for completion, don't block on response

## Agent Helpers System

The `agent-helpers/` directory is exclusively for AI agent operations:

- **tasks/**: Task checklists for systematic implementation
- **docs/**: 3rd-party SDK documentation (include source URLs)
- **scratchpad.md**: Temporary notes for current session
- **README**: Instructions for agent workflow

**Workflow Pattern:**
1. Read task checklist in `agent-helpers/tasks/`
2. Complete tasks in order without interruption
3. Mark tasks complete and proceed
4. Use scratchpad for refactoring notes
5. Clean up scratchpad when done

## Cursor Custom Commands

Located in `.cursor/commands/`:
- `/start` - Begin working on tasks from agent-helpers
- `/continue` - Keep working on current task (queue multiple for persistence)
- `/review` - Review completed work
- `/document` - Document changes
- `/refactor` - Refactor for better AI navigation

**Tip:** Queue commands for autonomous work:
```
/start
/continue
/continue
/review
/refactor
/document
```

## Critical Rules

1. **ALWAYS** build after changes: `npm run build` - ignore warnings, fix errors
2. **NEVER** use `npx prisma db push` - only use `npx prisma migrate dev`
3. **NEVER** use Radix UI or shadcn - Tailwind only
4. **ALWAYS** use `generateChatCompletion` for AI - prefer GPT-5 model
5. **ALWAYS** poll for Inngest job completion - never trust immediate response
6. Use `tsx` scripts for database migrations/seeding
7. Keep code concise; use semantic commits

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL`, `DIRECT_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` - Authentication
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase
- `OPENAI_API_KEY` - AI operations
- `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` - Background jobs
- `AWS_*` - S3 file storage
- `STRIPE_*` - Billing (optional)

## Additional Context

- This is Kevin's personal template optimized for AI coding (see README for his approach)
- Template uses multiple AI providers but prefers OpenAI GPT-5
- Designed for Amazon seller use case: generate product listings, images, A+ content
- Subscription-based with credit system for AI operations
- Supports brand consistency via BrandKit system
