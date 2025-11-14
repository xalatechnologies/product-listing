"use client";

/**
 * Export History Component
 * 
 * Displays past exports for a project with download links
 */

import { api } from "@/lib/trpc/react";
import { Download, Calendar, Package, FileArchive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Export History
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Loading export history...
        </div>
      </div>
    );
  }

  if (!exports || exports.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Export History
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          No exports yet. Export your images to see them here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Export History
      </h3>
      <div className="space-y-2">
        {exports.map((exp) => (
          <div
            key={exp.id}
            className={`border rounded-lg p-4 ${platformColors[exp.platform] || "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl">{platformIcons[exp.platform] || "📦"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold capitalize">
                      {exp.platform.toLowerCase()}
                    </h4>
                    <span className="text-xs opacity-75">
                      {exp.imageCount} {exp.imageCount === 1 ? "image" : "images"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs opacity-75">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(exp.createdAt), { addSuffix: true })}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileArchive className="h-3 w-3" />
                      {formatFileSize(exp.fileSize)}
                    </div>
                  </div>
                </div>
              </div>
              <a
                href={exp.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

