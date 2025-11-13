"use client";

/**
 * Brand kits list page
 */

import { api } from "@/lib/trpc/react";
import { useRouter } from "next/navigation";
import { Plus, Palette, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function BrandKitsPage() {
  const router = useRouter();
  const { data: brandKits, isLoading } = api.brandKit.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Brand Kits</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your brand identity systems
          </p>
        </div>
        <Link
          href="/brand-kits/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-5 w-5" />
          Create Brand Kit
        </Link>
      </div>

      {!brandKits || brandKits.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Palette className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No brand kits yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first brand kit to get started
          </p>
          <Link
            href="/brand-kits/new"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Create Brand Kit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brandKits.map((kit) => (
            <Link
              key={kit.id}
              href={`/brand-kits/${kit.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {kit.name}
                </h3>
                {kit.isDefault && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Default
                  </span>
                )}
              </div>

              {kit.logoUrl && (
                <div className="mb-4">
                  <img
                    src={kit.logoUrl}
                    alt={`${kit.name} logo`}
                    className="h-16 w-16 object-contain"
                  />
                </div>
              )}

              <div className="flex gap-2 mb-4">
                {kit.primaryColor && (
                  <div
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: kit.primaryColor }}
                    title={`Primary: ${kit.primaryColor}`}
                  />
                )}
                {kit.secondaryColor && (
                  <div
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: kit.secondaryColor }}
                    title={`Secondary: ${kit.secondaryColor}`}
                  />
                )}
                {kit.accentColor && (
                  <div
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: kit.accentColor }}
                    title={`Accent: ${kit.accentColor}`}
                  />
                )}
              </div>

              {kit.fontFamily && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Font: {kit.fontFamily}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

