/**
 * A+ Content Module Templates
 * 
 * Template definitions for Amazon A+ content modules.
 * Each template includes layout structure, image slots, text slots, and styling options.
 */

import { ModuleSpec, getModuleSpec } from "./moduleSpecs";

export interface ImageSlot {
  id: string;
  url?: string;
  position: { x: number; y: number; width: number; height: number };
  required: boolean;
}

export interface TextSlot {
  id: string;
  content: string;
  position: { x: number; y: number; width: number; height: number };
  style: {
    fontSize: number;
    fontFamily?: string;
    fontWeight?: "normal" | "bold";
    color: string;
    align?: "left" | "center" | "right";
  };
  required: boolean;
}

export interface APLusModuleTemplate {
  id: string;
  moduleSpecId: string;
  name: string;
  description: string;
  imageSlots: ImageSlot[];
  textSlots: TextSlot[];
  layout: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  styling: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    accentColor?: string;
  };
}

/**
 * Template variations for each module type
 * Each module type has at least 3 template variations
 */

const STANDARD_SINGLE_IMAGE_SIDEBAR_TEMPLATES: APLusModuleTemplate[] = [
  {
    id: "single-image-sidebar-1",
    moduleSpecId: "standard-single-image-sidebar",
    name: "Left Image, Right Sidebar",
    description: "Product image on left, feature sidebar on right",
    imageSlots: [
      {
        id: "main-image",
        position: { x: 0, y: 0, width: 470, height: 600 },
        required: true,
      },
    ],
    textSlots: [
      {
        id: "headline",
        content: "",
        position: { x: 500, y: 20, width: 450, height: 60 },
        style: {
          fontSize: 32,
          fontWeight: "bold",
          color: "#000000",
          align: "left",
        },
        required: true,
      },
      {
        id: "body-text",
        content: "",
        position: { x: 500, y: 100, width: 450, height: 300 },
        style: {
          fontSize: 16,
          color: "#333333",
          align: "left",
        },
        required: true,
      },
      {
        id: "sidebar-items",
        content: "",
        position: { x: 500, y: 420, width: 450, height: 160 },
        style: {
          fontSize: 14,
          color: "#666666",
          align: "left",
        },
        required: false,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      backgroundColor: "#FFFFFF",
    },
    styling: {
      primaryColor: "#0066CC",
      secondaryColor: "#333333",
      textColor: "#000000",
    },
  },
  {
    id: "single-image-sidebar-2",
    moduleSpecId: "standard-single-image-sidebar",
    name: "Right Image, Left Sidebar",
    description: "Feature sidebar on left, product image on right",
    imageSlots: [
      {
        id: "main-image",
        position: { x: 500, y: 0, width: 470, height: 600 },
        required: true,
      },
    ],
    textSlots: [
      {
        id: "headline",
        content: "",
        position: { x: 20, y: 20, width: 450, height: 60 },
        style: {
          fontSize: 32,
          fontWeight: "bold",
          color: "#000000",
          align: "left",
        },
        required: true,
      },
      {
        id: "body-text",
        content: "",
        position: { x: 20, y: 100, width: 450, height: 300 },
        style: {
          fontSize: 16,
          color: "#333333",
          align: "left",
        },
        required: true,
      },
      {
        id: "sidebar-items",
        content: "",
        position: { x: 20, y: 420, width: 450, height: 160 },
        style: {
          fontSize: 14,
          color: "#666666",
          align: "left",
        },
        required: false,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      backgroundColor: "#FFFFFF",
    },
    styling: {
      primaryColor: "#0066CC",
      secondaryColor: "#333333",
      textColor: "#000000",
    },
  },
  {
    id: "single-image-sidebar-3",
    moduleSpecId: "standard-single-image-sidebar",
    name: "Centered Image with Sidebar Below",
    description: "Product image centered, sidebar features below",
    imageSlots: [
      {
        id: "main-image",
        position: { x: 335, y: 0, width: 300, height: 300 },
        required: true,
      },
    ],
    textSlots: [
      {
        id: "headline",
        content: "",
        position: { x: 20, y: 320, width: 930, height: 50 },
        style: {
          fontSize: 32,
          fontWeight: "bold",
          color: "#000000",
          align: "center",
        },
        required: true,
      },
      {
        id: "body-text",
        content: "",
        position: { x: 20, y: 390, width: 450, height: 180 },
        style: {
          fontSize: 16,
          color: "#333333",
          align: "left",
        },
        required: true,
      },
      {
        id: "sidebar-items",
        content: "",
        position: { x: 500, y: 390, width: 450, height: 180 },
        style: {
          fontSize: 14,
          color: "#666666",
          align: "left",
        },
        required: false,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      backgroundColor: "#FFFFFF",
    },
    styling: {
      primaryColor: "#0066CC",
      secondaryColor: "#333333",
      textColor: "#000000",
    },
  },
];

const STANDARD_FOUR_IMAGES_TEXT_TEMPLATES: APLusModuleTemplate[] = [
  {
    id: "four-images-text-1",
    moduleSpecId: "standard-four-images-text",
    name: "Grid Layout",
    description: "Four images in 2x2 grid with text below",
    imageSlots: [
      {
        id: "image-1",
        position: { x: 20, y: 20, width: 220, height: 220 },
        required: true,
      },
      {
        id: "image-2",
        position: { x: 260, y: 20, width: 220, height: 220 },
        required: true,
      },
      {
        id: "image-3",
        position: { x: 500, y: 20, width: 220, height: 220 },
        required: true,
      },
      {
        id: "image-4",
        position: { x: 740, y: 20, width: 220, height: 220 },
        required: true,
      },
    ],
    textSlots: [
      {
        id: "headline",
        content: "",
        position: { x: 20, y: 260, width: 930, height: 50 },
        style: {
          fontSize: 28,
          fontWeight: "bold",
          color: "#000000",
          align: "center",
        },
        required: true,
      },
      {
        id: "body-text",
        content: "",
        position: { x: 20, y: 330, width: 930, height: 250 },
        style: {
          fontSize: 16,
          color: "#333333",
          align: "left",
        },
        required: true,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      backgroundColor: "#FFFFFF",
    },
    styling: {
      primaryColor: "#0066CC",
      secondaryColor: "#333333",
      textColor: "#000000",
    },
  },
  {
    id: "four-images-text-2",
    moduleSpecId: "standard-four-images-text",
    name: "Horizontal Row",
    description: "Four images in horizontal row with text above",
    imageSlots: [
      {
        id: "image-1",
        position: { x: 20, y: 300, width: 220, height: 220 },
        required: true,
      },
      {
        id: "image-2",
        position: { x: 260, y: 300, width: 220, height: 220 },
        required: true,
      },
      {
        id: "image-3",
        position: { x: 500, y: 300, width: 220, height: 220 },
        required: true,
      },
      {
        id: "image-4",
        position: { x: 740, y: 300, width: 220, height: 220 },
        required: true,
      },
    ],
    textSlots: [
      {
        id: "headline",
        content: "",
        position: { x: 20, y: 20, width: 930, height: 50 },
        style: {
          fontSize: 32,
          fontWeight: "bold",
          color: "#000000",
          align: "center",
        },
        required: true,
      },
      {
        id: "body-text",
        content: "",
        position: { x: 20, y: 90, width: 930, height: 190 },
        style: {
          fontSize: 16,
          color: "#333333",
          align: "left",
        },
        required: true,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      backgroundColor: "#FFFFFF",
    },
    styling: {
      primaryColor: "#0066CC",
      secondaryColor: "#333333",
      textColor: "#000000",
    },
  },
  {
    id: "four-images-text-3",
    moduleSpecId: "standard-four-images-text",
    name: "Vertical Stack",
    description: "Images stacked vertically with alternating text",
    imageSlots: [
      {
        id: "image-1",
        position: { x: 20, y: 20, width: 300, height: 300 },
        required: true,
      },
      {
        id: "image-2",
        position: { x: 350, y: 20, width: 300, height: 300 },
        required: true,
      },
      {
        id: "image-3",
        position: { x: 670, y: 20, width: 280, height: 140 },
        required: true,
      },
      {
        id: "image-4",
        position: { x: 670, y: 180, width: 280, height: 140 },
        required: true,
      },
    ],
    textSlots: [
      {
        id: "headline",
        content: "",
        position: { x: 20, y: 340, width: 930, height: 50 },
        style: {
          fontSize: 28,
          fontWeight: "bold",
          color: "#000000",
          align: "center",
        },
        required: true,
      },
      {
        id: "body-text",
        content: "",
        position: { x: 20, y: 410, width: 930, height: 170 },
        style: {
          fontSize: 16,
          color: "#333333",
          align: "left",
        },
        required: true,
      },
    ],
    layout: {
      width: 970,
      height: 600,
      backgroundColor: "#FFFFFF",
    },
    styling: {
      primaryColor: "#0066CC",
      secondaryColor: "#333333",
      textColor: "#000000",
    },
  },
];

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): APLusModuleTemplate | undefined {
  const allTemplates = [
    ...STANDARD_SINGLE_IMAGE_SIDEBAR_TEMPLATES,
    ...STANDARD_FOUR_IMAGES_TEXT_TEMPLATES,
  ];
  return allTemplates.find((t) => t.id === templateId);
}

/**
 * Get templates for a module type
 */
export function getTemplatesForModule(moduleSpecId: string): APLusModuleTemplate[] {
  const allTemplates = [
    ...STANDARD_SINGLE_IMAGE_SIDEBAR_TEMPLATES,
    ...STANDARD_FOUR_IMAGES_TEXT_TEMPLATES,
  ];
  return allTemplates.filter((t) => t.moduleSpecId === moduleSpecId);
}

/**
 * Get random template for a module type
 */
export function getRandomTemplateForModule(moduleSpecId: string): APLusModuleTemplate | undefined {
  const templates = getTemplatesForModule(moduleSpecId);
  if (templates.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * Apply brand kit styling to template
 */
export function applyBrandKitToTemplate(
  template: APLusModuleTemplate,
  brandKit?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  },
): APLusModuleTemplate {
  if (!brandKit) return template;

  return {
    ...template,
    styling: {
      ...template.styling,
      primaryColor: brandKit.primaryColor || template.styling.primaryColor,
      secondaryColor: brandKit.secondaryColor || template.styling.secondaryColor,
      accentColor: brandKit.accentColor || template.styling.accentColor || template.styling.primaryColor,
    },
  };
}

/**
 * All available templates
 */
export const ALL_TEMPLATES: APLusModuleTemplate[] = [
  ...STANDARD_SINGLE_IMAGE_SIDEBAR_TEMPLATES,
  ...STANDARD_FOUR_IMAGES_TEXT_TEMPLATES,
];

