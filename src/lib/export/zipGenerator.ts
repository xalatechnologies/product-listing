/**
 * ZIP Generation Utility
 * 
 * Creates ZIP files from image URLs for marketplace exports
 */

import JSZip from "jszip";
import { downloadImage } from "./imageResize";

export interface ImageFile {
  url: string;
  filename: string;
  buffer?: Buffer; // Optional: pre-downloaded buffer
}

/**
 * Create ZIP file from image URLs
 */
export async function createZipFromImages(
  images: ImageFile[],
  zipFilename: string = "export.zip",
): Promise<Buffer> {
  const zip = new JSZip();

  // Download and add each image to the ZIP
  for (const image of images) {
    let buffer: Buffer;
    if (image.buffer) {
      buffer = image.buffer;
    } else {
      buffer = await downloadImage(image.url);
    }
    zip.file(image.filename, buffer);
  }

  // Generate ZIP buffer
  return await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6, // Balance between size and speed
    },
  });
}

/**
 * Create ZIP file from image buffers (already downloaded)
 */
export async function createZipFromBuffers(
  files: Array<{ filename: string; buffer: Buffer }>,
  zipFilename: string = "export.zip",
): Promise<Buffer> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.filename, file.buffer);
  }

  return await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
  });
}

/**
 * Format filename according to marketplace naming convention
 */
export function formatFilename(
  pattern: string,
  index: number,
  productName?: string,
): string {
  let filename = pattern;

  // Replace {index} placeholder
  filename = filename.replace("{index}", index.toString());

  // Replace {product} placeholder with sanitized product name
  if (productName) {
    const sanitized = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    filename = filename.replace("{product}", sanitized);
  }

  return filename;
}

