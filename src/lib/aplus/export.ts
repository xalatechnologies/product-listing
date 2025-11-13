/**
 * A+ Content Export Service
 * 
 * Exports A+ content modules as images and creates ZIP files
 */

import archiver from "archiver";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { renderModule, downloadImageAsBuffer } from "./renderer";
import { getTemplate } from "./templates";
import { uploadFile, getSignedUrl } from "@/lib/storage";

export interface ExportAPlusOptions {
  projectId: string;
  userId: string;
  format: "png" | "jpg";
}

export interface ExportResult {
  downloadUrl: string;
  fileSize: number;
  moduleCount: number;
}

/**
 * Export all A+ modules for a project as images in a ZIP file
 */
export async function exportAPlusContent(options: ExportAPlusOptions): Promise<ExportResult> {
  const { projectId, userId, format } = options;

  // Step 1: Get A+ content and project data
  const aPlusContent = await prisma.aPlusContent.findUnique({
    where: { projectId },
    include: {
      project: {
        include: {
          brandKit: true,
          productImages: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!aPlusContent) {
    throw new Error("A+ content not found");
  }

  const modules = aPlusContent.modules as any[];
  if (!modules || modules.length === 0) {
    throw new Error("No modules to export");
  }

  // Step 2: Render each module as an image
  const moduleImages: Array<{ filename: string; buffer: Buffer }> = [];

  for (let i = 0; i < modules.length; i++) {
    const module = modules[i]!;
    const template = getTemplate(module.templateId || `default-${module.type}`);

    if (!template) {
      console.warn(`Template not found for module ${i + 1}, skipping`);
      continue;
    }

    // Prepare images map
    const images = new Map<string, Buffer>();
    if (aPlusContent.project.productImages && aPlusContent.project.productImages.length > 0) {
      // Use product images for image slots
      for (const imageSlot of template.imageSlots) {
        const productImage = aPlusContent.project.productImages[0]!;
        try {
          const imageBuffer = await downloadImageAsBuffer(productImage.url);
          images.set(imageSlot.id, imageBuffer);
        } catch (error) {
          console.error(`Failed to download image for slot ${imageSlot.id}:`, error);
        }
      }
    }

    // Prepare texts map - map to text slot IDs from template
    const texts = new Map<string, string>();
    if (module.content) {
      // Map content to template text slot IDs
      for (const textSlot of template.textSlots) {
        if (textSlot.id === "headline" && module.content.headline) {
          texts.set(textSlot.id, module.content.headline);
        } else if (textSlot.id === "body-text" && module.content.bodyText) {
          texts.set(textSlot.id, module.content.bodyText);
        } else if (textSlot.id.includes("bullet") && module.content.bullets) {
          texts.set(textSlot.id, module.content.bullets.join("\n• "));
        } else if (textSlot.id.includes("sidebar") && module.content.sidebar) {
          texts.set(textSlot.id, module.content.sidebar.join("\n"));
        } else if (textSlot.id.includes("spec") && module.content.specifications) {
          const specs = module.content.specifications as Record<string, string>;
          texts.set(textSlot.id, Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join("\n"));
        } else if (textSlot.content) {
          // Use default content from template if available
          texts.set(textSlot.id, textSlot.content);
        }
      }
    }

    // Render module
    try {
      const moduleImage = await renderModule({
        template,
        images,
        texts,
        brandKit: aPlusContent.project.brandKit
          ? {
              primaryColor: aPlusContent.project.brandKit.primaryColor || undefined,
              secondaryColor: aPlusContent.project.brandKit.secondaryColor || undefined,
              accentColor: aPlusContent.project.brandKit.accentColor || undefined,
              fontFamily: aPlusContent.project.brandKit.fontFamily || undefined,
            }
          : undefined,
      });

      // Convert to requested format
      const finalImage =
        format === "jpg"
          ? await sharp(moduleImage).jpeg({ quality: 90 }).toBuffer()
          : moduleImage;

      const filename = `module-${i + 1}-${module.type}.${format}`;
      moduleImages.push({ filename, buffer: finalImage });
    } catch (error) {
      console.error(`Failed to render module ${i + 1}:`, error);
      // Continue with other modules
    }
  }

  if (moduleImages.length === 0) {
    throw new Error("No modules were successfully rendered");
  }

  // Step 3: Create ZIP file
  const zipBuffer = await createZipFile(moduleImages);

  // Step 4: Upload ZIP to Supabase Storage
  const zipFilename = `aplus-export-${projectId}-${Date.now()}.zip`;
  const zipPath = `${userId}/${projectId}/${zipFilename}`;

  const zipUrl = await uploadFile("exports", zipPath, zipBuffer, {
    contentType: "application/zip",
    upsert: false,
  });

  // Step 5: Generate signed download URL
  const downloadUrl = await getSignedUrl("exports", zipPath, 3600); // 1 hour expiry

  return {
    downloadUrl,
    fileSize: zipBuffer.length,
    moduleCount: moduleImages.length,
  };
}

/**
 * Create ZIP file from module images
 */
async function createZipFile(
  moduleImages: Array<{ filename: string; buffer: Buffer }>,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    archive.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on("error", (error) => {
      reject(error);
    });

    // Add each module image to the ZIP
    for (const { filename, buffer } of moduleImages) {
      archive.append(buffer, { name: filename });
    }

    archive.finalize();
  });
}

