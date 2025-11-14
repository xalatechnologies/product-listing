# 🚀 AI Product Listing & A+ Content Generator

An AI-powered SaaS application for Amazon sellers to generate professional product listing images and A+ content in minutes, for 10× less cost than traditional agencies.

## 🎯 Overview

This application helps Amazon sellers create professional product listings by:
- **AI Image Generation** - Generate Amazon-compliant main images, infographics, lifestyle shots, and more
- **A+ Content Creation** - Automatically generate Amazon A+ content modules with AI
- **Brand Consistency** - Apply brand kits to ensure consistent styling across all assets
- **Multi-Platform Export** - Export optimized images for Amazon, eBay, Etsy, and Shopify
- **Credit-Based Billing** - Flexible subscription plans and pay-as-you-go options

Built with Next.js 15, TypeScript, tRPC, Prisma, Supabase, and AI integrations.

## ✨ Features

### 🎨 Product Listing Features

- **Project Management** - Organize products into projects with metadata
- **Image Upload** - Drag & drop product images with validation
- **AI Image Generation** - 6 types of listing images:
  - Main Image (1000x1000px, white background)
  - Infographics (feature highlights)
  - Feature Highlights (individual features)
  - Lifestyle Images (product in use)
  - Comparison Charts (vs competitors)
  - Dimension Diagrams (technical specs)
- **A+ Content Generator** - AI-powered Amazon A+ module generation
- **Brand Kits** - Consistent branding across all assets
- **Marketplace Export** - Optimized exports for Amazon, eBay, Etsy, Shopify

### 🏗️ Technical Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety throughout
- **tRPC** - End-to-end type-safe APIs
- **Prisma** - Database ORM with PostgreSQL
- **NextAuth.js** - Authentication with email magic links
- **Supabase** - Database, storage, and realtime
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Inngest** - Background job processing
- **Stripe** - Subscription and payment processing

### 🤖 AI Integrations

- **OpenAI GPT-5** - Content analysis and generation
- **DALL-E 3** - Image generation
- **Remove.bg** - Background removal
- **Groq** - Fast inference for transcription

### 🤖 Agent Features

- [**Agent Helpers**](./agent-helpers) - A folder for agent-specific files and tools.
- [**Agent Instructions**](./agent-helpers/README.md) - Instructions for the agent.
- [**Agent Tasks**](./agent-helpers/tasks.md) - A checklist of tasks for the agent to complete.
- [**Agent Scratchpad**](./agent-helpers/scratchpad.md) - A place for the agent to write down its thoughts and ideas.
- [**Agent Logs**](./agent-helpers/logs) - A place for the agent to write down its logs.

> **ℹ️ Add these lines to your `.gitignore` to avoid agent-helper conflicts (copy & paste):**

```.gitignore
# agent-helpers
agent-helpers/logs
agent-helpers/sample-code
agent-helpers/scratchpad.md
```

### 🤖 Cursor Custom Slash Commands

Cursor has a feature that allows you to define custom slash commands for your AI agents. This is a great way to help your agents navigate the codebase and complete tasks efficiently.

Here are the commands that are available to you, just type `/` in the agent window to see the list of commands.

- [**start**](.cursor/commands/start.md) - Start working on a new task.
- [**continue**](.cursor/commands/continue.md) - Queue these up to keep the agent working on the current task until all tasks are complete.
- [**review**](.cursor/commands/review.md) - Review the work that has been completed.
- [**document**](.cursor/commands/document.md) - Document the changes that have been made.
- [**refactor**](.cursor/commands/refactor.md) - Refactor the code to make it easier for AI agents to navigate in the future.

> **ℹ️ Tip: When starting a new task, you can queue these up to keep the agent working on the current task until all tasks are complete.** For example:

```txt
/start
/continue
/continue
/continue
/continue
/continue
/review
/refactor
/review
/document
```

If you want to add more commands, you can add them to the .cursor/commands folder, just start the file with `#` and the name of the command.

## 🚀 Getting Started

See [GETTING-STARTED.md](./GETTING-STARTED.md) for detailed setup instructions.

### Quick Start

1. **Clone the repository:**
```bash
git clone <repository-url>
cd product-listing
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Configure all required variables (see [Environment Variables](#-environment-variables))

4. **Set up database:**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Start development server:**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

For detailed setup instructions, see:
- [Developer Guide](./agent-helpers/docs/DEVELOPER-GUIDE.md) - Complete setup and development guide
- [User Guide](./agent-helpers/docs/USER-GUIDE.md) - End-user documentation
- [API Documentation](./agent-helpers/docs/API.md) - tRPC API reference

## 🔐 Environment Variables

This project requires the following environment variables. Copy `.env.example` to `.env` and configure them:

### Database
- `DATABASE_URL` - PostgreSQL connection string (e.g., from Supabase)
- `DIRECT_URL` - Direct PostgreSQL connection (for migrations, same as DATABASE_URL for Supabase)

### Authentication (NextAuth)
- `NEXTAUTH_SECRET` - Secret key for session encryption (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your application URL (development: `http://localhost:3000`)

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret)

### Stripe (Billing & Subscriptions)
- `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_`)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_`)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (starts with `whsec_`)
- `STRIPE_PRICE_STARTER` - Stripe price ID for Starter plan
- `STRIPE_PRICE_PROFESSIONAL` - Stripe price ID for Professional plan
- `STRIPE_PRICE_AGENCY` - Stripe price ID for Agency plan

### AI Services
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI for AI features)

### Inngest (Background Jobs)
- `INNGEST_EVENT_KEY` - Inngest event key
- `INNGEST_SIGNING_KEY` - Inngest signing key

> **Note**: The `.env` file is already in `.gitignore` and will not be committed to version control.

## 📁 Project Structure

```
product-listing/
├── agent-helpers/          # AI agent helper files and documentation
├── prisma/                 # Database schema and migrations
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── api/            # API routes (auth, upload, webhooks)
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Main dashboard
│   │   ├── projects/       # Project management
│   │   └── billing/        # Billing and subscriptions
│   ├── components/         # React components
│   ├── lib/                # Core libraries
│   │   ├── api/            # tRPC routers
│   │   ├── ai/             # AI generation utilities
│   │   ├── aplus/          # A+ content generation
│   │   └── utils/          # Shared utilities
│   └── stories/            # Storybook stories
└── supabase/               # Supabase Edge Functions
```

See [Developer Guide](./agent-helpers/docs/DEVELOPER-GUIDE.md#project-structure) for detailed structure.

## 🚀 Deployment

This template is optimized for deployment on [Vercel](https://vercel.com).

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your database connection strings from Supabase:
   - Project Settings → Database
   - Copy both the URI (for `DATABASE_URL`) and Direct Connection (for `DIRECT_URL`)

### Vercel Setup

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure the following environment variables:
   - `DATABASE_URL` - Your Supabase database URL
   - `DIRECT_URL` - Your Supabase direct connection URL
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your production URL (e.g., https://your-app.vercel.app)
   - Add any other variables from `.env.example` that you're using
5. Deploy!

### Post-Deployment

1. Run database migrations in the Vercel deployment:

```bash
npx vercel env pull .env.production.local  # Pull production env vars
npx prisma migrate deploy                  # Deploy migrations to production
```

2. Set up your custom domain in Vercel (optional):
   - Go to your project settings
   - Navigate to Domains
   - Add your domain and follow the DNS configuration instructions

## 📚 Documentation

- [**API Documentation**](./agent-helpers/docs/API.md) - Complete tRPC API reference
- [**Developer Guide**](./agent-helpers/docs/DEVELOPER-GUIDE.md) - Setup, architecture, and development workflow
- [**User Guide**](./agent-helpers/docs/USER-GUIDE.md) - End-user documentation
- [**Technical Architecture**](./agent-helpers/docs/TECHNICAL-ARCHITECTURE.md) - System design and architecture
- [**Security Documentation**](./agent-helpers/docs/SECURITY.md) - Security measures and best practices

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the maintainers.

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Run `npm run build` and `npm run lint`
4. Write tests for new features
5. Submit a pull request

See [Developer Guide](./agent-helpers/docs/DEVELOPER-GUIDE.md#contributing) for detailed contribution guidelines.

## 📝 License

MIT License - See [LICENSE](./LICENSE) file for details.
