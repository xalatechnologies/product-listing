"use client";

/**
 * A+ Content Page - Redesigned
 * Professional, modern layout for managing and editing A+ content
 */

import { use, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Zap,
  FileText,
  X,
  ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Settings,
  Eye,
  Layers,
  Palette,
} from "lucide-react";
import { toast } from "react-toastify";
import { AppLayout } from "@/components/AppLayout";
import { safeLogError } from "@/lib/utils/errorUtils";

// Dynamic imports for code splitting
const APlusEditor = dynamic(
  () => import("@/components/APlusEditor").then((mod) => ({ default: mod.APlusEditor })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    ),
    ssr: false,
  },
);

const ErrorBoundary = dynamic(
  () => import("@/components/ErrorBoundary").then((mod) => ({ default: mod.ErrorBoundary })),
  {
    ssr: false,
  },
);

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
  const { data: productImages, error: productImagesError } = api.image.listProductImages.useQuery({
    projectId,
  });
  const { data: generatedImages, error: generatedImagesError } = api.image.list.useQuery({
    projectId,
  });
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
      toast.success(
        `A+ content generated successfully!${data.generatedImageCount ? ` ${data.generatedImageCount} images generated.` : ""}`,
      );
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading A+ Content...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center"
          >
            <AlertCircle className="h-12 w-12 text-red-500" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Project not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
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

  const modules = aPlusContent?.modules
    ? Array.isArray(aPlusContent.modules)
      ? aPlusContent.modules
      : []
    : [];

  const totalImages = (productImages?.length || 0) + (generatedImages?.length || 0);
  const hasImages = totalImages > 0;

  return (
    <AppLayout>
      <div className="max-w-[1800px] mx-auto">
        {/* Breadcrumb Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6 text-sm text-gray-600 dark:text-gray-400"
        >
          <Link
            href="/dashboard"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Dashboard
          </Link>
          <span>/</span>
          <Link
            href="/projects"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Projects
          </Link>
          <span>/</span>
          <Link
            href={`/projects/${projectId}`}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            {project.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">A+ Content</span>
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 p-8 mb-8 shadow-xl"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    A+ Content Editor
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                    {project.productName}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Layers className="h-4 w-4" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {modules.length}
                  </span>
                  <span>module{modules.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ImageIcon className="h-4 w-4" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {totalImages}
                  </span>
                  <span>image{totalImages !== 1 ? "s" : ""} available</span>
                </div>
                {project.brandKit && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Palette className="h-4 w-4" />
                    <span>Brand kit applied</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {modules.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-1">
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as "png" | "jpg")}
                      className="px-3 py-2 text-sm font-medium bg-transparent border-0 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                    </select>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      exportAPlus.mutate({
                        projectId,
                        format: exportFormat,
                      });
                    }}
                    disabled={exportAPlus.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-5 w-5" />
                    {exportAPlus.isPending ? "Exporting..." : "Export"}
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowGenerateModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Zap className="h-5 w-5" />
                  Generate A+ Content
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Image Status Card */}
        <AnimatePresence mode="wait">
          {hasImages ? (
            <motion.div
              key="has-images"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                    Images Available
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    {productImages && productImages.length > 0 && (
                      <span className="font-semibold">{productImages.length} product image{productImages.length !== 1 ? "s" : ""}</span>
                    )}
                    {productImages && productImages.length > 0 && generatedImages && generatedImages.length > 0 && (
                      <span> • </span>
                    )}
                    {generatedImages && generatedImages.length > 0 && (
                      <span className="font-semibold">{generatedImages.length} generated image{generatedImages.length !== 1 ? "s" : ""}</span>
                    )}
                  </p>
                  <Link
                    href={`/projects/${projectId}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View all images
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-images"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                    No Images Available
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                    Upload product images or generate listing images to enhance your A+ content preview.
                  </p>
                  <Link
                    href={`/projects/${projectId}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Go to project to upload images
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {modules.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-16 text-center shadow-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center"
              >
                <FileText className="h-16 w-16 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                No A+ Content Yet
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Generate professional Amazon A+ modules to showcase your product with stunning visuals
                and compelling content.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-4 text-base font-bold text-white shadow-2xl hover:shadow-purple-500/50 transition-all"
              >
                <Zap className="h-6 w-6" />
                Generate A+ Content
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generation Modal */}
        <AnimatePresence>
          {showGenerateModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowGenerateModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              >
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full mx-4 border-2 border-gray-200 dark:border-gray-700 pointer-events-auto overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Generate A+ Content</h3>
                      </div>
                      <button
                        onClick={() => setShowGenerateModal(false)}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        aria-label="Close modal"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                    <p className="text-purple-100 mt-2 text-sm">
                      Choose the type of A+ content you want to generate
                    </p>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Generate Images Option */}
                    <label className="flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={generateImages}
                        onChange={(e) => setGenerateImages(e.target.checked)}
                        className="mt-1 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ImageIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            Generate Images
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Automatically generate images for A+ modules
                        </p>
                      </div>
                    </label>

                    {/* Standard Option */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        generateAPlus.mutate({
                          projectId,
                          isPremium: false,
                          generateImages,
                        });
                      }}
                      disabled={generateAPlus.isPending}
                      className="w-full text-left p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              Standard A+ Content
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Includes standard modules (1-6) with professional layouts and proven
                            conversion patterns
                          </p>
                        </div>
                      </div>
                    </motion.button>

                    {/* Premium Option */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        generateAPlus.mutate({
                          projectId,
                          isPremium: true,
                          generateImages,
                        });
                      }}
                      disabled={generateAPlus.isPending}
                      className="w-full text-left p-5 border-2 border-purple-500 dark:border-purple-500 rounded-xl hover:border-purple-600 dark:hover:border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              Premium A+ Content
                            </h4>
                            <span className="ml-auto px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                              PREMIUM
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Includes premium modules with advanced layouts, interactive features, and
                            enhanced visual storytelling
                          </p>
                        </div>
                      </div>
                    </motion.button>

                    {generateAPlus.isPending && (
                      <div className="flex items-center justify-center gap-3 py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Generating A+ content...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
