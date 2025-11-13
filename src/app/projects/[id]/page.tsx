"use client";

/**
 * Project detail page - view and manage a specific project
 */

import { use } from "react";
import { api } from "@/lib/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Download, Sparkles } from "lucide-react";
import { ImageUpload, ImagePreview } from "@/components/ImageUpload";
import { toast } from "react-toastify";
import { ImageType } from "@prisma/client";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const projectId = resolvedParams.id;

  const { data: project, isLoading } = api.project.get.useQuery({ id: projectId });
  const { data: productImages } = api.image.listProductImages.useQuery({ projectId });
  const { data: generatedImages } = api.image.list.useQuery({ projectId });

  const generateImage = api.image.generate.useMutation({
    onSuccess: () => {
      toast.success("Image generation started! Check back in a few moments.");
      // Refetch generated images after a delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate image");
    },
  });

  const deleteProject = api.project.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProject.mutate({ id: projectId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Project not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{project.productName}</p>
            {project.description && (
              <p className="text-gray-500 dark:text-gray-500 mt-2">{project.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              href={`/projects/${projectId}/edit`}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-8">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            project.status === "COMPLETED"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : project.status === "PROCESSING"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : project.status === "FAILED"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          }`}
        >
          {project.status}
        </span>
      </div>

      {/* Product Images Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Product Images
          </h2>
          {productImages && productImages.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {productImages.length} image{productImages.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {productImages && productImages.length > 0 ? (
          <div className="mb-6">
            <ImagePreview images={productImages} />
          </div>
        ) : null}

        <ImageUpload
          projectId={projectId}
          onUploadComplete={() => {
            // Refetch images
            window.location.reload();
          }}
        />
      </div>

      {/* Generated Images Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Generated Listing Images
          </h2>
          {generatedImages && generatedImages.length > 0 && (
            <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Download className="h-4 w-4" />
              Download All
            </button>
          )}
        </div>

        {generatedImages && generatedImages.length > 0 ? (
          <ImagePreview images={generatedImages} deletable={false} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Sparkles className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No generated images yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Upload product images above, then generate your listing images
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  if (!productImages || productImages.length === 0) {
                    toast.error("Please upload at least one product image first");
                    return;
                  }
                  generateImage.mutate({
                    projectId,
                    type: ImageType.MAIN_IMAGE,
                  });
                }}
                disabled={generateImage.isPending || !productImages || productImages.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                {generateImage.isPending ? "Generating..." : "Generate Main Image"}
              </button>
              <button
                onClick={() => {
                  if (!productImages || productImages.length === 0) {
                    toast.error("Please upload at least one product image first");
                    return;
                  }
                  generateImage.mutate({
                    projectId,
                    type: ImageType.INFOGRAPHIC,
                  });
                }}
                disabled={generateImage.isPending || !productImages || productImages.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                {generateImage.isPending ? "Generating..." : "Generate Infographic"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Project Information
        </h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {project.productName}
            </dd>
          </div>
          {project.productCategory && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {project.productCategory}
              </dd>
            </div>
          )}
          {project.brandKit && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand Kit</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                <Link
                  href={`/brand-kits/${project.brandKit.id}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {project.brandKit.name}
                </Link>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {new Date(project.createdAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {new Date(project.updatedAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

