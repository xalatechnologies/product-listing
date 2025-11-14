"use client";

/**
 * A+ Content Preview Component
 * 
 * Displays A+ content modules in a preview format
 */

import { APlusModule } from "./APlusEditor";

interface APlusPreviewProps {
  modules: APlusModule[];
  brandKit?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
  } | null;
}

export function APlusPreview({ modules, brandKit }: APlusPreviewProps) {
  if (modules.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">No modules to preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        A+ Content Preview
      </h3>

      <div className="space-y-8">
        {modules.map((module, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{
              maxWidth: "970px",
              margin: "0 auto",
            }}
          >
            {/* Module Header */}
            <div
              className="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
              style={{
                backgroundColor: brandKit?.primaryColor
                  ? `${brandKit.primaryColor}15`
                  : undefined,
              }}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Module {index + 1}: {module.type}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {module.templateId || "Default Template"}
                </span>
              </div>
            </div>

            {/* Module Content */}
            <div className="p-6">
              {module.content.headline && (
                <h5
                  className="text-2xl font-bold mb-4"
                  style={{
                    color: brandKit?.primaryColor || undefined,
                  }}
                >
                  {module.content.headline}
                </h5>
              )}

              {module.content.bodyText && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {module.content.bodyText}
                </p>
              )}

              {module.content.bullets && module.content.bullets.length > 0 && (
                <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
                  {module.content.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}

              {module.content.sidebar && module.content.sidebar.length > 0 && (
                <div
                  className="mt-4 p-4 rounded-lg"
                  style={{
                    backgroundColor: brandKit?.secondaryColor
                      ? `${brandKit.secondaryColor}10`
                      : "#f5f5f5",
                  }}
                >
                  <h6 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    Key Features
                  </h6>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {module.content.sidebar.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {module.content.specifications &&
                Object.keys(module.content.specifications).length > 0 && (
                  <div className="mt-4">
                    <h6 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      Specifications
                    </h6>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(module.content.specifications).map(([key, value]) => (
                        <div key={key}>
                          <dt className="font-medium text-gray-700 dark:text-gray-300">{key}</dt>
                          <dd className="text-gray-600 dark:text-gray-400">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

              {module.content.imageDescriptions && module.content.imageDescriptions.length > 0 && (
                <div className="mt-4">
                  <h6 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    Images
                  </h6>
                  <div className="grid grid-cols-2 gap-2">
                    {module.content.imageDescriptions.map((desc, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 p-2 text-center"
                      >
                        {desc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


