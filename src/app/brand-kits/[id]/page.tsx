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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!brandKit) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Brand kit not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The brand kit you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/brand-kits"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Brand Kits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/brand-kits"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Brand Kits
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {brandKit.name}
            </h1>
            {brandKit.isDefault && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <Star className="h-4 w-4" />
                  Default Brand Kit
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!brandKit.isDefault && (
              <button
                onClick={handleSetDefault}
                disabled={setDefault.isPending}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <Star className="h-4 w-4" />
                Set as Default
              </button>
            )}
            <Link
              href={`/brand-kits/${brandKitId}/edit`}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteBrandKit.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Brand Kit Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Brand Kit Details
        </h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brandKit.logoUrl && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Logo</dt>
              <dd>
                <img
                  src={brandKit.logoUrl}
                  alt={`${brandKit.name} logo`}
                  className="h-24 w-24 object-contain"
                />
              </dd>
            </div>
          )}
          {brandKit.primaryColor && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Primary Color
              </dt>
              <dd className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: brandKit.primaryColor }}
                />
                <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {brandKit.primaryColor}
                </span>
              </dd>
            </div>
          )}
          {brandKit.secondaryColor && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Secondary Color
              </dt>
              <dd className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: brandKit.secondaryColor }}
                />
                <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {brandKit.secondaryColor}
                </span>
              </dd>
            </div>
          )}
          {brandKit.accentColor && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Accent Color
              </dt>
              <dd className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: brandKit.accentColor }}
                />
                <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {brandKit.accentColor}
                </span>
              </dd>
            </div>
          )}
          {brandKit.fontFamily && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Font Family</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {brandKit.fontFamily}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {new Date(brandKit.createdAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {new Date(brandKit.updatedAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

