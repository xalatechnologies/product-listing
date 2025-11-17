"use client";

/**
 * Project Workflow Component
 * 
 * Interactive, step-by-step workflow for creating Amazon listing images and A+ content
 * Focused on the main objectives: Upload → Generate Images → Create A+ Content → Export
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Sparkles,
  FileText,
  Download,
  CheckCircle2,
  Circle,
  ArrowRight,
  ImageIcon,
  Zap,
  Package,
  Clock,
  TrendingUp,
} from "lucide-react";
import { ImageUpload, ImagePreview } from "@/components/ImageUpload";
import { ImageType } from "@prisma/client";
import { toast } from "react-toastify";
import Link from "next/link";
import { api } from "@/lib/trpc/react";

interface ProjectWorkflowProps {
  projectId: string;
  productImages?: Array<{ id: string; url: string; width?: number; height?: number }>;
  generatedImages?: Array<{ id: string; url: string; width?: number; height?: number; type: string }>;
  aPlusContent?: { id: string; modules?: unknown[]; isPremium: boolean } | null;
  onGenerateImage: (type: ImageType) => void;
  onGenerateCompletePack: () => void;
  onGenerateAPlus: (isPremium: boolean) => void;
  isGenerating?: boolean;
  isGeneratingPack?: boolean;
  isGeneratingAPlus?: boolean;
}

type WorkflowStep = "upload" | "images" | "aplus" | "export";

export function ProjectWorkflow({
  projectId,
  productImages = [],
  generatedImages = [],
  aPlusContent,
  onGenerateImage,
  onGenerateCompletePack,
  onGenerateAPlus,
  isGenerating = false,
  isGeneratingPack = false,
  isGeneratingAPlus = false,
}: ProjectWorkflowProps) {
  const [activeStep, setActiveStep] = useState<WorkflowStep>("upload");

  const steps = [
    {
      id: "upload" as const,
      title: "Upload Product Images",
      description: "Add your product photos",
      icon: Upload,
      completed: productImages.length > 0,
      count: productImages.length,
    },
    {
      id: "images" as const,
      title: "Generate Listing Images",
      description: "AI creates Amazon-ready images",
      icon: Sparkles,
      completed: generatedImages.length > 0,
      count: generatedImages.length,
    },
    {
      id: "aplus" as const,
      title: "Create A+ Content",
      description: "Premium Amazon A+ modules",
      icon: FileText,
      completed: !!aPlusContent,
      count: aPlusContent?.modules?.length || 0,
    },
    {
      id: "export" as const,
      title: "Export & Download",
      description: "Get your final assets",
      icon: Download,
      completed: false,
      count: 0,
    },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === activeStep);
  const canProceedToImages = productImages.length > 0;
  const canProceedToAPlus = generatedImages.length > 0;

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Create Your Amazon Listing
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Follow these steps to generate professional listing images and A+ content
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-blue-600/10 rounded-xl border border-amber-500/20">
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {steps.filter((s) => s.completed).length} of {steps.length} Complete
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            const isCompleted = step.completed;
            const isClickable = index === 0 || (index === 1 && canProceedToImages) || (index === 2 && canProceedToAPlus) || index === 3;

            return (
              <motion.button
                key={step.id}
                onClick={() => isClickable && setActiveStep(step.id)}
                disabled={!isClickable}
                whileHover={isClickable ? { scale: 1.02 } : {}}
                whileTap={isClickable ? { scale: 0.98 } : {}}
                className={`relative p-6 rounded-2xl border-2 transition-all ${
                  isActive
                    ? "border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-lg"
                    : isCompleted
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : isClickable
                        ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-amber-400 cursor-pointer"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`p-4 rounded-xl ${
                      isActive
                        ? "bg-gradient-to-br from-amber-500 to-orange-500"
                        : isCompleted
                          ? "bg-gradient-to-br from-green-500 to-emerald-500"
                          : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    ) : (
                      <Icon className={`h-6 w-6 ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-sm mb-1 ${isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{step.description}</p>
                    {step.count > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {step.count}
                      </div>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeStep === "upload" && (
            <StepUpload
              projectId={projectId}
              productImages={productImages}
              onComplete={() => {
                if (canProceedToImages) {
                  setActiveStep("images");
                }
              }}
            />
          )}

          {activeStep === "images" && (
            <StepGenerateImages
              projectId={projectId}
              productImages={productImages}
              generatedImages={generatedImages}
              onGenerateImage={onGenerateImage}
              onGenerateCompletePack={onGenerateCompletePack}
              isGenerating={isGenerating}
              isGeneratingPack={isGeneratingPack}
              onComplete={() => {
                if (canProceedToAPlus) {
                  setActiveStep("aplus");
                }
              }}
            />
          )}

          {activeStep === "aplus" && (
            <StepAPlusContent
              projectId={projectId}
              aPlusContent={aPlusContent}
              onGenerateAPlus={onGenerateAPlus}
              isGenerating={isGeneratingAPlus}
            />
          )}

          {activeStep === "export" && <StepExport projectId={projectId} generatedImages={generatedImages} aPlusContent={aPlusContent} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Step 1: Upload Product Images
function StepUpload({
  projectId,
  productImages,
  onComplete,
}: {
  projectId: string;
  productImages: Array<{ id: string; url: string; width?: number; height?: number }>;
  onComplete: () => void;
}) {
  const utils = api.useUtils();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
          <Upload className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Upload Product Images</h3>
          <p className="text-gray-600 dark:text-gray-400">Add high-quality photos of your product</p>
        </div>
      </div>

      {productImages.length > 0 ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {productImages.length} image{productImages.length !== 1 ? "s" : ""} uploaded
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onComplete}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
            >
              Continue to Image Generation
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
          <ImagePreview images={productImages} deletable={true} />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800 mb-6">
          <div className="text-center">
            <ImageIcon className="h-16 w-16 text-blue-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">Upload at least one product image to get started</p>
          </div>
        </div>
      )}

      <ImageUpload
        projectId={projectId}
        onUploadComplete={() => {
          toast.success("Image uploaded successfully!");
          void utils.image.listProductImages.invalidate({ projectId });
          setTimeout(() => {
            if (productImages.length === 0) {
              onComplete();
            }
          }, 500);
        }}
      />
    </div>
  );
}

// Step 2: Generate Listing Images
function StepGenerateImages({
  projectId,
  productImages,
  generatedImages,
  onGenerateImage,
  onGenerateCompletePack,
  isGenerating,
  isGeneratingPack,
  onComplete,
}: {
  projectId: string;
  productImages: Array<{ id: string; url: string; width?: number; height?: number }>;
  generatedImages: Array<{ id: string; url: string; width?: number; height?: number; type: string }>;
  onGenerateImage: (type: ImageType) => void;
  onGenerateCompletePack: () => void;
  isGenerating: boolean;
  isGeneratingPack: boolean;
  onComplete: () => void;
}) {
  const imageTypes = [
    { type: ImageType.MAIN_IMAGE, label: "Main Image", description: "White background, Amazon-compliant", icon: Package },
    { type: ImageType.INFOGRAPHIC, label: "Infographic", description: "Feature highlights & benefits", icon: FileText },
    { type: ImageType.FEATURE_HIGHLIGHT, label: "Feature Highlight", description: "Key product features", icon: Sparkles },
    { type: ImageType.LIFESTYLE, label: "Lifestyle", description: "Product in real-world scenes", icon: ImageIcon },
  ];

  const hasProductImages = productImages.length > 0;
  const hasGeneratedImages = generatedImages.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Generate Listing Images</h3>
          <p className="text-gray-600 dark:text-gray-400">AI creates professional Amazon-ready images</p>
        </div>
      </div>

      {!hasProductImages ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 text-center">
          <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
            Please upload product images first to generate listing images
          </p>
        </div>
      ) : (
        <>
          {/* Quick Generate All */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 mb-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Generate Complete Pack</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create all 6 listing images at once (43 credits)</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGenerateCompletePack}
                disabled={isGeneratingPack}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPack ? (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Generate All
                  </span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Individual Image Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {imageTypes.map((imgType) => {
              const Icon = imgType.icon;
              const exists = generatedImages.some((img) => img.type === imgType.type);
              return (
                <motion.div
                  key={imgType.type}
                  whileHover={{ scale: 1.02 }}
                  className={`p-6 rounded-2xl border-2 ${
                    exists
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${exists ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                        <Icon className={`h-5 w-5 ${exists ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100">{imgType.label}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{imgType.description}</p>
                      </div>
                    </div>
                    {exists && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  </div>
                  {!exists && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onGenerateImage(imgType.type)}
                      disabled={isGenerating}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isGenerating ? "Generating..." : "Generate"}
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Generated Images Preview */}
          {hasGeneratedImages && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900 dark:text-gray-100">
                  Generated Images ({generatedImages.length})
                </h4>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onComplete}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
                >
                  Continue to A+ Content
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
              <ImagePreview
                images={generatedImages.map((img) => ({ id: img.id, url: img.url, width: img.width, height: img.height }))}
                deletable={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Step 3: A+ Content
function StepAPlusContent({
  projectId,
  aPlusContent,
  onGenerateAPlus,
  isGenerating,
}: {
  projectId: string;
  aPlusContent: { id: string; modules?: unknown[]; isPremium: boolean } | null | undefined;
  onGenerateAPlus: (isPremium: boolean) => void;
  isGenerating: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create A+ Content</h3>
          <p className="text-gray-600 dark:text-gray-400">Premium Amazon A+ content modules</p>
        </div>
      </div>

      {aPlusContent ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">A+ Content Created!</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {aPlusContent.modules?.length || 0} modules • {aPlusContent.isPremium ? "Premium" : "Standard"}
                </p>
              </div>
              <Link
                href={`/projects/${projectId}/aplus`}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-xl transition-all"
              >
                View & Edit
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-800">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Standard A+ Content</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Perfect for most sellers</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onGenerateAPlus(false)}
              disabled={isGenerating}
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Standard A+ Content"}
            </motion.button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">Premium A+ Content</h4>
                  <span className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded">PREMIUM</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Advanced modules with enhanced visuals and layouts
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• More visual modules</li>
                  <li>• Enhanced layouts</li>
                  <li>• Premium styling</li>
                </ul>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onGenerateAPlus(true)}
              disabled={isGenerating}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Premium A+ Content"}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 4: Export
function StepExport({
  projectId,
  generatedImages,
  aPlusContent,
}: {
  projectId: string;
  generatedImages?: Array<{ id: string; url: string; width?: number; height?: number; type: string }>;
  aPlusContent?: { id: string; modules?: unknown[]; isPremium: boolean } | null;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
          <Download className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Export & Download</h3>
          <p className="text-gray-600 dark:text-gray-400">Get your final assets ready for Amazon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {generatedImages && generatedImages.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Listing Images</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{generatedImages.length} images ready</p>
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              <Download className="h-4 w-4" />
              Download Images
            </Link>
          </div>
        )}

        {aPlusContent && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">A+ Content</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {aPlusContent.modules?.length || 0} modules ready
            </p>
            <Link
              href={`/projects/${projectId}/aplus`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
            >
              <Download className="h-4 w-4" />
              Export A+ Content
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

