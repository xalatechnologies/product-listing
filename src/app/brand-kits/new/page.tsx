"use client";

/**
 * New brand kit creation page
 */

import { BrandKitForm } from "@/components/BrandKitForm";
import { AppLayout } from "@/components/AppLayout";

export default function NewBrandKitPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600 bg-clip-text text-transparent mb-4">
            Create Brand Kit
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xl">
            Define your brand identity system
          </p>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-10 shadow-2xl">
          <BrandKitForm />
        </div>
      </div>
    </AppLayout>
  );
}

