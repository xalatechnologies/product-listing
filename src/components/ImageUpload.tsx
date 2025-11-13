"use client";

/**
 * Image upload component with drag & drop support
 */

import { useState, useRef } from "react";
import Image from "next/image";
import { api } from "@/lib/trpc/react";
import { toast } from "react-toastify";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  projectId: string;
  onUploadComplete?: (image: { url: string; id: string }) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function ImageUpload({
  projectId,
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();
  const uploadImage = api.image.upload.useMutation({
    onSuccess: () => {
      // Invalidate product images list
      void utils.image.listProductImages.invalidate({ projectId });
    },
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).slice(0, maxFiles);
    setUploading(true);

    try {
      for (const file of fileArray) {
        // Validate file type
        if (!acceptedTypes.includes(file.type)) {
          toast.error(`${file.name} is not a supported image type. Only JPEG, PNG, and WebP are allowed.`);
          continue;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast.error(`${file.name} is too large. Maximum file size is 10MB.`);
          continue;
        }

        await uploadFile(file);
      }
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      formData.append("type", "product");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();

      // Create database record
      const image = await uploadImage.mutateAsync({
        projectId,
        url: data.url,
        width: data.width,
        height: data.height,
        size: data.size,
        order: 0,
      });

      toast.success(`${file.name} uploaded successfully`);
      onUploadComplete?.(image);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
      throw error; // Re-throw to allow handleFileSelect to handle it
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gray-200 dark:bg-gray-700 p-4">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            ) : (
              <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {uploading ? "Uploading..." : "Drag & drop images here"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              or click to browse (JPEG, PNG, WebP - max {maxFiles} files)
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Files
          </button>
        </div>
      </div>
    </div>
  );
}

interface ImagePreviewProps {
  images: Array<{ id: string; url: string; width?: number; height?: number }>;
  onDelete?: (id: string) => void;
  deletable?: boolean;
}

export function ImagePreview({ images, onDelete, deletable = true }: ImagePreviewProps) {
  const utils = api.useUtils();
  const deleteImage = api.image.deleteProductImage.useMutation({
    onSuccess: () => {
      // Invalidate product images list (need projectId from images)
      if (images.length > 0) {
        // Extract projectId from first image URL or pass as prop
        // For now, invalidate all image queries
        void utils.image.listProductImages.invalidate();
      }
      toast.success("Image deleted");
      onDelete?.("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete image");
    },
  });

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <div key={image.id} className="relative group">
          <div className="relative w-full h-48 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              src={image.url}
              alt="Product"
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          </div>
          {deletable && (
            <button
              onClick={() => deleteImage.mutate({ id: image.id })}
              disabled={deleteImage.isPending}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

