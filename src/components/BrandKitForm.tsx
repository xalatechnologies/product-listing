"use client";

/**
 * Brand kit creation/editing form component
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { toast } from "react-toastify";
import { ColorPicker } from "./ColorPicker";
import { Upload } from "lucide-react";

interface BrandKitFormProps {
  brandKitId?: string;
  initialData?: {
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
  onSuccess?: () => void;
}

export function BrandKitForm({ brandKitId, initialData, onSuccess }: BrandKitFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialData?.name || "");
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "");
  const [primaryColor, setPrimaryColor] = useState(initialData?.primaryColor || "");
  const [secondaryColor, setSecondaryColor] = useState(initialData?.secondaryColor || "");
  const [accentColor, setAccentColor] = useState(initialData?.accentColor || "");
  const [fontFamily, setFontFamily] = useState(initialData?.fontFamily || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createBrandKit = api.brandKit.create.useMutation({
    onSuccess: (brandKit) => {
      toast.success("Brand kit created successfully!");
      router.push(`/brand-kits/${brandKit.id}`);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create brand kit");
    },
  });

  const updateBrandKit = api.brandKit.update.useMutation({
    onSuccess: () => {
      toast.success("Brand kit updated successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update brand kit");
    },
  });

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "brand-kit");
      if (brandKitId) {
        formData.append("brandKitId", brandKitId);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setLogoUrl(data.url);
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Brand kit name is required";
    } else if (name.length > 255) {
      newErrors.name = "Brand kit name must be 255 characters or less";
    }

    if (logoUrl && logoUrl.trim()) {
      try {
        new URL(logoUrl);
      } catch {
        newErrors.logoUrl = "Logo URL must be a valid URL";
      }
    }

    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      newErrors.primaryColor = "Primary color must be a valid hex color (e.g., #FF0000)";
    }
    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      newErrors.secondaryColor = "Secondary color must be a valid hex color (e.g., #00FF00)";
    }
    if (accentColor && !hexColorRegex.test(accentColor)) {
      newErrors.accentColor = "Accent color must be a valid hex color (e.g., #0000FF)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data = {
      name: name.trim(),
      logoUrl: logoUrl.trim() || undefined,
      primaryColor: primaryColor || undefined,
      secondaryColor: secondaryColor || undefined,
      accentColor: accentColor || undefined,
      fontFamily: fontFamily.trim() || undefined,
    };

    if (brandKitId) {
      updateBrandKit.mutate({
        id: brandKitId,
        ...data,
      });
    } else {
      createBrandKit.mutate(data);
    }
  };

  const isLoading = createBrandKit.isPending || updateBrandKit.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Brand Kit Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: "" }));
            }
          }}
          required
          maxLength={255}
          className={`mt-1 block w-full rounded-md border ${
            errors.name
              ? "border-red-500 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          placeholder="My Brand Kit"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Logo
        </label>
        {logoUrl ? (
          <div className="flex items-center gap-4">
            <img
              src={logoUrl}
              alt="Brand logo"
              className="h-20 w-20 object-contain rounded border border-gray-300 dark:border-gray-600"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {uploadingLogo ? "Uploading..." : "Change Logo"}
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploadingLogo ? "Uploading..." : "Upload Logo"}
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLogoUpload(file);
          }}
          className="hidden"
        />
      </div>

      <div>
        <ColorPicker
          label="Primary Color"
          value={primaryColor}
          onChange={(value) => {
            setPrimaryColor(value);
            if (errors.primaryColor) {
              setErrors((prev) => ({ ...prev, primaryColor: "" }));
            }
          }}
        />
        {errors.primaryColor && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.primaryColor}</p>
        )}
      </div>

      <div>
        <ColorPicker
          label="Secondary Color"
          value={secondaryColor}
          onChange={(value) => {
            setSecondaryColor(value);
            if (errors.secondaryColor) {
              setErrors((prev) => ({ ...prev, secondaryColor: "" }));
            }
          }}
        />
        {errors.secondaryColor && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.secondaryColor}</p>
        )}
      </div>

      <div>
        <ColorPicker
          label="Accent Color"
          value={accentColor}
          onChange={(value) => {
            setAccentColor(value);
            if (errors.accentColor) {
              setErrors((prev) => ({ ...prev, accentColor: "" }));
            }
          }}
        />
        {errors.accentColor && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.accentColor}</p>
        )}
      </div>

      <div>
        <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Font Family (Optional)
        </label>
        <input
          id="fontFamily"
          type="text"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Arial, sans-serif"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : brandKitId ? "Update Brand Kit" : "Create Brand Kit"}
        </button>
      </div>
    </form>
  );
}

