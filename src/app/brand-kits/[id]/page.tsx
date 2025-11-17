"use client";

/**
 * Brand kit detail page
 */

import { use } from "react";
import { api } from "@/lib/trpc/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Star } from "lucide-react";
import { toast } from "react-toastify";
import { AppLayout } from "@/components/AppLayout";

interface BrandKitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BrandKitDetailPage({ params }: BrandKitDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const brandKitId = resolvedParams.id;

  const { data: brandKit, isLoading } = api.brandKit.get.useQuery({ id: brandKitId });

  const deleteBrandKit = api.brandKit.delete.useMutation({
    onSuccess: () => {
      toast.success("Brand kit deleted");
      router.push("/brand-kits");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete brand kit");
    },
  });

  const setDefault = api.brandKit.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Brand kit set as default");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to set default brand kit");
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this brand kit? This action cannot be undone.")) {
      deleteBrandKit.mutate({ id: brandKitId });
    }
  };

  const handleSetDefault = () => {
    setDefault.mutate({ id: brandKitId });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600" />
        </div>
      </AppLayout>
    );
  }

  if (!brandKit) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Brand kit not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The brand kit you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/brand-kits"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Brand Kits
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/brand-kits"
            className="inline-flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 mb-8 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Brand Kits
          </Link>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-600 via-orange-500 to-blue-600 bg-clip-text text-transparent mb-3">
                {brandKit.name}
              </h1>
              {brandKit.isDefault && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-base font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-blue-500/20">
                    <Star className="h-5 w-5" />
                    Default Brand Kit
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!brandKit.isDefault && (
                <button
                  onClick={handleSetDefault}
                  disabled={setDefault.isPending}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-md"
                >
                  <Star className="h-5 w-5" />
                  Set as Default
                </button>
              )}
              <Link
                href={`/brand-kits/${brandKitId}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-md"
              >
                <Edit className="h-5 w-5" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteBrandKit.isPending}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 px-6 py-3 text-base font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors shadow-md"
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Brand Kit Details */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 shadow-2xl">
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 mb-8">
            Brand Kit Details
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {brandKit.logoUrl && (
              <div className="md:col-span-2">
                <dt className="text-base font-bold text-gray-500 dark:text-gray-400 mb-3">Logo</dt>
                <dd>
                  <img
                    src={brandKit.logoUrl}
                    alt={`${brandKit.name} logo`}
                    className="h-32 w-32 object-contain"
                  />
                </dd>
              </div>
            )}
            {brandKit.primaryColor && (
              <div>
                <dt className="text-base font-bold text-gray-500 dark:text-gray-400 mb-3">
                  Primary Color
                </dt>
                <dd className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-lg"
                    style={{ backgroundColor: brandKit.primaryColor }}
                  />
                  <span className="text-base text-gray-900 dark:text-gray-100 font-mono font-semibold">
                    {brandKit.primaryColor}
                  </span>
                </dd>
              </div>
            )}
            {brandKit.secondaryColor && (
              <div>
                <dt className="text-base font-bold text-gray-500 dark:text-gray-400 mb-3">
                  Secondary Color
                </dt>
                <dd className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-lg"
                    style={{ backgroundColor: brandKit.secondaryColor }}
                  />
                  <span className="text-base text-gray-900 dark:text-gray-100 font-mono font-semibold">
                    {brandKit.secondaryColor}
                  </span>
                </dd>
              </div>
            )}
            {brandKit.accentColor && (
              <div>
                <dt className="text-base font-bold text-gray-500 dark:text-gray-400 mb-3">
                  Accent Color
                </dt>
                <dd className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-lg"
                    style={{ backgroundColor: brandKit.accentColor }}
                  />
                  <span className="text-base text-gray-900 dark:text-gray-100 font-mono font-semibold">
                    {brandKit.accentColor}
                  </span>
                </dd>
              </div>
            )}
            {brandKit.fontFamily && (
              <div>
                <dt className="text-base font-bold text-gray-500 dark:text-gray-400 mb-3">Font Family</dt>
                <dd className="text-base text-gray-900 dark:text-gray-100 font-semibold">
                  {brandKit.fontFamily}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-base font-bold text-gray-500 dark:text-gray-400 mb-3">Created</dt>
              <dd className="text-base text-gray-900 dark:text-gray-100 font-semibold">
                {new Date(brandKit.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-base font-bold text-gray-500 dark:text-gray-400 mb-3">Last Updated</dt>
              <dd className="text-base text-gray-900 dark:text-gray-100 font-semibold">
                {new Date(brandKit.updatedAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AppLayout>
  );
}

