"use client";

/**
 * Export History Component
 * 
 * Displays past exports for a project with download links
 */

import { api } from "@/lib/trpc/react";
import { Download, Calendar, Package, FileArchive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface ExportHistoryProps {
  projectId: string;
}

const platformIcons = {
  AMAZON: "🛒",
  EBAY: "📦",
  ETSY: "🏪",
  SHOPIFY: "🛍️",
};

const platformColors = {
  AMAZON: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100",
  EBAY: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
  ETSY: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-100",
  SHOPIFY: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExportHistory({ projectId }: ExportHistoryProps) {
  const { data: exports, isLoading } = api.export.getHistory.useQuery({
    projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
            <FileArchive className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Export History
          </h3>
        </div>
        <div className="text-xl text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
          Loading export history...
        </div>
      </div>
    );
  }

  if (!exports || exports.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
            <FileArchive className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Export History
          </h3>
        </div>
        <div className="text-xl text-gray-600 dark:text-gray-400 border-4 border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center bg-gray-50 dark:bg-gray-800">
          No exports yet. Export your images to see them here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
          <FileArchive className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Export History
        </h3>
        <span className="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-xl text-lg font-bold">
          {exports.length} {exports.length === 1 ? "export" : "exports"}
        </span>
      </div>
      <div className="space-y-4">
        {exports.map((exp) => (
          <motion.div
            key={exp.id}
            whileHover={{ scale: 1.01 }}
            className={`border-4 rounded-3xl p-6 ${platformColors[exp.platform] || "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"} shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-5 flex-1">
                <div className="text-4xl">{platformIcons[exp.platform] || "📦"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-2xl font-bold capitalize">
                      {exp.platform.toLowerCase()}
                    </h4>
                    <span className="px-4 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-xl text-lg font-semibold">
                      {exp.imageCount} {exp.imageCount === 1 ? "image" : "images"}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(exp.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileArchive className="h-5 w-5" />
                      <span className="font-medium">{formatFileSize(exp.fileSize)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={exp.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 rounded-2xl text-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl"
              >
                <Download className="h-6 w-6" />
                Download
              </motion.a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

