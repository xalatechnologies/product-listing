/**
 * Background removal service integration
 * 
 * Uses Remove.bg API for background removal
 * Alternative: Replicate API or custom ML model
 */

const REMOVEBG_API_KEY = process.env.REMOVEBG_API_KEY;
const REMOVEBG_API_URL = "https://api.remove.bg/v1.0/removebg";

export interface BackgroundRemovalResult {
  imageBuffer: Buffer;
  width: number;
  height: number;
}

/**
 * Remove background from an image using Remove.bg API
 * @param imageUrl - URL of the image to process
 * @returns Processed image buffer and dimensions
 */
export async function removeBackground(
  imageUrl: string,
): Promise<BackgroundRemovalResult> {
  if (!REMOVEBG_API_KEY) {
    throw new Error("REMOVEBG_API_KEY environment variable is not set");
  }

  // Download the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.statusText}`);
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  // Call Remove.bg API
  const formData = new FormData();
  const blob = new Blob([imageBuffer]);
  formData.append("image_file", blob);
  formData.append("size", "auto");

  const response = await fetch(REMOVEBG_API_URL, {
    method: "POST",
    headers: {
      "X-Api-Key": REMOVEBG_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Background removal failed: ${error.errors?.[0]?.title || response.statusText}`,
    );
  }

  const resultBuffer = Buffer.from(await response.arrayBuffer());

  // Get image dimensions (simplified - in production, use sharp or similar)
  // For now, we'll return the buffer and let the caller handle dimensions
  return {
    imageBuffer: resultBuffer,
    width: 0, // Will be set by caller using image processing library
    height: 0, // Will be set by caller using image processing library
  };
}

/**
 * Alternative: Use Replicate API for background removal
 * This is a placeholder for future implementation
 */
export async function removeBackgroundReplicate(
  imageUrl: string,
): Promise<BackgroundRemovalResult> {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN environment variable is not set");
  }

  // Download the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.statusText}`);
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const base64Image = imageBuffer.toString("base64");

  // Call Replicate API
  // Using background-removal model: https://replicate.com/cjwbw/rembg
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", // rembg model version
      input: {
        image: `data:image/png;base64,${base64Image}`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Replicate API failed: ${error.detail || response.statusText}`,
    );
  }

  const prediction = await response.json();
  
  // Poll for completion
  let result = prediction;
  while (result.status === "starting" || result.status === "processing") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      },
    });
    result = await statusResponse.json();
  }

  if (result.status === "failed" || !result.output) {
    throw new Error(`Replicate prediction failed: ${result.error || "Unknown error"}`);
  }

  // Download result image
  const resultImageResponse = await fetch(result.output);
  if (!resultImageResponse.ok) {
    throw new Error(`Failed to download result image: ${resultImageResponse.statusText}`);
  }

  const resultBuffer = Buffer.from(await resultImageResponse.arrayBuffer());

  return {
    imageBuffer: resultBuffer,
    width: 0, // Will be set by caller using image processing library
    height: 0, // Will be set by caller using image processing library
  };
}

