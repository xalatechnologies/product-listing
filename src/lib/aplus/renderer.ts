/**
 * A+ Content Module Renderer
 * 
 * Renders A+ content modules as images using Sharp for image compositing
 * and SVG for text rendering.
 */

import sharp from "sharp";
import { APLusModuleTemplate, ImageSlot, TextSlot } from "./templates";

export interface RenderModuleOptions {
  template: APLusModuleTemplate;
  images: Map<string, Buffer>; // Map of image slot ID to image buffer
  texts: Map<string, string>; // Map of text slot ID to text content
  brandKit?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
}

/**
 * Render a complete A+ module as an image
 */
export async function renderModule(options: RenderModuleOptions): Promise<Buffer> {
  const { template, images, texts, brandKit } = options;

  // Step 1: Create base canvas with background color
  const backgroundColor = template.layout.backgroundColor;
  const canvas = sharp({
    create: {
      width: template.layout.width,
      height: template.layout.height,
      channels: 4,
      background: hexToRgba(backgroundColor),
    },
  });

  // Step 2: Prepare compositing operations
  const composites: sharp.OverlayOptions[] = [];

  // Step 3: Render text slots as SVG images
  for (const textSlot of template.textSlots) {
    const textContent = texts.get(textSlot.id) || textSlot.content || "";
    if (!textContent) continue;

    const textImage = await renderTextAsImage(textSlot, textContent, brandKit);
    composites.push({
      input: textImage,
      left: textSlot.position.x,
      top: textSlot.position.y,
    });
  }

  // Step 4: Place images in image slots
  for (const imageSlot of template.imageSlots) {
    const imageBuffer = images.get(imageSlot.id);
    if (!imageBuffer) continue;

    // Resize image to fit slot dimensions
    const resizedImage = await sharp(imageBuffer)
      .resize(imageSlot.position.width, imageSlot.position.height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toBuffer();

    composites.push({
      input: resizedImage,
      left: imageSlot.position.x,
      top: imageSlot.position.y,
    });
  }

  // Step 5: Composite everything together
  const finalImage = await canvas.composite(composites).png().toBuffer();

  return finalImage;
}

/**
 * Render text as an image using SVG
 */
async function renderTextAsImage(
  textSlot: TextSlot,
  textContent: string,
  brandKit?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  },
): Promise<Buffer> {
  const { position, style } = textSlot;

  // Apply brand kit colors if available
  const textColor = brandKit?.primaryColor || style.color || "#000000";
  const fontFamily = brandKit?.fontFamily || style.fontFamily || "Arial, sans-serif";
  const fontSize = style.fontSize || 16;
  const fontWeight = style.fontWeight || "normal";
  const textAlign = style.align || "left";

  // Wrap text to fit width
  const wrappedText = wrapText(textContent, position.width, fontSize);

  // Create SVG with text
  const svg = `
    <svg width="${position.width}" height="${position.height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text {
          font-family: ${fontFamily};
          font-size: ${fontSize}px;
          font-weight: ${fontWeight};
          fill: ${textColor};
          text-anchor: ${textAlign === "center" ? "middle" : textAlign === "right" ? "end" : "start"};
        }
      </style>
      <text x="${textAlign === "center" ? position.width / 2 : textAlign === "right" ? position.width - 10 : 10}" 
            y="${fontSize + 5}" 
            class="text">
        ${wrappedText.split("\n").map((line, i) => 
          `<tspan x="${textAlign === "center" ? position.width / 2 : textAlign === "right" ? position.width - 10 : 10}" 
                   dy="${i === 0 ? 0 : fontSize * 1.2}">${escapeXml(line)}</tspan>`
        ).join("")}
      </text>
    </svg>
  `;

  // Convert SVG to PNG buffer
  const textImage = await sharp(Buffer.from(svg))
    .resize(position.width, position.height)
    .png()
    .toBuffer();

  return textImage;
}

/**
 * Wrap text to fit within specified width
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string {
  const avgCharWidth = fontSize * 0.6; // Approximate character width
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word.length > maxCharsPerLine ? word.substring(0, maxCharsPerLine) : word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Convert hex color to RGBA
 */
function hexToRgba(hex: string): { r: number; g: number; b: number; alpha?: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1]!, 16),
      g: parseInt(result[2]!, 16),
      b: parseInt(result[3]!, 16),
      alpha: result[4] ? parseInt(result[4]!, 16) / 255 : 1,
    };
  }
  // Default to white if invalid hex
  return { r: 255, g: 255, b: 255, alpha: 1 };
}

/**
 * Download image from URL and return as buffer
 */
export async function downloadImageAsBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Resize image to fit dimensions while maintaining aspect ratio
 */
export async function resizeImageToFit(
  imageBuffer: Buffer,
  width: number,
  height: number,
  fit: "contain" | "cover" = "contain",
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(width, height, {
      fit,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .toBuffer();
}

