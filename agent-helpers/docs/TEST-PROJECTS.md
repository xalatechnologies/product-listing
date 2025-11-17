# Test Projects Documentation

## Overview

Comprehensive test projects have been created with images, A+ content, generated images, and brand kits for testing the application.

## Script

Run the script to create test projects:

```bash
npm run seed:projects
```

## Created Projects

### 1. TechSound Pro Wireless Headphones
- **Status**: COMPLETED
- **Product Images**: 5 images from Unsplash
- **Generated Images**: 4 (Main Image, Infographic, Feature Highlight, Lifestyle)
- **A+ Content**: Yes (4 modules, Premium)
- **Category**: Electronics > Audio > Headphones
- **View**: `/projects/{id}`
- **A+ Content**: `/projects/{id}/aplus`

### 2. FitTrack Pro Smart Watch
- **Status**: COMPLETED
- **Product Images**: 4 images from Unsplash
- **Generated Images**: 4 (Main Image, Infographic, Feature Highlight, Lifestyle)
- **A+ Content**: Yes (4 modules, Standard)
- **Category**: Electronics > Wearable Technology > Smart Watches
- **View**: `/projects/{id}`
- **A+ Content**: `/projects/{id}/aplus`

### 3. ComfortMax Pro Ergonomic Chair
- **Status**: PROCESSING
- **Product Images**: 3 images from Unsplash
- **Generated Images**: No
- **A+ Content**: No
- **Category**: Furniture > Office Furniture > Chairs
- **View**: `/projects/{id}`

### 4. SoundWave Portable Speaker
- **Status**: DRAFT
- **Product Images**: 3 images from Unsplash
- **Generated Images**: No
- **A+ Content**: No
- **Category**: Electronics > Audio > Speakers
- **View**: `/projects/{id}`

### 5. BrewMaster Pro Coffee Maker
- **Status**: DRAFT
- **Product Images**: 3 images from Unsplash
- **Generated Images**: No
- **A+ Content**: No
- **Category**: Home & Kitchen > Kitchen Appliances > Coffee Makers
- **View**: `/projects/{id}`

## Project Features

### Product Images
- All projects include 3-5 high-quality product images from Unsplash
- Images are properly sized (1000x1000px)
- Images are ordered correctly
- Real URLs that can be displayed in the UI

### Generated Images (Completed Projects Only)
- **Main Image**: 1000x1000px white background main image
- **Infographic**: 1024x1792px feature infographic
- **Feature Highlight**: 1024x1024px feature highlight image
- **Lifestyle**: 1792x1024px lifestyle scene image

### A+ Content (Completed Projects Only)
Each completed project includes 4 A+ content modules:

1. **Standard Single Image Sidebar**
   - Headline and body text
   - Sidebar with key features
   - Product image

2. **Standard Single Image Highlights**
   - Feature highlights
   - Bullet points
   - Product image

3. **Standard Four Images Text**
   - Four product views
   - Descriptive text
   - Multiple angles

4. **Standard Comparison Table**
   - Feature comparison
   - Specifications
   - Competitive advantages

### Brand Kit
- All projects are linked to a test brand kit
- Brand colors: Primary (#2563EB), Secondary (#10B981), Accent (#F59E0B)
- Brand kit is set as default

## Project Statuses

The projects are created with different statuses to test various states:

- **COMPLETED**: Full project with images, generated images, and A+ content
- **PROCESSING**: Project in progress (has product images, no generated content yet)
- **DRAFT**: Initial project state (has product images only)

## Testing Scenarios

These projects enable testing of:

1. **Project Listing**: View all projects in different states
2. **Project Detail**: View individual project details
3. **Image Gallery**: Browse product and generated images
4. **A+ Content**: View and edit A+ content modules
5. **Image Generation**: Test generating images for draft/processing projects
6. **A+ Generation**: Test generating A+ content for projects
7. **Brand Kit Integration**: See how brand colors are applied
8. **Project Status**: Test status transitions

## Data Structure

### Product Images
```typescript
{
  url: string;           // Unsplash image URL
  originalUrl: string;   // Same as url
  width: 1000;
  height: 1000;
  size: number;          // Random between 200-300KB
  order: number;         // 0, 1, 2, etc.
}
```

### Generated Images
```typescript
{
  type: ImageType;       // MAIN_IMAGE, INFOGRAPHIC, etc.
  url: string;           // Unsplash image URL
  width: number;         // Type-specific
  height: number;        // Type-specific
  size: number;          // Random between 250-350KB
  style: "default";
  metadata: {
    generated: true;
    timestamp: string;
  };
}
```

### A+ Content Modules
```typescript
{
  type: string;          // Module type
  templateId: string;   // Template identifier
  content: {
    headline: string;
    bodyText: string;
    imageDescriptions: string[];
    bullets?: string[];
    specifications?: Record<string, string>;
  };
  template: null;
}
```

## Usage

### View Projects
Navigate to the dashboard to see all projects:
```
http://localhost:3000/dashboard
```

### View Individual Project
```
http://localhost:3000/projects/{projectId}
```

### View A+ Content
```
http://localhost:3000/projects/{projectId}/aplus
```

### Edit Project
```
http://localhost:3000/projects/{projectId}/edit
```

## Cleanup

To remove test projects, you can:

1. Delete them manually through the UI
2. Use Prisma Studio: `npx prisma studio`
3. Run a cleanup script (if created)

## Notes

- Images use Unsplash URLs which are free to use
- Generated image URLs are placeholder Unsplash URLs
- A+ content uses realistic module structures
- All projects are linked to the same test user
- Brand kit is shared across all projects

## Future Enhancements

1. Add more product categories
2. Create projects with different brand kits
3. Add export history
4. Include credit transaction history
5. Add more generated image types
6. Create projects with premium A+ content

