"use client";

/**
 * Export Selector Component
 * 
 * Allows users to select a marketplace platform and export their project images
 */

import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { toast } from "react-toastify";
import { ShoppingBag, Package, Store, ShoppingCart, Download, Info } from "lucide-react";
import { motion } from "framer-motion";
import { AMAZON_SPEC, EBAY_SPEC, ETSY_SPEC, SHOPIFY_SPEC } from "@/lib/export/specs";

interface ExportSelectorProps {
  projectId: string;
  onExportComplete?: (downloadUrl: string, platform: string) => void;
}

const platforms = [
  {
    id: "amazon" as const,
    name: "Amazon",
    icon: <ShoppingBag className="h-6 w-6" />,
    spec: AMAZON_SPEC,
    color: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    buttonColor: "bg-orange-600 hover:bg-orange-700",
  },
  {
    id: "ebay" as const,
    name: "eBay",
    icon: <Package className="h-6 w-6" />,
    spec: EBAY_SPEC,
    color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "etsy" as const,
    name: "Etsy",
    icon: <Store className="h-6 w-6" />,
    spec: ETSY_SPEC,
    color: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800",
    buttonColor: "bg-pink-600 hover:bg-pink-700",
  },
  {
    id: "shopify" as const,
    name: "Shopify",
    icon: <ShoppingCart className="h-6 w-6" />,
    spec: SHOPIFY_SPEC,
    color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    buttonColor: "bg-green-600 hover:bg-green-700",
  },
];

export function ExportSelector({ projectId, onExportComplete }: ExportSelectorProps) {
  const [exportingPlatform, setExportingPlatform] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<{ url: string; platform: string } | null>(null);

  const exportMutation = api.export.export.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully exported for ${data.platform}!`);
      setExportResult({ url: data.downloadUrl, platform: data.platform });
      setExportingPlatform(null);
      onExportComplete?.(data.downloadUrl, data.platform);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to export images");
      setExportingPlatform(null);
    },
  });

  const handleExport = (platform: "amazon" | "ebay" | "etsy" | "shopify") => {
    setExportingPlatform(platform);
    setExportResult(null);
    exportMutation.mutate({
      projectId,
      platform,
    });
  };

  const handleDownload = () => {
    if (exportResult) {
      window.open(exportResult.url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <p className="text-xl text-gray-700 dark:text-gray-300">
          Select a marketplace platform to export your images in the correct format and size requirements for each platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => {
          const isExporting = exportingPlatform === platform.id;
          const isComplete = exportResult?.platform === platform.id;

          return (
            <motion.div
              key={platform.id}
              whileHover={{ scale: 1.02 }}
              className={`border-4 rounded-3xl p-8 ${platform.color} transition-all shadow-xl ${
                isComplete ? "ring-4 ring-green-500 ring-offset-2" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    {platform.icon}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {platform.name}
                    </h4>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-semibold">
                      {platform.spec.mainImage.width} × {platform.spec.mainImage.height}px
                    </p>
                  </div>
                </div>
                {isComplete && (
                  <div className="px-4 py-2 bg-green-500 text-white rounded-xl text-lg font-bold">
                    ✓ Ready
                  </div>
                )}
              </div>

              <div className="mb-6 bg-white/60 dark:bg-gray-800/60 rounded-2xl p-5">
                <div className="flex items-start gap-3 text-base text-gray-700 dark:text-gray-300">
                  <Info className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-semibold">
                      Main Image: <span className="font-normal">{platform.spec.mainImage.width} × {platform.spec.mainImage.height}px</span>
                    </p>
                    <p className="font-semibold">
                      Additional: <span className="font-normal">Up to {platform.spec.additionalImages.maxCount} images</span>
                    </p>
                    <p className="font-semibold">
                      Format: <span className="font-normal uppercase">{platform.spec.mainImage.format}</span>
                    </p>
                  </div>
                </div>
              </div>

              {isComplete ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  className={`w-full ${platform.buttonColor} text-white px-6 py-4 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all`}
                >
                  <Download className="h-6 w-6" />
                  Download ZIP File
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExport(platform.id)}
                  disabled={isExporting || exportMutation.isPending}
                  className={`w-full ${platform.buttonColor} text-white px-6 py-4 rounded-2xl text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all`}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-6 w-6" />
                      <span>Export for {platform.name}</span>
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

