"use client";

/**
 * Project detail page - view and manage a specific project
 */

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Download, Sparkles, FileText, Zap, X } from "lucide-react";
import { ImageUpload, ImagePreview } from "@/components/ImageUpload";
import { toast } from "react-toastify";
import { ImageType } from "@prisma/client";
import { subscribeToProjectStatus, subscribeToGeneratedImages } from "@/lib/supabase/realtime";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { JobStatus } from "@/components/JobStatus";

// Dynamic import for code splitting
const ExportSelector = dynamic(() => import("@/components/ExportSelector").then((mod) => ({ default: mod.ExportSelector })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32" />,
  ssr: false,
});

const ExportHistory = dynamic(() => import("@/components/ExportHistory").then((mod) => ({ default: mod.ExportHistory })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32" />,
  ssr: false,
});

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const projectId = resolvedParams.id;
  const [showAPlusModal, setShowAPlusModal] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: project, isLoading, refetch: refetchProject } = api.project.get.useQuery({
    id: projectId,
  });
  const { data: productImages } = api.image.listProductImages.useQuery({ projectId });
  const { data: generatedImages, refetch: refetchGeneratedImages } = api.image.list.useQuery({
    projectId,
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!projectId) return;

    // Subscribe to project status changes
    const statusChannel = subscribeToProjectStatus(projectId, (payload) => {
      refetchProject();
      if (payload.status === "COMPLETED") {
        toast.success("Project processing completed!");
      } else if (payload.status === "FAILED") {
        toast.error("Project processing failed");
      }
    });

    // Subscribe to generated image updates
    const imageChannel = subscribeToGeneratedImages(projectId, (image) => {
      refetchGeneratedImages();
      toast.success("New image generated!");
    });

    // Cleanup subscriptions on unmount
    return () => {
      statusChannel.unsubscribe();
      imageChannel.unsubscribe();
    };
  }, [projectId, refetchProject, refetchGeneratedImages]);

  const generateImage = api.image.generate.useMutation({
    onSuccess: (data) => {
      setActiveJobId(data.jobId);
      toast.success("Image generation started! Check back in a few moments.");
      // Refetch generated images after completion
      setTimeout(() => {
        refetchGeneratedImages();
      }, 10000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate image");
    },
  });

  const generateCompletePack = api.image.generateCompletePack.useMutation({
    onSuccess: (data) => {
      setActiveJobId(data.jobId);
      toast.success(data.message || "Complete pack generation started! This may take a few minutes.");
      // Refetch after a delay
      setTimeout(() => {
        refetchProject();
        refetchGeneratedImages();
      }, 5000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate complete pack");
    },
  });

  const generateAPlus = api.aPlus.generate.useMutation({
    onSuccess: () => {
      toast.success("A+ content generation started! Redirecting to A+ editor...");
      setShowAPlusModal(false);
      setTimeout(() => {
        router.push(`/projects/${projectId}/aplus`);
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate A+ content");
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
      <div className="mb-8 flex items-center gap-4">
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
        {activeJobId && (
          <JobStatus
            jobId={activeJobId}
            onComplete={() => {
              refetchProject();
              refetchGeneratedImages();
              setActiveJobId(null);
            }}
            onError={(error) => {
              toast.error(`Job failed: ${error}`);
              setActiveJobId(null);
            }}
          />
        )}
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
            
            {/* Generate Complete Pack Button */}
            <div className="mb-8">
              <button
                onClick={() => {
                  if (!productImages || productImages.length === 0) {
                    toast.error("Please upload at least one product image first");
                    return;
                  }
                  generateCompletePack.mutate({
                    projectId,
                    includeAPlus: false,
                  });
                }}
                disabled={generateCompletePack.isPending || !productImages || productImages.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-base font-semibold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                <Sparkles className="h-5 w-5" />
                {generateCompletePack.isPending ? "Generating Complete Pack..." : "Generate Complete Pack (All Images)"}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Generates all 6 listing images at once (43 credits)
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Or generate individually:</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                {generateImage.isPending ? "Generating..." : "Main Image"}
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
                {generateImage.isPending ? "Generating..." : "Infographic"}
              </button>
              <button
                onClick={() => {
                  if (!productImages || productImages.length === 0) {
                    toast.error("Please upload at least one product image first");
                    return;
                  }
                  generateImage.mutate({
                    projectId,
                    type: ImageType.FEATURE_HIGHLIGHT,
                  });
                }}
                disabled={generateImage.isPending || !productImages || productImages.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                {generateImage.isPending ? "Generating..." : "Feature Highlight"}
              </button>
              <button
                onClick={() => {
                  if (!productImages || productImages.length === 0) {
                    toast.error("Please upload at least one product image first");
                    return;
                  }
                  generateImage.mutate({
                    projectId,
                    type: ImageType.LIFESTYLE,
                  });
                }}
                disabled={generateImage.isPending || !productImages || productImages.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                {generateImage.isPending ? "Generating..." : "Lifestyle"}
              </button>
              <button
                onClick={() => {
                  if (!productImages || productImages.length === 0) {
                    toast.error("Please upload at least one product image first");
                    return;
                  }
                  generateImage.mutate({
                    projectId,
                    type: ImageType.COMPARISON_CHART,
                  });
                }}
                disabled={generateImage.isPending || !productImages || productImages.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                {generateImage.isPending ? "Generating..." : "Comparison Chart"}
              </button>
              <button
                onClick={() => {
                  if (!productImages || productImages.length === 0) {
                    toast.error("Please upload at least one product image first");
                    return;
                  }
                  generateImage.mutate({
                    projectId,
                    type: ImageType.DIMENSION_DIAGRAM,
                  });
                }}
                disabled={generateImage.isPending || !productImages || productImages.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                {generateImage.isPending ? "Generating..." : "Dimension Diagram"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* A+ Content Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            A+ Content
          </h2>
          <Link
            href={`/projects/${projectId}/aplus`}
            className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <FileText className="h-4 w-4" />
            Manage A+ Content
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create professional Amazon A+ content modules for your product listing.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAPlusModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              <Zap className="h-4 w-4" />
              Generate A+ Content
            </button>
          </div>
        </div>
      </div>

      {/* Export Section */}
      {generatedImages && generatedImages.length > 0 && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Export Images
            </h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <ExportSelector
              projectId={projectId}
              onExportComplete={(downloadUrl) => {
                toast.success("Export completed! Download starting...");
              }}
            />
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <ExportHistory projectId={projectId} />
            </div>
          </div>
        </div>
      )}

      {/* A+ Content Generation Modal */}
      {showAPlusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Generate A+ Content
              </h3>
              <button
                onClick={() => setShowAPlusModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Choose the type of A+ content you want to generate:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    generateAPlus.mutate({
                      projectId,
                      isPremium: false,
                    });
                  }}
                  disabled={generateAPlus.isPending}
                  className="w-full text-left p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Standard A+ Content
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Includes standard modules (1-6) with professional layouts
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    generateAPlus.mutate({
                      projectId,
                      isPremium: true,
                    });
                  }}
                  disabled={generateAPlus.isPending}
                  className="w-full text-left p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Premium A+ Content
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Includes premium modules with advanced layouts and features
                      </p>
                    </div>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                      Premium
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

