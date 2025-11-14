/**
 * Supabase Storage utilities for file upload and management.
 *
 * Handles:
 * - Image uploads (product images, generated images)
 * - File organization by user/project
 * - Public and private file access
 * - File deletion
 */

import { supabaseAdmin } from "./supabase/server";

export type StorageBucket = "product-images" | "generated-images" | "brand-kits" | "exports";

/**
 * Upload a file to Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path within bucket (e.g., "userId/projectId/filename.jpg")
 * @param file - File buffer, blob, or file object
 * @param options - Upload options
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: Buffer | Blob | File | Uint8Array,
  options?: {
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
  },
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      cacheControl: options?.cacheControl || "3600",
      upsert: options?.upsert ?? false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  if (!urlData?.publicUrl) {
    throw new Error("Failed to get public URL for uploaded file");
  }

  return urlData.publicUrl;
}

/**
 * Upload a product image
 * @param userId - User ID
 * @param projectId - Project ID
 * @param file - Image file
 * @param filename - Original filename
 * @returns Public URL of uploaded image
 */
export async function uploadProductImage(
  userId: string,
  projectId: string,
  file: Buffer | Blob | File,
  filename: string,
): Promise<string> {
  const extension = filename.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const path = `${userId}/${projectId}/${timestamp}-${filename}`;

  return uploadFile("product-images", path, file, {
    contentType: `image/${extension === "jpg" ? "jpeg" : extension}`,
  });
}

/**
 * Upload a generated image
 * @param userId - User ID
 * @param projectId - Project ID
 * @param imageType - Type of generated image
 * @param file - Image file
 * @param style - Optional style identifier
 * @returns Public URL of uploaded image
 */
export async function uploadGeneratedImage(
  userId: string,
  projectId: string,
  imageType: string,
  file: Buffer | Blob | File,
  style?: string,
): Promise<string> {
  const extension = "png"; // Generated images are typically PNG
  const timestamp = Date.now();
  const styleSuffix = style ? `-${style}` : "";
  const filename = `${imageType}${styleSuffix}-${timestamp}.${extension}`;
  const path = `${userId}/${projectId}/${filename}`;

  return uploadFile("generated-images", path, file, {
    contentType: "image/png",
  });
}

/**
 * Upload a brand kit asset (logo)
 * @param userId - User ID
 * @param brandKitId - Brand kit ID
 * @param file - Image file
 * @returns Public URL of uploaded logo
 */
export async function uploadBrandKitLogo(
  userId: string,
  brandKitId: string,
  file: Buffer | Blob | File,
): Promise<string> {
  const path = `${userId}/${brandKitId}/logo.png`;

  return uploadFile("brand-kits", path, file, {
    contentType: "image/png",
    upsert: true, // Replace if exists
  });
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Get a signed URL for private file access (valid for 1 hour)
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @param expiresIn - Expiration time in seconds (default: 3600)
 * @returns Signed URL
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message || "Unknown error"}`);
  }

  return data.signedUrl;
}

/**
 * List files in a bucket path
 * @param bucket - Storage bucket name
 * @param path - Path prefix to list
 * @returns Array of file objects
 */
export async function listFiles(bucket: StorageBucket, path: string) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(path);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data;
}

/**
 * Delete all files in a project directory
 * @param userId - User ID
 * @param projectId - Project ID
 * @param bucket - Storage bucket
 */
export async function deleteProjectFiles(
  userId: string,
  projectId: string,
  bucket: StorageBucket,
): Promise<void> {
  const path = `${userId}/${projectId}`;
  const files = await listFiles(bucket, path);

  if (files.length > 0) {
    const filePaths = files.map((file) => `${path}/${file.name}`);
    const { error } = await supabaseAdmin.storage.from(bucket).remove(filePaths);

    if (error) {
      throw new Error(`Failed to delete project files: ${error.message}`);
    }
  }
}

/**
 * Extract storage path from Supabase Storage URL
 * @param url - Full Supabase Storage URL
 * @returns Storage path (e.g., "userId/projectId/filename.jpg")
 */
export function extractPathFromUrl(url: string): string {
  try {
    // Supabase Storage URLs format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const bucketIndex = pathParts.indexOf("public");
    
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      throw new Error("Invalid Supabase Storage URL format");
    }
    
    // Extract path after "public/<bucket>/"
    const path = pathParts.slice(bucketIndex + 2).join("/");
    return path;
  } catch (error) {
    // If URL parsing fails, try to extract path manually
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (match) {
      return match[1];
    }
    throw new Error(`Failed to extract path from URL: ${url}`);
  }
}
