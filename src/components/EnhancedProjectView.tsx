"use client";

/**
 * Enhanced Project View - Premium Single-Page Experience
 * 
 * Everything on one page: Upload → Generate → A+ Content → Export
 * Large fonts, premium design, robust UX
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Sparkles,
  FileText,
  Download,
  CheckCircle2,
  ArrowRight,
  ImageIcon,
  Zap,
  Package,
  Clock,
  TrendingUp,
  Eye,
  Edit,
  Layers,
  Play,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ImageUpload, ImagePreview } from "@/components/ImageUpload";
import { ExportSelector } from "@/components/ExportSelector";
import { ExportHistory } from "@/components/ExportHistory";
import { ImageType } from "@prisma/client";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
import { api } from "@/lib/trpc/react";

const APlusEditor = dynamic(
  () => import("@/components/APlusEditor").then((mod) => ({ default: mod.APlusEditor })),
  { ssr: false }
);

interface EnhancedProjectViewProps {
  projectId: string;
  productImages?: Array<{ id: string; url: string; width?: number; height?: number }>;
  generatedImages?: Array<{ id: string; url: string; width?: number; height?: number; type: ImageType | string }>;
  aPlusContent?: { id: string; modules?: unknown[]; isPremium: boolean } | null;
  onGenerateImage: (type: ImageType) => void;
  onGenerateCompletePack: () => void;
  onGenerateAPlus: (isPremium: boolean) => void;
  isGenerating?: boolean;
  isGeneratingPack?: boolean;
  isGeneratingAPlus?: boolean;
}

export function EnhancedProjectView({
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
}: EnhancedProjectViewProps) {
  const [expandedSections, setExpandedSections] = useState({
    upload: true,
    images: true,
    aplus: true,
    export: false,
  });
  const [showAPlusModal, setShowAPlusModal] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Upload Product Images */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
      >
        <button
          onClick={() => toggleSection("upload")}
          className="w-full p-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-left hover:from-blue-600 hover:to-cyan-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-2xl">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Step 1: Upload Product Images</h2>
                <p className="text-xl text-blue-100">
                  {productImages.length > 0
                    ? `${productImages.length} image${productImages.length !== 1 ? "s" : ""} uploaded`
                    : "Add your product photos to get started"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {productImages.length > 0 && (
                <div className="px-6 py-3 bg-white/20 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              )}
              {expandedSections.upload ? (
                <ChevronUp className="h-8 w-8 text-white" />
              ) : (
                <ChevronDown className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
        </button>

        <AnimatePresence>
          {expandedSections.upload && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-8">
                {productImages.length > 0 && (
                  <div className="mb-8">
                    <ImagePreview images={productImages} deletable={true} />
                  </div>
                )}
                <ImageUpload
                  projectId={projectId}
                  onUploadComplete={() => {
                    toast.success("Image uploaded successfully!");
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Section 2: Generate Listing Images */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
      >
        <button
          onClick={() => toggleSection("images")}
          className="w-full p-8 bg-gradient-to-r from-purple-500 to-pink-500 text-left hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-2xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Step 2: Generate Listing Images</h2>
                <p className="text-xl text-purple-100">
                  {generatedImages.length > 0
                    ? `${generatedImages.length} AI-generated image${generatedImages.length !== 1 ? "s" : ""} ready`
                    : "AI creates professional Amazon-ready images"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {generatedImages.length > 0 && (
                <div className="px-6 py-3 bg-white/20 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              )}
              {expandedSections.images ? (
                <ChevronUp className="h-8 w-8 text-white" />
              ) : (
                <ChevronDown className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
        </button>

        <AnimatePresence>
          {expandedSections.images && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-8">
                {productImages.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-8 text-center">
                    <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                      Upload product images first to generate listing images
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Quick Generate All */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 mb-8 border-2 border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Generate Complete Pack
                          </h3>
                          <p className="text-lg text-gray-600 dark:text-gray-400">
                            Create all 6 listing images at once (43 credits)
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={onGenerateCompletePack}
                          disabled={isGeneratingPack}
                          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl text-xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGeneratingPack ? (
                            <span className="flex items-center gap-3">
                              <Clock className="h-6 w-6 animate-spin" />
                              Generating...
                            </span>
                          ) : (
                            <span className="flex items-center gap-3">
                              <Zap className="h-6 w-6" />
                              Generate All Images
                            </span>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Individual Image Types */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {[
                        { type: ImageType.MAIN_IMAGE, label: "Main Image", description: "White background, Amazon-compliant", icon: Package },
                        { type: ImageType.INFOGRAPHIC, label: "Infographic", description: "Feature highlights & benefits", icon: FileText },
                        { type: ImageType.FEATURE_HIGHLIGHT, label: "Feature Highlight", description: "Key product features", icon: Sparkles },
                        { type: ImageType.LIFESTYLE, label: "Lifestyle", description: "Product in real-world scenes", icon: ImageIcon },
                      ].map((imgType) => {
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
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${exists ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                                  <Icon className={`h-6 w-6 ${exists ? "text-white" : "text-gray-500"}`} />
                                </div>
                                <div>
                                  <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">{imgType.label}</h4>
                                  <p className="text-base text-gray-500 dark:text-gray-400">{imgType.description}</p>
                                </div>
                              </div>
                              {exists && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                            </div>
                            {!exists && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onGenerateImage(imgType.type)}
                                disabled={isGenerating}
                                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-lg font-bold hover:shadow-lg transition-all disabled:opacity-50"
                              >
                                {isGenerating ? "Generating..." : "Generate"}
                              </motion.button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Generated Images Preview */}
                    {generatedImages.length > 0 && (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                          Generated Images ({generatedImages.length})
                        </h3>
                        <ImagePreview
                          images={generatedImages.map((img) => ({
                            id: img.id,
                            url: img.url,
                            width: img.width,
                            height: img.height,
                          }))}
                          deletable={false}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Section 3: A+ Content - INLINE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
      >
        <button
          onClick={() => toggleSection("aplus")}
          className="w-full p-8 bg-gradient-to-r from-amber-500 to-orange-500 text-left hover:from-amber-600 hover:to-orange-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-2xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Step 3: Create A+ Content</h2>
                <p className="text-xl text-amber-100">
                  {aPlusContent
                    ? `${aPlusContent.modules?.length || 0} module${(aPlusContent.modules?.length || 0) !== 1 ? "s" : ""} created • ${aPlusContent.isPremium ? "Premium" : "Standard"}`
                    : "Premium Amazon A+ content modules"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {aPlusContent && (
                <div className="px-6 py-3 bg-white/20 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              )}
              {expandedSections.aplus ? (
                <ChevronUp className="h-8 w-8 text-white" />
              ) : (
                <ChevronDown className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
        </button>

        <AnimatePresence>
          {expandedSections.aplus && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-8">
                {aPlusContent ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">A+ Content Created!</h3>
                          <p className="text-lg text-gray-600 dark:text-gray-400">
                            {aPlusContent.modules?.length || 0} modules • {aPlusContent.isPremium ? "Premium" : "Standard"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Inline A+ Editor */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
                      <APlusEditor
                        projectId={projectId}
                        modules={(aPlusContent.modules as any[]) || []}
                        productImages={productImages.map(img => ({ id: img.id, url: img.url }))}
                        generatedImages={generatedImages.map(img => ({ id: img.id, url: img.url, type: String(img.type) }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Header Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-8 border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-6">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl">
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                            Create Professional Amazon A+ Content
                          </h3>
                          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
                            AI-powered content generation that creates compelling product stories with professional layouts
                          </p>
                          <div className="flex flex-wrap gap-4 text-lg text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span>Amazon-compliant modules</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span>AI-generated images</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span>Professional layouts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Standard Option */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl p-10 border-4 border-amber-300 dark:border-amber-700 shadow-xl"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl">
                              <FileText className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                Standard A+ Content
                              </h3>
                              <p className="text-xl text-gray-600 dark:text-gray-400">Perfect for most sellers</p>
                            </div>
                          </div>
                          
                          <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-6 mb-6">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">What's Included:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">4-6 Content Modules</p>
                                  <p className="text-base text-gray-600 dark:text-gray-400">Feature highlights, benefits, specifications</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI-Generated Images</p>
                                  <p className="text-base text-gray-600 dark:text-gray-400">Professional product visuals</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Standard Layouts</p>
                                  <p className="text-base text-gray-600 dark:text-gray-400">Clean, professional designs</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Amazon Compliant</p>
                                  <p className="text-base text-gray-600 dark:text-gray-400">Meets all requirements</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onGenerateAPlus(false)}
                        disabled={isGeneratingAPlus}
                        className="w-full px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-2xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isGeneratingAPlus ? (
                          <>
                            <Clock className="h-7 w-7 animate-spin" />
                            <span>Generating A+ Content...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-7 w-7" />
                            <span>Generate Standard A+ Content</span>
                          </>
                        )}
                      </motion.button>
                    </motion.div>

                    {/* Premium Option */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20 rounded-3xl p-10 border-4 border-purple-400 dark:border-purple-600 shadow-2xl relative overflow-hidden"
                    >
                      {/* Premium Badge */}
                      <div className="absolute top-6 right-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-black rounded-2xl shadow-lg rotate-12">
                        PREMIUM
                      </div>

                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1 pr-24">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                              <Sparkles className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                Premium A+ Content
                              </h3>
                              <p className="text-xl text-gray-600 dark:text-gray-400">Advanced features for maximum impact</p>
                            </div>
                          </div>
                          
                          <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-6 mb-6">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Everything in Standard, Plus:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-start gap-3">
                                <Sparkles className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">6-8 Enhanced Modules</p>
                                  <p className="text-base text-gray-600 dark:text-gray-400">More comprehensive content</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Sparkles className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Advanced Layouts</p>
                                  <p className="text-base text-gray-600 dark:text-gray-400">Premium visual designs</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Sparkles className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enhanced Visuals</p>
                                  <p className="text-base text-gray-600 dark:text-gray-400">Higher quality images</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Sparkles className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Custom Styling</p>
                                  <p className="text-base text-gray-600 dark:text-gray-400">Brand-aligned designs</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onGenerateAPlus(true)}
                        disabled={isGeneratingAPlus}
                        className="w-full px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-2xl text-2xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isGeneratingAPlus ? (
                          <>
                            <Clock className="h-7 w-7 animate-spin" />
                            <span>Generating Premium A+ Content...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-7 w-7" />
                            <span>Generate Premium A+ Content</span>
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Section 4: Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
      >
        <button
          onClick={() => toggleSection("export")}
          className="w-full p-8 bg-gradient-to-r from-green-500 to-emerald-500 text-left hover:from-green-600 hover:to-emerald-600 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-2xl">
                <Download className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Step 4: Export & Download</h2>
                <p className="text-xl text-green-100">Get your final assets ready for marketplaces</p>
              </div>
            </div>
            {expandedSections.export ? (
              <ChevronUp className="h-8 w-8 text-white" />
            ) : (
              <ChevronDown className="h-8 w-8 text-white" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {expandedSections.export && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-10">
                {/* Export for Marketplaces */}
                <div className="mb-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
                      <Download className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Export for Marketplaces
                      </h3>
                      <p className="text-xl text-gray-600 dark:text-gray-400">
                        Export your images in platform-specific formats and sizes
                      </p>
                    </div>
                  </div>
                  <ExportSelector
                    projectId={projectId}
                    onExportComplete={(downloadUrl, platform) => {
                      toast.success(`Successfully exported for ${platform}!`);
                    }}
                  />
                </div>

                {/* Export History */}
                <div className="border-t-4 border-gray-200 dark:border-gray-700 pt-10">
                  <ExportHistory projectId={projectId} />
                </div>

                {/* Quick Download Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                  {generatedImages && generatedImages.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-3xl p-8 border-4 border-blue-200 dark:border-blue-800 shadow-xl">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
                          <ImageIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Listing Images</h3>
                          <p className="text-lg text-gray-600 dark:text-gray-400">{generatedImages.length} images ready</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-8 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl text-xl font-bold hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                      >
                        <Download className="h-6 w-6" />
                        Download All Images
                      </motion.button>
                    </div>
                  )}

                  {aPlusContent && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 border-4 border-purple-200 dark:border-purple-800 shadow-xl">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">A+ Content</h3>
                          <p className="text-lg text-gray-600 dark:text-gray-400">
                            {aPlusContent.modules?.length || 0} modules ready
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-8 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl text-xl font-bold hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                      >
                        <Download className="h-6 w-6" />
                        Export A+ Content
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

