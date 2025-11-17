"use client";

/**
 * Edit brand kit page
 */

import { use } from "react";
import { api } from "@/lib/trpc/react";
import { BrandKitForm } from "@/components/BrandKitForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

interface EditBrandKitPageProps {
  params: Promise<{ id: string }>;
}

export default function EditBrandKitPage({ params }: EditBrandKitPageProps) {
  const resolvedParams = use(params);
  const brandKitId = resolvedParams.id;

  const { data: brandKit, isLoading } = api.brandKit.get.useQuery({ id: brandKitId });

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
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/brand-kits/${brandKitId}`}
          className="inline-flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Brand Kit
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600 bg-clip-text text-transparent mb-4">
            Edit Brand Kit
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xl">
            Update your brand identity system
          </p>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-10 shadow-2xl">
          <BrandKitForm
            brandKitId={brandKitId}
            initialData={{
              name: brandKit.name,
              logoUrl: brandKit.logoUrl || undefined,
              primaryColor: brandKit.primaryColor || undefined,
              secondaryColor: brandKit.secondaryColor || undefined,
              accentColor: brandKit.accentColor || undefined,
              fontFamily: brandKit.fontFamily || undefined,
            }}
            onSuccess={() => {
              window.location.href = `/brand-kits/${brandKitId}`;
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}

