"use client";

/**
 * Pricing Page
 * 
 * Displays subscription plans for users to choose from
 */

import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Select the perfect plan for your business needs. All plans include our AI-powered image generation
          and A+ content creation tools.
        </p>
      </div>

      {/* Subscription Plans */}
      <SubscriptionPlans />

      {/* Additional Info */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Need help choosing?{" "}
          <Link href="/billing" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
            View your current subscription
          </Link>
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

