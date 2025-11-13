/**
 * Layout engine for infographic generation
 * Calculates positions, applies brand colors, and generates layout JSON
 */

import { InfographicTemplate } from "./templates/infographicTemplates";

export interface LayoutPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextElement {
  type: "text";
  content: string;
  position: LayoutPosition;
  style: {
    fontSize: number;
    fontFamily?: string;
    color: string;
    fontWeight?: "normal" | "bold";
    align?: "left" | "center" | "right";
  };
  url?: never; // Not used for text elements
}

export interface ImageElement {
  type: "image";
  url: string;
  position: LayoutPosition;
  content?: never; // Not used for image elements
  style?: {
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    fontSize?: never;
    fontFamily?: never;
    color?: never;
    fontWeight?: never;
    align?: never;
  };
}

export type LayoutElement = TextElement | ImageElement;

export interface InfographicLayout {
  width: number;
  height: number;
  elements: LayoutElement[];
  backgroundColor: string;
}

/**
 * Calculate text positions based on template
 */
export function calculateTextPositions(
  template: InfographicTemplate,
  textContent: string[],
  sectionType: "header" | "features" | "cta",
): LayoutPosition[] {
  const section = template.layout.sections.find((s) => s.type === sectionType);
  if (!section) return [];

  const positions: LayoutPosition[] = [];
  const { position } = section;
  const lineHeight = section.style?.fontSize ? section.style.fontSize * 1.5 : 30;
  const padding = 20;

  textContent.forEach((text, index) => {
    positions.push({
      x: position.x + padding,
      y: position.y + padding + index * lineHeight,
      width: position.width - padding * 2,
      height: lineHeight,
    });
  });

  return positions;
}

/**
 * Calculate image/product positions
 */
export function calculateImagePosition(
  template: InfographicTemplate,
  sectionType: "product" = "product",
): LayoutPosition {
  const section = template.layout.sections.find((s) => s.type === sectionType);
  if (!section) {
    // Default position if not found
    return { x: 300, y: 200, width: 400, height: 400 };
  }

  return section.position;
}

/**
 * Apply brand colors to template
 */
export function applyBrandColors(
  template: InfographicTemplate,
  brandKit?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  },
): InfographicTemplate {
  if (!brandKit) return template;

  const updatedSections = template.layout.sections.map((section) => {
    const updatedStyle = { ...section.style };

    // Apply brand colors based on section type
    if (section.type === "header" && brandKit.secondaryColor) {
      updatedStyle.backgroundColor = brandKit.secondaryColor;
      updatedStyle.textColor = "#FFFFFF";
    } else if (section.type === "cta" && brandKit.primaryColor) {
      updatedStyle.backgroundColor = brandKit.primaryColor;
      updatedStyle.textColor = "#FFFFFF";
    }

    return {
      ...section,
      style: updatedStyle,
    };
  });

  return {
    ...template,
    layout: {
      sections: updatedSections,
    },
    colorScheme: {
      ...template.colorScheme,
      primary: brandKit.primaryColor || template.colorScheme.primary,
      secondary: brandKit.secondaryColor || template.colorScheme.secondary,
      accent: brandKit.accentColor || template.colorScheme.accent,
    },
  };
}

/**
 * Generate layout JSON for AI rendering
 */
export function generateLayoutJSON(
  template: InfographicTemplate,
  data: {
    title: string;
    features: Array<{ title: string; description: string }>;
    productImageUrl?: string;
    ctaText?: string;
  },
): InfographicLayout {
  const elements: LayoutElement[] = [];

  // Add title/header
  const headerSection = template.layout.sections.find((s) => s.type === "header");
  if (headerSection) {
      elements.push({
        type: "text",
        content: data.title,
        position: headerSection.position,
        style: {
          fontSize: headerSection.style?.fontSize || 42,
          color: headerSection.style?.textColor || template.colorScheme.text,
          fontWeight: "bold",
          align: "center",
        },
      });
  }

  // Add product image
  if (data.productImageUrl) {
    const productSection = template.layout.sections.find((s) => s.type === "product");
    if (productSection) {
      elements.push({
        type: "image",
        url: data.productImageUrl,
        position: productSection.position,
      });
    }
  }

  // Add features
  const featuresSection = template.layout.sections.find((s) => s.type === "features");
  if (featuresSection) {
    const featurePositions = calculateTextPositions(
      template,
      data.features.flatMap((f) => [f.title, f.description]),
      "features",
    );

    data.features.forEach((feature, index) => {
      const titlePos = featurePositions[index * 2];
      const descPos = featurePositions[index * 2 + 1];

      if (titlePos) {
        elements.push({
          type: "text",
          content: `• ${feature.title}`,
          position: titlePos,
          style: {
            fontSize: featuresSection.style?.fontSize || 22,
            color: featuresSection.style?.textColor || template.colorScheme.text,
            fontWeight: "bold",
            align: "left",
          },
        });
      }

      if (descPos) {
        elements.push({
          type: "text",
          content: feature.description,
          position: descPos,
          style: {
            fontSize: (featuresSection.style?.fontSize || 22) - 4,
            color: featuresSection.style?.textColor || template.colorScheme.text,
            fontWeight: "normal",
            align: "left",
          },
        });
      }
    });
  }

  // Add CTA
  const ctaSection = template.layout.sections.find((s) => s.type === "cta");
  if (ctaSection && data.ctaText) {
    elements.push({
      type: "text",
      content: data.ctaText,
      position: ctaSection.position,
      style: {
        fontSize: ctaSection.style?.fontSize || 28,
        color: ctaSection.style?.textColor || "#FFFFFF",
        fontWeight: "bold",
        align: "center",
      },
    });
  }

  return {
    width: template.width,
    height: template.height,
    elements,
    backgroundColor: template.colorScheme.background,
  };
}

