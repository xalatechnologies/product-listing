"use client";

/**
 * New brand kit creation page
 */

import { BrandKitForm } from "@/components/BrandKitForm";

export default function NewBrandKitPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Brand Kit</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Define your brand identity system
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <BrandKitForm />
      </div>
    </div>
  );
}

