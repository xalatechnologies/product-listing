"use client";

/**
 * Brand kits list page
 */

import { api } from "@/lib/trpc/react";
import { useRouter } from "next/navigation";
import { Plus, Palette, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";

export default function BrandKitsPage() {
  const router = useRouter();
  const { data: brandKits, isLoading } = api.brandKit.list.useQuery();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600 bg-clip-text text-transparent mb-3">
              Brand Kits
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-xl">
              Manage your brand identity systems
            </p>
          </div>
          <Link
            href="/brand-kits/new"
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-blue-600 px-8 py-4 text-base font-bold text-white shadow-2xl hover:shadow-amber-500/50 transition-all"
          >
            <Plus className="h-6 w-6" />
            Create Brand Kit
          </Link>
        </div>

        {!brandKits || brandKits.length === 0 ? (
          <div className="text-center py-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
            <Palette className="h-24 w-24 mx-auto text-gray-400 dark:text-gray-500 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No brand kits yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-base mb-8">
              Create your first brand kit to get started
            </p>
            <Link
              href="/brand-kits/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Create Brand Kit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brandKits.map((kit) => (
              <Link
                key={kit.id}
                href={`/brand-kits/${kit.id}`}
                className="group block bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-2xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {kit.name}
                  </h3>
                  {kit.isDefault && (
                    <span className="px-4 py-2 text-sm font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-blue-500/20">
                      Default
                    </span>
                  )}
                </div>

                {kit.logoUrl && (
                  <div className="mb-6">
                    <img
                      src={kit.logoUrl}
                      alt={`${kit.name} logo`}
                      className="h-20 w-20 object-contain"
                    />
                  </div>
                )}

                <div className="flex gap-3 mb-6">
                  {kit.primaryColor && (
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md"
                      style={{ backgroundColor: kit.primaryColor }}
                      title={`Primary: ${kit.primaryColor}`}
                    />
                  )}
                  {kit.secondaryColor && (
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md"
                      style={{ backgroundColor: kit.secondaryColor }}
                      title={`Secondary: ${kit.secondaryColor}`}
                    />
                  )}
                  {kit.accentColor && (
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-md"
                      style={{ backgroundColor: kit.accentColor }}
                      title={`Accent: ${kit.accentColor}`}
                    />
                  )}
                </div>

                {kit.fontFamily && (
                  <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                    Font: {kit.fontFamily}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

