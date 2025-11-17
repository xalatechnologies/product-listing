"use client";

/**
 * Image upload component with drag & drop support and upload progress tracking
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

interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  speed: number; // bytes per second
  loaded: number; // bytes loaded
  total: number; // total bytes
}

export function ImageUpload({
  projectId,
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadStartTimes = useRef<Map<string, number>>(new Map());

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
    setUploadProgress(new Map());

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
      setUploadProgress(new Map());
      uploadStartTimes.current.clear();
    }
  };

  const uploadFile = async (file: File): Promise<void> => {
    const fileName = file.name;
    const startTime = Date.now();
    uploadStartTimes.current.set(fileName, startTime);

    // Initialize progress
    setUploadProgress((prev) => {
      const newMap = new Map(prev);
      newMap.set(fileName, {
        fileName,
        progress: 0,
        speed: 0,
        loaded: 0,
        total: file.size,
      });
      return newMap;
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      formData.append("type", "product");

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          const elapsed = (Date.now() - startTime) / 1000; // seconds
          const speed = elapsed > 0 ? e.loaded / elapsed : 0; // bytes per second

          setUploadProgress((prev) => {
            const newMap = new Map(prev);
            newMap.set(fileName, {
              fileName,
              progress,
              speed,
              loaded: e.loaded,
              total: e.total,
            });
            return newMap;
          });
        }
      });

      // Handle completion
      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);

            // Create database record
            const image = await uploadImage.mutateAsync({
              projectId,
              url: data.url,
              width: data.width,
              height: data.height,
              size: data.size,
              order: 0,
            });

            // Remove from progress tracking
            setUploadProgress((prev) => {
              const newMap = new Map(prev);
              newMap.delete(fileName);
              return newMap;
            });
            uploadStartTimes.current.delete(fileName);

            toast.success(`${file.name} uploaded successfully`);
            onUploadComplete?.(image);
            resolve();
          } catch (error) {
            console.error("Upload error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to upload image");
            reject(error);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            throw new Error(error.error || "Upload failed");
          } catch (parseError) {
            throw new Error("Upload failed");
          }
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        uploadStartTimes.current.delete(fileName);
        setUploadProgress((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileName);
          return newMap;
        });
        toast.error(`Failed to upload ${file.name}`);
        reject(new Error("Network error"));
      });

      // Handle abort
      xhr.addEventListener("abort", () => {
        uploadStartTimes.current.delete(fileName);
        setUploadProgress((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileName);
          return newMap;
        });
        reject(new Error("Upload cancelled"));
      });

      // Send request
      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) {
      return `${Math.round(bytesPerSecond)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    <div className="w-full space-y-4">
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

      {/* Upload Progress Indicators */}
      {uploadProgress.size > 0 && (
        <div className="space-y-3">
          {Array.from(uploadProgress.values()).map((progress) => (
            <div
              key={progress.fileName}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1 mr-2">
                  {progress.fileName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {progress.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}
                </span>
                {progress.speed > 0 && (
                  <span className="text-blue-600 dark:text-blue-400">{formatSpeed(progress.speed)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
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

  const handleImageError = (imageId: string, imageUrl: string) => {
    console.error(`Failed to load image ${imageId}:`, imageUrl);
    setImageErrors((prev) => new Set(prev).add(imageId));
  };

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
      {images.map((image) => {
        const hasError = imageErrors.has(image.id);
        
        return (
          <div key={image.id} className="relative group">
            <div className="relative w-full h-48 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800">
              {hasError ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">Failed to load</p>
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                  >
                    Open URL
                  </a>
                </div>
              ) : (
                <Image
                  src={image.url}
                  alt="Product"
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                  loading="lazy"
                  onError={() => handleImageError(image.id, image.url)}
                  unoptimized={image.url.startsWith("data:") || image.url.includes("supabase")}
                />
              )}
            </div>
            {deletable && !hasError && (
              <button
                onClick={() => deleteImage.mutate({ id: image.id })}
                disabled={deleteImage.isPending}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

