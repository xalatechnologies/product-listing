/**
 * Infographic template definitions for Amazon product listings
 * 
 * Amazon infographic best practices:
 * - Width: 1000px (standard)
 * - Height: Variable (typically 1000-2000px)
 * - Clear hierarchy: Title → Features → Call to action
 * - High contrast text for readability
 * - Product image prominently displayed
 * - Feature icons or bullets
 * - Brand colors (if applicable)
 */

export interface InfographicTemplate {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  layout: {
    sections: Array<{
      type: "header" | "features" | "product" | "cta" | "specs";
      position: { x: number; y: number; width: number; height: number };
      style?: {
        backgroundColor?: string;
        textColor?: string;
        fontSize?: number;
        fontFamily?: string;
      };
    }>;
  };
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export const infographicTemplates: InfographicTemplate[] = [
  {
    id: "vertical-features",
    name: "Vertical Features Layout",
    description: "Features listed vertically with product image on top",
    width: 1000,
    height: 1500,
    layout: {
      sections: [
        {
          type: "header",
          position: { x: 0, y: 0, width: 1000, height: 150 },
          style: {
            backgroundColor: "#FFFFFF",
            textColor: "#000000",
            fontSize: 48,
          },
        },
        {
          type: "product",
          position: { x: 250, y: 150, width: 500, height: 500 },
        },
        {
          type: "features",
          position: { x: 100, y: 700, width: 800, height: 600 },
          style: {
            textColor: "#333333",
            fontSize: 24,
          },
        },
        {
          type: "cta",
          position: { x: 0, y: 1350, width: 1000, height: 150 },
          style: {
            backgroundColor: "#FF9900",
            textColor: "#FFFFFF",
            fontSize: 32,
          },
        },
      ],
    },
    colorScheme: {
      primary: "#FF9900",
      secondary: "#232F3E",
      accent: "#FFD700",
      background: "#FFFFFF",
      text: "#000000",
    },
  },
  {
    id: "split-screen",
    name: "Split Screen Layout",
    description: "Product image on left, features on right",
    width: 1000,
    height: 1200,
    layout: {
      sections: [
        {
          type: "header",
          position: { x: 0, y: 0, width: 1000, height: 120 },
          style: {
            backgroundColor: "#232F3E",
            textColor: "#FFFFFF",
            fontSize: 42,
          },
        },
        {
          type: "product",
          position: { x: 50, y: 150, width: 450, height: 900 },
        },
        {
          type: "features",
          position: { x: 550, y: 150, width: 400, height: 900 },
          style: {
            textColor: "#333333",
            fontSize: 22,
          },
        },
        {
          type: "cta",
          position: { x: 0, y: 1100, width: 1000, height: 100 },
          style: {
            backgroundColor: "#FF9900",
            textColor: "#FFFFFF",
            fontSize: 28,
          },
        },
      ],
    },
    colorScheme: {
      primary: "#FF9900",
      secondary: "#232F3E",
      accent: "#FFD700",
      background: "#FFFFFF",
      text: "#000000",
    },
  },
  {
    id: "grid-layout",
    name: "Grid Layout",
    description: "Features in a grid with product image center",
    width: 1000,
    height: 1600,
    layout: {
      sections: [
        {
          type: "header",
          position: { x: 0, y: 0, width: 1000, height: 140 },
          style: {
            backgroundColor: "#FFFFFF",
            textColor: "#000000",
            fontSize: 44,
          },
        },
        {
          type: "product",
          position: { x: 300, y: 180, width: 400, height: 400 },
        },
        {
          type: "features",
          position: { x: 50, y: 620, width: 900, height: 800 },
          style: {
            textColor: "#333333",
            fontSize: 20,
          },
        },
        {
          type: "specs",
          position: { x: 0, y: 1450, width: 1000, height: 150 },
          style: {
            backgroundColor: "#F5F5F5",
            textColor: "#666666",
            fontSize: 18,
          },
        },
      ],
    },
    colorScheme: {
      primary: "#0066CC",
      secondary: "#333333",
      accent: "#FF6600",
      background: "#FFFFFF",
      text: "#000000",
    },
  },
];

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): InfographicTemplate | undefined {
  return infographicTemplates.find((t) => t.id === templateId);
}

/**
 * Get random template
 */
export function getRandomTemplate(): InfographicTemplate {
  const randomIndex = Math.floor(Math.random() * infographicTemplates.length);
  return infographicTemplates[randomIndex]!;
}

/**
 * Apply brand kit colors to template
 */
export function applyBrandKitToTemplate(
  template: InfographicTemplate,
  brandKit?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  },
): InfographicTemplate {
  if (!brandKit) return template;

  return {
    ...template,
    colorScheme: {
      ...template.colorScheme,
      primary: brandKit.primaryColor || template.colorScheme.primary,
      secondary: brandKit.secondaryColor || template.colorScheme.secondary,
      accent: brandKit.accentColor || template.colorScheme.accent,
    },
  };
}

