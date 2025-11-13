/**
 * File upload API endpoint
 * Handles multipart form data uploads to Supabase Storage
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { uploadProductImage, uploadBrandKitLogo } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const brandKitId = formData.get("brandKitId") as string | null;
    const type = formData.get("type") as string | null; // "product" | "brand-kit"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 },
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 },
      );
    }

    const userId = session.user.id;
    let url: string;
    let width = 0;
    let height = 0;

    // Get image dimensions
    try {
      const imageBitmap = await createImageBitmap(file);
      width = imageBitmap.width;
      height = imageBitmap.height;
      imageBitmap.close();
    } catch (error) {
      console.error("Failed to get image dimensions:", error);
    }

    // Upload based on type
    if (type === "brand-kit" && brandKitId) {
      url = await uploadBrandKitLogo(userId, brandKitId, file);
    } else if (projectId) {
      url = await uploadProductImage(userId, projectId, file, file.name);
    } else {
      return NextResponse.json(
        { error: "projectId or brandKitId required" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      url,
      width,
      height,
      size: file.size,
      filename: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
