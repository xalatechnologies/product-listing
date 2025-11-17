"use client";

/**
 * Project detail page - view and manage a specific project
 */

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Download, Sparkles, FileText, Zap, X, Package, ImageIcon, Layers, Eye, Palette } from "lucide-react";
import { ImageUpload, ImagePreview } from "@/components/ImageUpload";
import { EnhancedProjectView } from "@/components/EnhancedProjectView";
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
  const { data: generatedImages, refetch: refetchGeneratedImages, isLoading: generatedImagesLoading, error: generatedImagesError } = api.image.list.useQuery({
    projectId,
  });
  const { data: aPlusContent } = api.aPlus.get.useQuery({ projectId });

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
        {/* Enhanced Breadcrumb Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8 text-lg font-semibold"
        >
          <Link
            href="/dashboard"
            className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href="/projects"
            className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Projects
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 dark:text-gray-100">{project.name}</span>
        </motion.div>

        {/* Enhanced Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500 via-orange-500 to-blue-600 rounded-3xl border-2 border-amber-400/50 shadow-2xl overflow-hidden mb-8"
        >
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-6 mb-4">
                  <div className="p-4 bg-gradient-to-br from-amber-500 to-blue-600 rounded-3xl shadow-xl">
                    <Package className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-gray-100 mb-2">
                      {project.name}
                    </h1>
                    <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
                      {project.productName}
                    </p>
                  </div>
                </div>

                {project.description && (
                  <p className="text-xl text-gray-700 dark:text-gray-300 mt-6 max-w-4xl leading-relaxed">
                    {project.description}
                  </p>
                )}

                {/* Project Information Grid */}
                {(project.productCategory || project.brandKit) && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.productCategory && (
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-3 mb-2">
                          <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                          <dt className="text-lg font-bold text-gray-700 dark:text-gray-300">Category</dt>
                        </div>
                        <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {project.productCategory}
                        </dd>
                      </div>
                    )}
                    {project.brandKit && (
                      <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-6 border-2 border-pink-200 dark:border-pink-800">
                        <div className="flex items-center gap-3 mb-2">
                          <Palette className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                          <dt className="text-lg font-bold text-gray-700 dark:text-gray-300">Brand Kit</dt>
                        </div>
                        <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          <Link
                            href={`/brand-kits/${project.brandKit.id}`}
                            className="text-pink-600 hover:text-pink-700 dark:text-pink-400 hover:underline"
                          >
                            {project.brandKit.name}
                          </Link>
                        </dd>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Stats */}
                <div className="flex flex-wrap items-center gap-6 mt-8">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-6 py-3 rounded-2xl text-lg font-bold border-2 ${
                        project.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-800 dark:text-green-300 border-green-500/40"
                          : project.status === "PROCESSING"
                            ? "bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-500/40 animate-pulse"
                            : project.status === "FAILED"
                              ? "bg-red-500/20 text-red-800 dark:text-red-300 border-red-500/40"
                              : "bg-gray-500/20 text-gray-800 dark:text-gray-300 border-gray-500/40"
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
                    <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                      <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {productImages.length}
                      </span>
                      <span className="text-lg text-gray-700 dark:text-gray-300">
                        product image{productImages.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  {generatedImages && generatedImages.length > 0 && (
                    <div className="flex items-center gap-3 px-6 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
                      <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {generatedImages.length}
                      </span>
                      <span className="text-lg text-gray-700 dark:text-gray-300">
                        generated image{generatedImages.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  {aPlusContent && (
                    <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-800">
                      <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {aPlusContent.modules?.length || 0}
                      </span>
                      <span className="text-lg text-gray-700 dark:text-gray-300">
                        A+ module{(aPlusContent.modules?.length || 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href={`/projects/${projectId}/edit`}
                    className="inline-flex items-center gap-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-8 py-4 text-lg font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-amber-500 dark:hover:border-amber-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Edit className="h-6 w-6" />
                    Edit Project
                  </Link>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  disabled={deleteProject.isPending}
                  className="inline-flex items-center gap-3 rounded-2xl border-2 border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 px-8 py-4 text-lg font-bold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="h-6 w-6" />
                  Delete
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Single-Page View - Everything Inline */}
        <EnhancedProjectView
          projectId={projectId}
          productImages={productImages}
          generatedImages={generatedImages}
          aPlusContent={aPlusContent || null}
          onGenerateImage={(type) => {
            generateImage.mutate({ projectId, type });
          }}
          onGenerateCompletePack={() => {
            generateCompletePack.mutate({ projectId, includeAPlus: false });
          }}
          onGenerateAPlus={(isPremium) => {
            generateAPlus.mutate({ projectId, isPremium });
          }}
          isGenerating={generateImage.isPending}
          isGeneratingPack={generateCompletePack.isPending}
          isGeneratingAPlus={generateAPlus.isPending}
        />

        {/* Legacy sections - keeping for now but can be removed */}
        {/* Product Images Section */}
        {/* <motion.div
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

          {generatedImagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading generated images...</span>
            </div>
          ) : generatedImagesError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
              <p className="text-red-700 dark:text-red-400 font-semibold">Error loading generated images</p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-2">Please refresh the page</p>
            </div>
          ) : generatedImages && generatedImages.length > 0 ? (
            <ImagePreview 
              images={generatedImages.map(img => {
                // Debug: Log image URLs to help diagnose issues
                if (process.env.NODE_ENV === 'development') {
                  console.log('Generated image:', { id: img.id, url: img.url, type: img.type });
                }
                return { id: img.id, url: img.url, width: img.width, height: img.height };
              })} 
              deletable={false} 
            />
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
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">A+ Content</h2>
                {aPlusContent && (
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                    {aPlusContent.modules?.length || 0} modules • {aPlusContent.isPremium ? "Premium" : "Standard"}
                  </p>
                )}
              </div>
            </div>
            {aPlusContent ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={`/projects/${projectId}/aplus`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <FileText className="h-4 w-4" />
                  View & Edit A+ Content
                </Link>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAPlusModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
              >
                <Zap className="h-4 w-4" />
                Generate A+ Content
              </motion.button>
            )}
          </div>
          {aPlusContent ? (
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Your A+ content has been generated with {aPlusContent.modules?.length || 0} modules. Click the button above to view, edit, and export your content.
              </p>
              <div className="flex gap-3">
                <Link
                  href={`/projects/${projectId}/aplus`}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                >
                  <Eye className="h-4 w-4" />
                  View A+ Content
                </Link>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
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

        {/* Enhanced Project Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border-4 border-gray-200 dark:border-gray-700 p-10 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-gray-500 to-slate-500 rounded-2xl">
              <Layers className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Project Information</h3>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <dt className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">Product Name</dt>
              <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {project.productName}
              </dd>
            </div>
            {project.productCategory && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
                <dt className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">Category</dt>
                <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {project.productCategory}
                </dd>
              </div>
            )}
            {project.brandKit && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
                <dt className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">Brand Kit</dt>
                <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  <Link
                    href={`/brand-kits/${project.brandKit.id}`}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline transition-colors"
                  >
                    {project.brandKit.name}
                  </Link>
                </dd>
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <dt className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">Created</dt>
              <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {new Date(project.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <dt className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">Last Updated</dt>
              <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {new Date(project.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </motion.div>
      </div>
    </AppLayout>
  );
}

