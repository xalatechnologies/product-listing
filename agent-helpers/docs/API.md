# API Documentation

This document describes all tRPC procedures available in the application.

## Base URL

- Development: `http://localhost:3000/api/trpc`
- Production: `https://your-domain.com/api/trpc`

## Authentication

Most procedures require authentication. Use NextAuth session tokens. Unauthenticated requests to protected procedures will return a `UNAUTHORIZED` error.

## Error Codes

- `UNAUTHORIZED` (401) - User is not authenticated
- `FORBIDDEN` (403) - User doesn't have permission
- `NOT_FOUND` (404) - Resource not found
- `BAD_REQUEST` (400) - Invalid input
- `INTERNAL_SERVER_ERROR` (500) - Server error

## Project Router (`project`)

### `project.create`

Create a new project.

**Input:**
```typescript
{
  name: string; // 1-255 characters
  description?: string; // Optional, max 2000 characters
  productName: string; // 1-255 characters
  productCategory?: string; // Optional
  brandKitId?: string; // Optional brand kit ID
}
```

**Response:**
```typescript
{
  id: string;
  userId: string;
  name: string;
  description?: string;
  productName: string;
  productCategory?: string;
  status: "DRAFT" | "PROCESSING" | "COMPLETED" | "FAILED";
  brandKit?: BrandKit;
  _count: {
    productImages: number;
    generatedImages: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `BAD_REQUEST` - Validation error (check Zod error details)

---

### `project.list`

List all projects for the current user.

**Input:** None

**Response:**
```typescript
Array<{
  id: string;
  name: string;
  productName: string;
  status: ProjectStatus;
  brandKit?: BrandKit;
  _count: {
    productImages: number;
    generatedImages: number;
  };
  updatedAt: Date;
}>
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated

---

### `project.get`

Get a single project by ID.

**Input:**
```typescript
{
  id: string;
}
```

**Response:**
```typescript
{
  id: string;
  name: string;
  description?: string;
  productName: string;
  productCategory?: string;
  status: ProjectStatus;
  productImages: ProjectImage[];
  generatedImages: GeneratedImage[];
  brandKit?: BrandKit;
  aPlusContent?: APlusContent;
  createdAt: Date;
  updatedAt: Date;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user

---

### `project.update`

Update a project.

**Input:**
```typescript
{
  id: string;
  name?: string;
  description?: string;
  productName?: string;
  productCategory?: string;
  brandKitId?: string;
  status?: ProjectStatus;
}
```

**Response:** Updated project object (same as `project.get`)

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user
- `BAD_REQUEST` - Validation error

---

### `project.delete`

Delete a project.

**Input:**
```typescript
{
  id: string;
}
```

**Response:**
```typescript
{
  success: true;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user

---

## Image Router (`image`)

### `image.upload`

Create a database record for an uploaded product image. File upload happens via `/api/upload` endpoint.

**Input:**
```typescript
{
  projectId: string;
  url: string; // Public URL from Supabase Storage
  width: number; // Image width in pixels
  height: number; // Image height in pixels
  size: number; // File size in bytes
  order: number; // Display order (default: 0)
}
```

**Response:**
```typescript
{
  id: string;
  projectId: string;
  url: string;
  width: number;
  height: number;
  size: number;
  order: number;
  createdAt: Date;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user

---

### `image.generate`

Queue an AI image generation job.

**Input:**
```typescript
{
  projectId: string;
  type: "MAIN_IMAGE" | "INFOGRAPHIC" | "FEATURE_HIGHLIGHT" | "LIFESTYLE" | "COMPARISON_CHART" | "DIMENSION_DIAGRAM";
  style?: string; // Optional style preference
}
```

**Response:**
```typescript
{
  jobId: string;
  status: "queued";
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user
- `FORBIDDEN` - Insufficient credits (when credit system is implemented)

---

### `image.listProductImages`

List all product images for a project.

**Input:**
```typescript
{
  projectId: string;
}
```

**Response:**
```typescript
Array<{
  id: string;
  url: string;
  width: number;
  height: number;
  size: number;
  order: number;
  createdAt: Date;
}>
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user

---

### `image.list`

List all generated images for a project.

**Input:**
```typescript
{
  projectId: string;
}
```

**Response:**
```typescript
Array<{
  id: string;
  type: ImageType;
  style?: string;
  url: string;
  width: number;
  height: number;
  size: number;
  metadata?: any;
  createdAt: Date;
}>
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user

---

### `image.deleteProductImage`

Delete a product image.

**Input:**
```typescript
{
  id: string;
}
```

**Response:**
```typescript
{
  success: true;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Image not found or doesn't belong to user's project

---

## Brand Kit Router (`brandKit`)

### `brandKit.create`

Create a new brand kit.

**Input:**
```typescript
{
  name: string; // 1-255 characters
  logoUrl?: string; // Valid URL
  primaryColor?: string; // Hex color format: #RRGGBB
  secondaryColor?: string; // Hex color format: #RRGGBB
  accentColor?: string; // Hex color format: #RRGGBB
  fontFamily?: string; // Optional font family
}
```

**Response:**
```typescript
{
  id: string;
  userId: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `BAD_REQUEST` - Validation error (invalid color format, etc.)

---

### `brandKit.list`

List all brand kits for the current user.

**Input:** None

**Response:**
```typescript
Array<{
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  isDefault: boolean;
  createdAt: Date;
}>
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated

---

### `brandKit.get`

Get a single brand kit by ID.

**Input:**
```typescript
{
  id: string;
}
```

**Response:** Brand kit object (same as `brandKit.create`)

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Brand kit not found or doesn't belong to user

---

### `brandKit.update`

Update a brand kit.

**Input:**
```typescript
{
  id: string;
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}
```

**Response:** Updated brand kit object

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Brand kit not found or doesn't belong to user
- `BAD_REQUEST` - Validation error

---

### `brandKit.delete`

Delete a brand kit.

**Input:**
```typescript
{
  id: string;
}
```

**Response:**
```typescript
{
  success: true;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Brand kit not found or doesn't belong to user

---

### `brandKit.setDefault`

Set a brand kit as the default for the user.

**Input:**
```typescript
{
  id: string;
}
```

**Response:** Updated brand kit object with `isDefault: true`

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Brand kit not found or doesn't belong to user

---

## A+ Content Router (`aPlus`)

### `aPlus.generate`

Generate A+ content for a project.

**Input:**
```typescript
{
  projectId: string;
  isPremium: boolean; // Use premium modules (default: false)
}
```

**Response:**
```typescript
{
  id: string;
  projectId: string;
  modules: APlusModule[];
  isPremium: boolean;
  analysis: {
    keyFeatures: string[];
    benefits: string[];
    useCases: string[];
    modules: Array<{
      headline: string;
      bodyText: string;
      imageDescriptions: string[];
      additionalContent?: any;
    }>;
  };
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user
- `FORBIDDEN` - Insufficient credits (when credit system is implemented)

---

### `aPlus.update`

Update A+ content modules.

**Input:**
```typescript
{
  projectId: string;
  modules: Array<{
    type: string;
    content: any; // Flexible JSON structure
  }>;
  isPremium?: boolean;
}
```

**Response:**
```typescript
{
  id: string;
  projectId: string;
  modules: APlusModule[];
  isPremium: boolean;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user

---

### `aPlus.get`

Get A+ content for a project.

**Input:**
```typescript
{
  projectId: string;
}
```

**Response:**
```typescript
{
  id: string;
  projectId: string;
  modules: APlusModule[];
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
} | null // Returns null if no A+ content exists
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user

---

### `aPlus.export`

Export A+ content as images (ZIP file).

**Input:**
```typescript
{
  projectId: string;
  format: "png" | "jpg"; // Image format (default: "png")
}
```

**Response:**
```typescript
{
  downloadUrl: string; // Signed URL (expires in 1 hour)
  fileSize: number; // Size in bytes
  moduleCount: number; // Number of modules exported
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project or A+ content not found

---

## Export Router (`export`)

### `export.export`

Export project images for a marketplace platform.

**Input:**
```typescript
{
  projectId: string;
  platform: "amazon" | "ebay" | "etsy" | "shopify";
}
```

**Response:**
```typescript
{
  downloadUrl: string; // Signed URL (expires in 1 hour)
  fileSize: number; // Size in bytes
  imageCount: number; // Number of images in ZIP
  platform: string;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Project not found or doesn't belong to user
- `BAD_REQUEST` - No generated images found

---

### Platform-Specific Exports

- `export.exportAmazon` - Same as `export.export` with `platform: "amazon"`
- `export.exportEbay` - Same as `export.export` with `platform: "ebay"`
- `export.exportEtsy` - Same as `export.export` with `platform: "etsy"`
- `export.exportShopify` - Same as `export.export` with `platform: "shopify"`

---

## Subscription Router (`subscription`)

### `subscription.get`

Get current subscription status.

**Input:** None

**Response:**
```typescript
{
  id: string;
  userId: string;
  stripeId?: string;
  plan: "FREE" | "STARTER" | "PROFESSIONAL" | "AGENCY";
  status: "ACTIVE" | "CANCELED" | "TRIALING" | "PAST_DUE";
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
} | null // Returns null if no active subscription
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated

---

### `subscription.getCredits`

Get current credit balance.

**Input:** None

**Response:**
```typescript
{
  balance: number; // Total credit balance
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated

---

### `subscription.getCreditHistory`

Get credit transaction history.

**Input:**
```typescript
{
  limit?: number; // Default: 50, max: 100
  offset?: number; // Default: 0
}
```

**Response:**
```typescript
{
  transactions: Array<{
    id: string;
    userId: string;
    amount: number; // Positive for credits added, negative for usage
    type: "SUBSCRIPTION" | "PURCHASE" | "USAGE";
    description?: string;
    metadata?: any;
    createdAt: Date;
  }>;
  total: number; // Total number of transactions
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated

---

### `subscription.createCheckout`

Create Stripe checkout session for subscription.

**Input:**
```typescript
{
  plan: "STARTER" | "PROFESSIONAL" | "AGENCY";
}
```

**Response:**
```typescript
{
  url: string; // Stripe checkout URL
  sessionId: string;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `BAD_REQUEST` - User email required
- `INTERNAL_SERVER_ERROR` - Plan not configured

---

### `subscription.purchaseCredits`

Create Stripe checkout session for credit purchase.

**Input:**
```typescript
{
  amount: number; // Number of credits to purchase
  priceId: string; // Stripe price ID for credit pack
}
```

**Response:**
```typescript
{
  url: string; // Stripe checkout URL
  sessionId: string;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `BAD_REQUEST` - User email required

---

### `subscription.cancel`

Cancel active subscription (cancels at period end).

**Input:** None

**Response:**
```typescript
{
  success: true;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - No active subscription found

---

### `subscription.resume`

Resume a canceled subscription.

**Input:** None

**Response:**
```typescript
{
  success: true;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - No canceled subscription found

---

### `subscription.checkCredits`

Check if user has enough credits for an operation.

**Input:**
```typescript
{
  required: number; // Number of credits required
}
```

**Response:**
```typescript
{
  hasEnough: boolean;
  balance: number;
  required: number;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated

---

### `subscription.deductCredits`

Deduct credits for an operation.

**Input:**
```typescript
{
  amount: number; // Number of credits to deduct
  description?: string;
  metadata?: any;
}
```

**Response:**
```typescript
{
  success: true;
  newBalance: number;
}
```

**Errors:**
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient credits

---

## File Upload API (`/api/upload`)

### POST `/api/upload`

Upload a file to Supabase Storage.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (File) - Image file (JPEG, PNG, WebP, max 10MB)
- `projectId` (string) - Project ID (required for product images)
- `brandKitId` (string) - Brand kit ID (required for brand kit logos)
- `type` (string) - `"product"` or `"brand-kit"`

**Response:**
```typescript
{
  url: string; // Public URL
  width: number;
  height: number;
  size: number; // Bytes
  filename: string; // Sanitized filename
}
```

**Headers:**
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Unix timestamp when limit resets

**Errors:**
- `401 Unauthorized` - Not authenticated
- `400 Bad Request` - Invalid file type, size, or missing required fields
- `429 Too Many Requests` - Rate limit exceeded

---

## Webhooks

### Stripe Webhook (`/api/webhooks/stripe`)

Handles Stripe webhook events for subscription management.

**Events Handled:**
- `checkout.session.completed` - Creates subscription and adds credits
- `customer.subscription.created` - Creates subscription record
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Cancels subscription
- `invoice.payment_succeeded` - Processes successful payment
- `invoice.payment_failed` - Handles failed payment

**Security:** Webhook signature verification required.


