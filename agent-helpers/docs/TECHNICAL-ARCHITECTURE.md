# Technical Architecture — AI Product Listing & A+ Content Generator

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 15)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │   Generator  │  │   Brand Kit  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Projects   │  │   A+ Editor  │  │   Exports    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ tRPC
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Next.js API Routes)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  tRPC Router │  │  File Upload │  │   Auth API   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Database   │  │ File Storage │  │   Inngest    │
│   (Prisma +  │  │  (S3/Supabase│  │   (Queue)    │
│   PostgreSQL)│  │    Storage)  │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Services Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Image Gen   │  │ Background   │  │   Layout     │      │
│  │  (Replicate/ │  │   Removal    │  │   Engine     │      │
│  │  Stability)  │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   GPT-5      │  │   DALL-E 3    │  │   Gemini     │      │
│  │  (Content)   │  │  (Images)     │  │  (Analysis)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Stripe    │  │   Cloudflare │  │   AWS S3     │      │
│  │   (Billing)  │  │   (CDN)      │  │  (Storage)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Design

### Core Models

```prisma
// User & Authentication (existing)
model User {
  id             String    @id @default(cuid())
  email          String?   @unique
  name           String?
  // ... existing fields
  
  // New relationships
  projects       Project[]
  brandKits      BrandKit[]
  subscriptions  Subscription[]
  apiKeys        ApiKey[]
  credits        CreditTransaction[]
}

// Product & Project Management
model Project {
  id              String   @id @default(cuid())
  userId          String
  name            String
  description     String?
  productName     String
  productCategory String?
  status          ProjectStatus @default(DRAFT)
  
  // Images
  mainImage       String?  // S3 URL
  productImages   ProjectImage[]
  generatedImages GeneratedImage[]
  
  // A+ Content
  aPlusContent    APlusContent?
  
  // Branding
  brandKitId      String?
  brandKit        BrandKit? @relation(fields: [brandKitId], references: [id])
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([status])
}

enum ProjectStatus {
  DRAFT
  PROCESSING
  COMPLETED
  FAILED
}

// Product Images (uploaded by user)
model ProjectImage {
  id          String   @id @default(cuid())
  projectId   String
  url         String   // S3 URL
  originalUrl String?  // Original uploaded URL
  width       Int
  height      Int
  size        Int      // bytes
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
}

// Generated Images (AI-created)
model GeneratedImage {
  id          String   @id @default(cuid())
  projectId   String
  type        ImageType
  style       String?  // premium, minimal, bold, etc.
  url         String   // S3 URL
  width       Int
  height      Int
  size        Int
  metadata    Json?    // AI generation metadata
  createdAt   DateTime @default(now())
  
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
  @@index([type])
}

enum ImageType {
  MAIN_IMAGE           // White background main image
  INFOGRAPHIC         // Feature infographic
  FEATURE_HIGHLIGHT   // Feature highlight image
  LIFESTYLE           // Lifestyle scene
  COMPARISON_CHART    // Comparison chart
  DIMENSION_DIAGRAM    // Dimension diagram
  A_PLUS_MODULE       // A+ content module
}

// Brand Kit
model BrandKit {
  id          String   @id @default(cuid())
  userId      String
  name        String
  logoUrl     String?  // S3 URL
  primaryColor String? // Hex color
  secondaryColor String? // Hex color
  accentColor String?  // Hex color
  fontFamily  String?
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  projects    Project[]
  
  @@index([userId])
}

// A+ Content
model APlusContent {
  id          String   @id @default(cuid())
  projectId   String   @unique
  modules     Json     // Array of module configurations
  isPremium   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// Subscription & Billing
model Subscription {
  id              String   @id @default(cuid())
  userId          String
  stripeId        String?  @unique
  plan            SubscriptionPlan
  status          SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([status])
}

enum SubscriptionPlan {
  FREE
  STARTER      // $19/mo - 10 listings/month
  PROFESSIONAL // $49/mo - 50 listings/month
  AGENCY       // $199/mo - Unlimited
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  TRIALING
}

// Credit System
model CreditTransaction {
  id          String   @id @default(cuid())
  userId      String
  amount      Int      // Positive for credits added, negative for usage
  type        CreditType
  description String?
  metadata    Json?    // Additional transaction data
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([createdAt])
}

enum CreditType {
  PURCHASE        // User purchased credits
  SUBSCRIPTION    // Monthly subscription credits
  USAGE           // Credits used for generation
  REFUND          // Refunded credits
  BONUS           // Promotional credits
}

// API Keys (for enterprise/agency)
model ApiKey {
  id          String   @id @default(cuid())
  userId      String
  key         String   @unique
  name        String
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([key])
}
```

## API Architecture

### tRPC Routers Structure

```
src/lib/api/routers/
├── project.router.ts      # Project CRUD operations
├── image.router.ts        # Image upload & generation
├── brandKit.router.ts    # Brand kit management
├── aPlus.router.ts       # A+ content generation
├── export.router.ts      # Marketplace exports
├── subscription.router.ts # Billing & subscriptions
└── apiKey.router.ts      # API key management (enterprise)
```

### Key API Endpoints

**Project Management:**
- `project.create` - Create new project
- `project.list` - List user's projects
- `project.get` - Get project details
- `project.update` - Update project
- `project.delete` - Delete project

**Image Generation:**
- `image.upload` - Upload product images
- `image.generate` - Generate listing images
- `image.list` - List generated images
- `image.download` - Download image pack

**A+ Content:**
- `aPlus.generate` - Generate A+ content
- `aPlus.update` - Update A+ modules
- `aPlus.export` - Export A+ content

**Brand Kit:**
- `brandKit.create` - Create brand kit
- `brandKit.list` - List brand kits
- `brandKit.update` - Update brand kit
- `brandKit.delete` - Delete brand kit

## AI Service Integration

### Image Generation Pipeline

1. **Background Removal**
   - Service: Remove.bg API or custom ML model
   - Input: Product image
   - Output: Transparent PNG

2. **Main Image Generation**
   - Service: DALL-E 3 or Stable Diffusion
   - Input: Product image + prompt
   - Output: White background main image (1000x1000px)

3. **Infographic Generation**
   - Service: GPT-5 (layout) + DALL-E 3 (rendering)
   - Input: Product features, brand kit
   - Output: Infographic image

4. **Lifestyle Image Generation**
   - Service: DALL-E 3 or Midjourney API
   - Input: Product image + scene description
   - Output: Lifestyle scene image

### A+ Content Generation

1. **Content Analysis**
   - Service: GPT-5
   - Input: Product description, features
   - Output: Structured content for A+ modules

2. **Layout Generation**
   - Service: Custom layout engine
   - Input: Content + brand kit
   - Output: A+ module layouts

3. **Image Rendering**
   - Service: Canvas API or Puppeteer
   - Input: Layout + brand assets
   - Output: A+ module images

## Background Job Processing (Inngest)

### Job Types

```typescript
// Image generation job
inngest.createFunction({
  id: "generate-listing-images",
  name: "Generate Listing Images",
  // Process: Upload → Background Removal → Generate Variations → Store
});

// A+ content generation job
inngest.createFunction({
  id: "generate-aplus-content",
  name: "Generate A+ Content",
  // Process: Analyze → Generate Modules → Render → Store
});
```

## File Storage Strategy

1. **Upload Flow:**
   - User uploads → S3/Supabase Storage (original)
   - Generate thumbnails → CDN (Cloudflare Images)

2. **Generated Images:**
   - AI generates → Temporary storage
   - Process & optimize → S3/Supabase Storage
   - Serve via CDN

3. **Export Packs:**
   - Generate ZIP → Temporary storage
   - User downloads → Direct S3 link (signed URL)

## Security Considerations

1. **Authentication:** NextAuth with JWT
2. **File Upload:** Size limits, type validation, virus scanning
3. **API Rate Limiting:** Per user, per subscription tier
4. **Credit Validation:** Check before processing
5. **Data Isolation:** User data scoped by userId

## Performance Optimization

1. **Image Caching:** CDN caching for generated images
2. **Queue Processing:** Async job processing via Inngest
3. **Database Indexing:** Strategic indexes on frequently queried fields
4. **API Response Caching:** Cache project data, brand kits
5. **Image Optimization:** WebP format, responsive sizes

## Monitoring & Analytics

1. **Error Tracking:** Sentry or similar
2. **Performance Monitoring:** Vercel Analytics
3. **Usage Analytics:** Track credit usage, generation times
4. **Business Metrics:** Stripe webhooks for revenue tracking

