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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Export for Marketplace
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select a platform to export your images in the correct format and size requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const isExporting = exportingPlatform === platform.id;
          const isComplete = exportResult?.platform === platform.id;

          return (
            <div
              key={platform.id}
              className={`border-2 rounded-lg p-4 ${platform.color} transition-all ${
                isComplete ? "ring-2 ring-green-500" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">{platform.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {platform.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {platform.spec.mainImage.width}x{platform.spec.mainImage.height}px
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Main: {platform.spec.mainImage.width}x{platform.spec.mainImage.height}px</p>
                    <p>Additional: Up to {platform.spec.additionalImages.maxCount} images</p>
                    <p>Format: {platform.spec.mainImage.format}</p>
                  </div>
                </div>
              </div>

              {isComplete ? (
                <button
                  onClick={handleDownload}
                  className={`w-full ${platform.buttonColor} text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2`}
                >
                  <Download className="h-4 w-4" />
                  Download ZIP
                </button>
              ) : (
                <button
                  onClick={() => handleExport(platform.id)}
                  disabled={isExporting || exportMutation.isPending}
                  className={`w-full ${platform.buttonColor} text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export for {platform.name}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

