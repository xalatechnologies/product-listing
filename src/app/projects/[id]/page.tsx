"use client";

/**
 * Project detail page - view and manage a specific project
 */

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Download, Sparkles, FileText, Zap, X, Package, ImageIcon, Layers } from "lucide-react";
import { ImageUpload, ImagePreview } from "@/components/ImageUpload";
import { toast } from "react-toastify";
import { ImageType } from "@prisma/client";
import { subscribeToProjectStatus, subscribeToGeneratedImages } from "@/lib/supabase/realtime";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { JobStatus } from "@/components/JobStatus";
import { AppLayout } from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";

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
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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
          <span className="text-gray-900 dark:text-gray-100 font-medium">{project.name}</span>
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
                <div className="p-3 bg-gradient-to-br from-amber-500 to-blue-600 rounded-2xl shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {project.name}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                    {project.productName}
                  </p>
                </div>
              </div>

              {project.description && (
                <p className="text-base text-gray-600 dark:text-gray-400 mt-4 max-w-3xl">
                  {project.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 ${
                      project.status === "COMPLETED"
                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                        : project.status === "PROCESSING"
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 animate-pulse"
                          : project.status === "FAILED"
                            ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                            : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
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
                {productImages && productImages.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <ImageIcon className="h-4 w-4" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {productImages.length}
                    </span>
                    <span>product image{productImages.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
                {generatedImages && generatedImages.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {generatedImages.length}
                    </span>
                    <span>generated image{generatedImages.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={`/projects/${projectId}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3 text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-amber-500 dark:hover:border-amber-500 transition-all shadow-md hover:shadow-lg"
                >
                  <Edit className="h-5 w-5" />
                  Edit
                </Link>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDelete}
                disabled={deleteProject.isPending}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 px-6 py-3 text-base font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Product Images Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 mb-8 shadow-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Product Images
              </h2>
            </div>
            {productImages && productImages.length > 0 && (
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
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
              window.location.reload();
            }}
          />
        </motion.div>

        {/* Generated Images Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 mb-8 shadow-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                AI Generated Images
              </h2>
            </div>
            {generatedImages && generatedImages.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-base font-bold text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="h-5 w-5" />
                Download All
              </motion.button>
            )}
          </div>

          {generatedImages && generatedImages.length > 0 ? (
            <ImagePreview images={generatedImages} deletable={false} />
          ) : (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center"
              >
                <Sparkles className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                No generated images yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Upload product images above, then generate your listing images
              </p>
            
              {/* Generate Complete Pack Button */}
              <div className="mb-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-bold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transition-all"
                >
                  <Sparkles className="h-5 w-5" />
                  {generateCompletePack.isPending ? "Generating Complete Pack..." : "Generate Complete Pack (All Images)"}
                </motion.button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Generates all 6 listing images at once (43 credits)
                </p>
              </div>

              <div className="border-t-2 border-purple-200 dark:border-purple-800 pt-6">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Or generate individually:</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  {generateImage.isPending ? "Generating..." : "Main Image"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  {generateImage.isPending ? "Generating..." : "Infographic"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  {generateImage.isPending ? "Generating..." : "Feature Highlight"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  {generateImage.isPending ? "Generating..." : "Lifestyle"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  {generateImage.isPending ? "Generating..." : "Comparison Chart"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  {generateImage.isPending ? "Generating..." : "Dimension Diagram"}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* A+ Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-xl rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 mb-8 shadow-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">A+ Content</h2>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={`/projects/${projectId}/aplus`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
              >
                <FileText className="h-4 w-4" />
                Manage A+ Content
              </Link>
            </motion.div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Create professional Amazon A+ content modules for your product listing.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAPlusModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 text-sm font-bold text-white hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
          >
            <Zap className="h-4 w-4" />
            Generate A+ Content
          </motion.button>
        </motion.div>

        {/* Export Section */}
        {generatedImages && generatedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 mb-8 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500/10 rounded-xl">
                <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Export Images</h2>
            </div>
            <div className="space-y-6">
              <ExportSelector
                projectId={projectId}
                onExportComplete={(downloadUrl) => {
                  toast.success("Export completed! Download starting...");
                }}
              />
              <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                <ExportHistory projectId={projectId} />
              </div>
            </div>
          </motion.div>
        )}

        {/* A+ Content Generation Modal */}
        <AnimatePresence>
          {showAPlusModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAPlusModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              >
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full mx-4 border-2 border-gray-200 dark:border-gray-700 pointer-events-auto overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Generate A+ Content</h3>
                      </div>
                      <button
                        onClick={() => setShowAPlusModal(false)}
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
                  <div className="p-6 space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        generateAPlus.mutate({
                          projectId,
                          isPremium: false,
                        });
                      }}
                      disabled={generateAPlus.isPending}
                      className="w-full text-left p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                            Standard A+ Content
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Includes standard modules (1-6) with professional layouts
                          </p>
                        </div>
                      </div>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        generateAPlus.mutate({
                          projectId,
                          isPremium: true,
                        });
                      }}
                      disabled={generateAPlus.isPending}
                      className="w-full text-left p-5 border-2 border-purple-500 dark:border-purple-500 rounded-xl hover:border-purple-600 dark:hover:border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                              Premium A+ Content
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Includes premium modules with advanced layouts and features
                            </p>
                          </div>
                        </div>
                        <span className="ml-4 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                          PREMIUM
                        </span>
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

        {/* Project Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-500/10 rounded-xl">
              <Layers className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project Information</h3>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </motion.div>
      </div>
    </AppLayout>
  );
}

