"use client";

/**
 * Edit brand kit page
 */

import { use } from "react";
import { api } from "@/lib/trpc/react";
import { BrandKitForm } from "@/components/BrandKitForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EditBrandKitPageProps {
  params: Promise<{ id: string }>;
}

export default function EditBrandKitPage({ params }: EditBrandKitPageProps) {
  const resolvedParams = use(params);
  const brandKitId = resolvedParams.id;

  const { data: brandKit, isLoading } = api.brandKit.get.useQuery({ id: brandKitId });

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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href={`/brand-kits/${brandKitId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Brand Kit
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Brand Kit</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Update your brand identity system
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
  );
}

