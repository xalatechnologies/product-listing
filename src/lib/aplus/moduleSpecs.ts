/**
 * Amazon A+ Content Module Specifications
 * 
 * Documentation of standard and premium A+ module types, their requirements,
 * and specifications for image sizes, text limits, and layouts.
 */

export interface ModuleSpec {
  id: string;
  name: string;
  description: string;
  type: "standard" | "premium";
  imageSlots: Array<{
    id: string;
    label: string;
    required: boolean;
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
    aspectRatio?: string;
  }>;
  textSlots: Array<{
    id: string;
    label: string;
    required: boolean;
    maxLength: number;
    minLength?: number;
  }>;
  layout: {
    width: number;
    height: number;
    orientation: "portrait" | "landscape" | "square";
  };
}

/**
 * Standard A+ Modules (Modules 1-6)
 * These are available to all Amazon sellers
 */
export const STANDARD_MODULES: ModuleSpec[] = [
  {
    id: "standard-single-image-sidebar",
    name: "Standard Single Image and Sidebar",
    description: "Large product image with sidebar containing key features",
    type: "standard",
    imageSlots: [
      {
        id: "main-image",
        label: "Main Product Image",
        required: true,
        minWidth: 300,
        minHeight: 300,
        maxWidth: 620,
        maxHeight: 620,
        aspectRatio: "1:1",
      },
    ],
    textSlots: [
      {
        id: "headline",
        label: "Headline",
        required: true,
        maxLength: 50,
        minLength: 10,
      },
      {
        id: "body-text",
        label: "Body Text",
        required: true,
        maxLength: 2000,
        minLength: 50,
      },
      {
        id: "sidebar-items",
        label: "Sidebar Feature Items",
        required: false,
        maxLength: 500,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      orientation: "landscape",
    },
  },
  {
    id: "standard-single-image-highlights",
    name: "Standard Single Image and Highlights",
    description: "Product image with bulleted feature highlights",
    type: "standard",
    imageSlots: [
      {
        id: "main-image",
        label: "Main Product Image",
        required: true,
        minWidth: 300,
        minHeight: 300,
        maxWidth: 620,
        maxHeight: 620,
        aspectRatio: "1:1",
      },
    ],
    textSlots: [
      {
        id: "headline",
        label: "Headline",
        required: true,
        maxLength: 50,
        minLength: 10,
      },
      {
        id: "body-text",
        label: "Body Text",
        required: true,
        maxLength: 2000,
        minLength: 50,
      },
      {
        id: "highlights",
        label: "Feature Highlights (bullets)",
        required: true,
        maxLength: 1000,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      orientation: "landscape",
    },
  },
  {
    id: "standard-four-images-text",
    name: "Standard Four Images and Text",
    description: "Four product images with descriptive text",
    type: "standard",
    imageSlots: [
      {
        id: "image-1",
        label: "Image 1",
        required: true,
        minWidth: 220,
        minHeight: 220,
        maxWidth: 300,
        maxHeight: 300,
        aspectRatio: "1:1",
      },
      {
        id: "image-2",
        label: "Image 2",
        required: true,
        minWidth: 220,
        minHeight: 220,
        maxWidth: 300,
        maxHeight: 300,
        aspectRatio: "1:1",
      },
      {
        id: "image-3",
        label: "Image 3",
        required: true,
        minWidth: 220,
        minHeight: 220,
        maxWidth: 300,
        maxHeight: 300,
        aspectRatio: "1:1",
      },
      {
        id: "image-4",
        label: "Image 4",
        required: true,
        minWidth: 220,
        minHeight: 220,
        maxWidth: 300,
        maxHeight: 300,
        aspectRatio: "1:1",
      },
    ],
    textSlots: [
      {
        id: "headline",
        label: "Headline",
        required: true,
        maxLength: 50,
        minLength: 10,
      },
      {
        id: "body-text",
        label: "Body Text",
        required: true,
        maxLength: 2000,
        minLength: 50,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      orientation: "landscape",
    },
  },
  {
    id: "standard-single-image-specs",
    name: "Standard Single Image and Specs Detail",
    description: "Product image with detailed specifications",
    type: "standard",
    imageSlots: [
      {
        id: "main-image",
        label: "Main Product Image",
        required: true,
        minWidth: 300,
        minHeight: 300,
        maxWidth: 620,
        maxHeight: 620,
        aspectRatio: "1:1",
      },
    ],
    textSlots: [
      {
        id: "headline",
        label: "Headline",
        required: true,
        maxLength: 50,
        minLength: 10,
      },
      {
        id: "body-text",
        label: "Body Text",
        required: true,
        maxLength: 2000,
        minLength: 50,
      },
      {
        id: "specifications",
        label: "Specifications",
        required: true,
        maxLength: 1500,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      orientation: "landscape",
    },
  },
  {
    id: "standard-comparison-table",
    name: "Standard Comparison Table",
    description: "Comparison table showing product vs competitors or features",
    type: "standard",
    imageSlots: [
      {
        id: "product-image",
        label: "Product Image",
        required: true,
        minWidth: 200,
        minHeight: 200,
        maxWidth: 300,
        maxHeight: 300,
        aspectRatio: "1:1",
      },
    ],
    textSlots: [
      {
        id: "headline",
        label: "Headline",
        required: true,
        maxLength: 50,
        minLength: 10,
      },
      {
        id: "comparison-data",
        label: "Comparison Data (table format)",
        required: true,
        maxLength: 2000,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      orientation: "landscape",
    },
  },
  {
    id: "standard-single-image-bullets",
    name: "Standard Single Image and Bullets",
    description: "Product image with bulleted feature list",
    type: "standard",
    imageSlots: [
      {
        id: "main-image",
        label: "Main Product Image",
        required: true,
        minWidth: 300,
        minHeight: 300,
        maxWidth: 620,
        maxHeight: 620,
        aspectRatio: "1:1",
      },
    ],
    textSlots: [
      {
        id: "headline",
        label: "Headline",
        required: true,
        maxLength: 50,
        minLength: 10,
      },
      {
        id: "body-text",
        label: "Body Text",
        required: true,
        maxLength: 2000,
        minLength: 50,
      },
      {
        id: "bullet-points",
        label: "Bullet Points",
        required: true,
        maxLength: 1000,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      orientation: "landscape",
    },
  },
];

/**
 * Premium A+ Modules
 * Available to Brand Registry sellers with Premium A+ access
 */
export const PREMIUM_MODULES: ModuleSpec[] = [
  {
    id: "premium-video",
    name: "Premium Video Module",
    description: "Video showcase with product demonstration",
    type: "premium",
    imageSlots: [
      {
        id: "video-thumbnail",
        label: "Video Thumbnail",
        required: true,
        minWidth: 970,
        minHeight: 300,
        maxWidth: 970,
        maxHeight: 600,
        aspectRatio: "16:9",
      },
    ],
    textSlots: [
      {
        id: "headline",
        label: "Headline",
        required: true,
        maxLength: 50,
        minLength: 10,
      },
      {
        id: "video-description",
        label: "Video Description",
        required: false,
        maxLength: 500,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      orientation: "landscape",
    },
  },
  {
    id: "premium-interactive-hotspot",
    name: "Premium Interactive Hotspot",
    description: "Interactive image with clickable hotspots",
    type: "premium",
    imageSlots: [
      {
        id: "main-image",
        label: "Main Product Image",
        required: true,
        minWidth: 970,
        minHeight: 600,
        maxWidth: 970,
        maxHeight: 1200,
      },
    ],
    textSlots: [
      {
        id: "headline",
        label: "Headline",
        required: true,
        maxLength: 50,
        minLength: 10,
      },
      {
        id: "hotspot-labels",
        label: "Hotspot Labels",
        required: true,
        maxLength: 500,
      },
    ],
    layout: {
      width: 970,
      height: 1200,
      orientation: "portrait",
    },
  },
  {
    id: "premium-image-carousel",
    name: "Premium Image Carousel",
    description: "Carousel of product images with descriptions",
    type: "premium",
    imageSlots: [
      {
        id: "carousel-images",
        label: "Carousel Images (multiple)",
        required: true,
        minWidth: 970,
        minHeight: 400,
        maxWidth: 970,
        maxHeight: 600,
        aspectRatio: "16:9",
      },
    ],
    textSlots: [
      {
        id: "headline",
        label: "Headline",
        required: true,
        maxLength: 50,
        minLength: 10,
      },
      {
        id: "slide-descriptions",
        label: "Slide Descriptions",
        required: false,
        maxLength: 1500,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      orientation: "landscape",
    },
  },
];

/**
 * Get module specification by ID
 */
export function getModuleSpec(moduleId: string): ModuleSpec | undefined {
  return [...STANDARD_MODULES, ...PREMIUM_MODULES].find((m) => m.id === moduleId);
}

/**
 * Get all standard modules
 */
export function getStandardModules(): ModuleSpec[] {
  return STANDARD_MODULES;
}

/**
 * Get all premium modules
 */
export function getPremiumModules(): ModuleSpec[] {
  return PREMIUM_MODULES;
}

/**
 * Get all modules (standard + premium)
 */
export function getAllModules(): ModuleSpec[] {
  return [...STANDARD_MODULES, ...PREMIUM_MODULES];
}

/**
 * Amazon A+ Content Requirements Summary:
 * 
 * Image Requirements:
 * - Format: JPEG or PNG
 * - Max file size: 5MB per image
 * - Standard modules: 970px width (max)
 * - Images should be high quality, professional
 * - No watermarks, logos, or promotional text
 * 
 * Text Requirements:
 * - Headlines: 10-50 characters
 * - Body text: 50-2000 characters
 * - No promotional language or pricing
 * - Focus on product features and benefits
 * 
 * Content Guidelines:
 * - Must be brand-appropriate
 * - Cannot include competitor comparisons (in standard modules)
 * - Cannot include customer reviews or testimonials
 * - Must comply with Amazon's content policies
 */

