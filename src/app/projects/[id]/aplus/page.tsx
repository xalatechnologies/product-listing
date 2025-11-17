"use client";

/**
 * A+ Content page - manage and preview A+ content for a project
 */

import { use, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Zap, FileText, X, ImageIcon } from "lucide-react";
import { toast } from "react-toastify";
import { AppLayout } from "@/components/AppLayout";
import { safeLogError } from "@/lib/utils/errorUtils";

// Dynamic imports for code splitting
const APlusEditor = dynamic(() => import("@/components/APlusEditor").then((mod) => ({ default: mod.APlusEditor })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64" />,
  ssr: false,
});

const ErrorBoundary = dynamic(() => import("@/components/ErrorBoundary").then((mod) => ({ default: mod.ErrorBoundary })), {
  ssr: false,
});

interface APlusPageProps {
  params: Promise<{ id: string }>;
}

export default function APlusPage({ params }: APlusPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const projectId = resolvedParams.id;
  const [exportFormat, setExportFormat] = useState<"png" | "jpg">("png");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateImages, setGenerateImages] = useState(false);

  const { data: project, isLoading: projectLoading, error: projectError } = api.project.get.useQuery({
    id: projectId,
  });
  const { data: productImages, error: productImagesError } = api.image.listProductImages.useQuery({ projectId });
  const { data: generatedImages, error: generatedImagesError } = api.image.list.useQuery({ projectId });
  const {
    data: aPlusContent,
    isLoading: aPlusLoading,
    refetch,
    error: aPlusError,
  } = api.aPlus.get.useQuery(
    { projectId },
    {
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  // Handle errors (sanitized to prevent 431 errors)
  if (projectError || productImagesError || generatedImagesError || aPlusError) {
    if (projectError) safeLogError("A+ Page - Project", projectError);
    if (productImagesError) safeLogError("A+ Page - Product Images", productImagesError);
    if (generatedImagesError) safeLogError("A+ Page - Generated Images", generatedImagesError);
    if (aPlusError) safeLogError("A+ Page - A+ Content", aPlusError);
  }

  const generateAPlus = api.aPlus.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`A+ content generated successfully!${data.generatedImageCount ? ` ${data.generatedImageCount} images generated.` : ""}`);
      setShowGenerateModal(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate A+ content");
    },
  });


  const exportAPlus = api.aPlus.export.useMutation({
    onSuccess: (data) => {
      toast.success("A+ content exported successfully!");
      // Open download URL
      window.open(data.downloadUrl, "_blank");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to export A+ content");
    },
  });

  if (projectLoading || aPlusLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Project not found
          </h2>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Handle case where A+ content doesn't exist yet
  const modules = aPlusContent?.modules ? (Array.isArray(aPlusContent.modules) ? aPlusContent.modules : []) : [];

  // Safety check for projectId
  if (!projectId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Invalid Project ID
          </h2>
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
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 container mx-auto px-4 py-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              A+ Content Editor
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{project.productName}</p>
          </div>

          <div className="flex gap-2">
            {modules.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as "png" | "jpg")}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
                <button
                  onClick={() => {
                    exportAPlus.mutate({
                      projectId,
                      format: exportFormat,
                    });
                  }}
                  disabled={exportAPlus.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  {exportAPlus.isPending ? "Exporting..." : "Export"}
                </button>
              </div>
            )}
            {modules.length === 0 && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                <Zap className="h-4 w-4" />
                Generate A+ Content
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Available Images Info */}
      {(productImages && productImages.length > 0) || (generatedImages && generatedImages.length > 0) ? (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Available Images
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {productImages && productImages.length > 0 && (
                  <span>{productImages.length} product image{productImages.length !== 1 ? 's' : ''}</span>
                )}
                {productImages && productImages.length > 0 && generatedImages && generatedImages.length > 0 && ' • '}
                {generatedImages && generatedImages.length > 0 && (
                  <span>{generatedImages.length} generated image{generatedImages.length !== 1 ? 's' : ''}</span>
                )}
                {(!productImages || productImages.length === 0) && (!generatedImages || generatedImages.length === 0) && (
                  <span>No images available - upload product images or generate listing images</span>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                No Images Available
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                Upload product images or generate listing images to enhance your A+ content preview.
              </p>
              <Link
                href={`/projects/${projectId}`}
                className="text-xs text-amber-800 dark:text-amber-200 hover:underline font-medium"
              >
                Go to project page to upload images →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {modules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No A+ content yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Generate A+ content to create professional Amazon A+ modules for your product.
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Zap className="h-4 w-4" />
            Generate A+ Content
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden -mx-4 px-4">
          <ErrorBoundary>
            <APlusEditor
              projectId={projectId}
              modules={modules}
              productName={project.productName}
              brandKit={project.brandKit}
              productImages={productImages || []}
              generatedImages={generatedImages || []}
              onSave={() => {
                refetch();
              }}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* A+ Content Generation Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Generate A+ Content
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
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
                <div className="space-y-3">
                  <label className="flex items-center gap-2 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateImages}
                      onChange={(e) => setGenerateImages(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Automatically generate images for modules
                    </span>
                  </label>
                </div>
                <button
                  onClick={() => {
                    generateAPlus.mutate({
                      projectId,
                      isPremium: false,
                      generateImages,
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
                      generateImages,
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
      </div>
    </div>
  );
}

