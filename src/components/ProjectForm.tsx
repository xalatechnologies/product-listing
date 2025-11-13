"use client";

/**
 * Project creation/editing form component
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/react";
import { toast } from "react-toastify";

interface ProjectFormProps {
  projectId?: string;
  initialData?: {
    name: string;
    description?: string;
    productName: string;
    productCategory?: string;
    brandKitId?: string;
  };
  onSuccess?: () => void;
}

export function ProjectForm({ projectId, initialData, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [productName, setProductName] = useState(initialData?.productName || "");
  const [productCategory, setProductCategory] = useState(initialData?.productCategory || "");
  const [brandKitId, setBrandKitId] = useState(initialData?.brandKitId || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: brandKits } = api.brandKit.list.useQuery();

  const utils = api.useUtils();

  const createProject = api.project.create.useMutation({
    onSuccess: (project) => {
      // Invalidate and refetch project list
      void utils.project.list.invalidate();
      toast.success("Project created successfully!");
      router.push(`/projects/${project.id}`);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const updateProject = api.project.update.useMutation({
    onSuccess: (updatedProject) => {
      // Invalidate project list and specific project
      void utils.project.list.invalidate();
      void utils.project.get.invalidate({ id: updatedProject.id });
      toast.success("Project updated successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update project");
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Project name is required";
    } else if (name.length > 255) {
      newErrors.name = "Project name must be 255 characters or less";
    }

    if (!productName.trim()) {
      newErrors.productName = "Product name is required";
    } else if (productName.length > 255) {
      newErrors.productName = "Product name must be 255 characters or less";
    }

    if (description && description.length > 2000) {
      newErrors.description = "Description must be 2000 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (projectId) {
      updateProject.mutate({
        id: projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        productName: productName.trim(),
        productCategory: productCategory.trim() || undefined,
        brandKitId: brandKitId || undefined,
      });
    } else {
      createProject.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        productName: productName.trim(),
        productCategory: productCategory.trim() || undefined,
        brandKitId: brandKitId || undefined,
      });
    }
  };

  const isLoading = createProject.isPending || updateProject.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Project Name <span className="text-red-500">*</span>
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
          placeholder="My Product Listing"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          id="productName"
          type="text"
          value={productName}
          onChange={(e) => {
            setProductName(e.target.value);
            if (errors.productName) {
              setErrors((prev) => ({ ...prev, productName: "" }));
            }
          }}
          required
          maxLength={255}
          className={`mt-1 block w-full rounded-md border ${
            errors.productName
              ? "border-red-500 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          placeholder="Wireless Bluetooth Headphones"
        />
        {errors.productName && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.productName}</p>
        )}
      </div>

      <div>
        <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Product Category (Optional)
        </label>
        <input
          id="productCategory"
          type="text"
          value={productCategory}
          onChange={(e) => setProductCategory(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Electronics > Audio > Headphones"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: "" }));
            }
          }}
          rows={3}
          maxLength={2000}
          className={`mt-1 block w-full rounded-md border ${
            errors.description
              ? "border-red-500 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          placeholder="Brief description of this project..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description.length}/2000 characters
        </p>
      </div>

      <div>
        <label htmlFor="brandKitId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Brand Kit (Optional)
        </label>
        <select
          id="brandKitId"
          value={brandKitId}
          onChange={(e) => setBrandKitId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="">None</option>
          {brandKits?.map((kit) => (
            <option key={kit.id} value={kit.id}>
              {kit.name} {kit.isDefault && "(Default)"}
            </option>
          ))}
        </select>
        {brandKits && brandKits.length === 0 && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No brand kits available.{" "}
            <a href="/brand-kits/new" className="text-blue-600 hover:text-blue-700">
              Create one
            </a>
          </p>
        )}
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
          {isLoading ? "Saving..." : projectId ? "Update Project" : "Create Project"}
        </button>
      </div>
    </form>
  );
}

