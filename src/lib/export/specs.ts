/**
 * Marketplace Export Specifications
 * 
 * Image requirements for different e-commerce platforms
 */

export interface MarketplaceSpec {
  name: string;
  mainImage: {
    width: number;
    height: number;
    format: "JPEG" | "PNG" | "WebP";
    maxSizeMB: number;
    naming: string; // Pattern for file naming
  };
  additionalImages: {
    width: number;
    height: number;
    format: "JPEG" | "PNG" | "WebP";
    maxSizeMB: number;
    maxCount: number;
    naming: string;
  };
  requirements: string[];
}

/**
 * Amazon Product Image Requirements
 * 
 * Reference: https://sellercentral.amazon.com/help/hub/reference/G200645390
 */
export const AMAZON_SPEC: MarketplaceSpec = {
  name: "Amazon",
  mainImage: {
    width: 1000,
    height: 1000,
    format: "JPEG",
    maxSizeMB: 10,
    naming: "main-image.jpg",
  },
  additionalImages: {
    width: 1000,
    height: 1000,
    format: "JPEG",
    maxSizeMB: 10,
    maxCount: 8,
    naming: "image-{index}.jpg", // image-1.jpg, image-2.jpg, etc.
  },
  requirements: [
    "Main image must be exactly 1000x1000px",
    "White background (#FFFFFF) for main image",
    "Product must fill at least 85% of the image",
    "No text, logos, or watermarks on main image",
    "Additional images can be 1000x1000px or larger (maintains aspect ratio)",
    "All images must be JPEG format",
    "File size must be under 10MB per image",
  ],
};

/**
 * eBay Product Image Requirements
 * 
 * Reference: https://pages.ebay.com/seller-center/listing/creating-effective-listings.html
 */
export const EBAY_SPEC: MarketplaceSpec = {
  name: "eBay",
  mainImage: {
    width: 1600,
    height: 1600,
    format: "JPEG",
    maxSizeMB: 7,
    naming: "main-image.jpg",
  },
  additionalImages: {
    width: 1600,
    height: 1600,
    format: "JPEG",
    maxSizeMB: 7,
    maxCount: 12,
    naming: "image-{index}.jpg",
  },
  requirements: [
    "Minimum 500px on longest side",
    "Recommended 1600px on longest side",
    "Square images work best",
    "JPEG format preferred",
    "File size under 7MB per image",
    "Up to 12 additional images",
  ],
};

/**
 * Etsy Product Image Requirements
 * 
 * Reference: https://help.etsy.com/hc/en-us/articles/115014328108
 */
export const ETSY_SPEC: MarketplaceSpec = {
  name: "Etsy",
  mainImage: {
    width: 2000,
    height: 2000,
    format: "JPEG",
    maxSizeMB: 20,
    naming: "main-image.jpg",
  },
  additionalImages: {
    width: 2000,
    height: 2000,
    format: "JPEG",
    maxSizeMB: 20,
    maxCount: 10,
    naming: "image-{index}.jpg",
  },
  requirements: [
    "Minimum 2000px on longest side for best quality",
    "Square images (1:1 ratio) recommended",
    "JPEG format",
    "File size up to 20MB per image",
    "Up to 10 additional images",
    "Images should be high quality and well-lit",
  ],
};

/**
 * Shopify Product Image Requirements
 * 
 * Reference: https://help.shopify.com/en/manual/products/product-media
 */
export const SHOPIFY_SPEC: MarketplaceSpec = {
  name: "Shopify",
  mainImage: {
    width: 2048,
    height: 2048,
    format: "JPEG",
    maxSizeMB: 20,
    naming: "main-image.jpg",
  },
  additionalImages: {
    width: 2048,
    height: 2048,
    format: "JPEG",
    maxSizeMB: 20,
    maxCount: 250,
    naming: "image-{index}.jpg",
  },
  requirements: [
    "Recommended 2048x2048px for best quality",
    "Minimum 800x800px",
    "Square images (1:1 ratio) recommended",
    "JPEG or PNG format",
    "File size up to 20MB per image",
    "Up to 250 images per product",
    "WebP format also supported",
  ],
};

/**
 * Get marketplace specification by platform name
 */
export function getMarketplaceSpec(platform: "amazon" | "ebay" | "etsy" | "shopify"): MarketplaceSpec {
  const specs: Record<string, MarketplaceSpec> = {
    amazon: AMAZON_SPEC,
    ebay: EBAY_SPEC,
    etsy: ETSY_SPEC,
    shopify: SHOPIFY_SPEC,
  };

  return specs[platform] || AMAZON_SPEC;
}

