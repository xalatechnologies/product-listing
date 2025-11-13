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
  };
  onSuccess?: () => void;
}

export function ProjectForm({ projectId, initialData, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [productName, setProductName] = useState(initialData?.productName || "");
  const [productCategory, setProductCategory] = useState(initialData?.productCategory || "");

  const createProject = api.project.create.useMutation({
    onSuccess: (project) => {
      toast.success("Project created successfully!");
      router.push(`/projects/${project.id}`);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const updateProject = api.project.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update project");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (projectId) {
      updateProject.mutate({
        id: projectId,
        name,
        description: description || undefined,
        productName,
        productCategory: productCategory || undefined,
      });
    } else {
      createProject.mutate({
        name,
        description: description || undefined,
        productName,
        productCategory: productCategory || undefined,
      });
    }
  };

  const isLoading = createProject.isPending || updateProject.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Project Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="My Product Listing"
        />
      </div>

      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Product Name
        </label>
        <input
          id="productName"
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Wireless Bluetooth Headphones"
        />
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
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Brief description of this project..."
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
          {isLoading ? "Saving..." : projectId ? "Update Project" : "Create Project"}
        </button>
      </div>
    </form>
  );
}

