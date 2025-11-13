"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Package, Store, Smartphone, Building2, Globe } from "lucide-react";

interface PlatformCardProps {
  readonly name: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly color: string;
  readonly delay: number;
  readonly comingSoon?: boolean;
}

const PlatformCard = ({
  name,
  description,
  icon,
  color,
  delay,
  comingSoon,
}: PlatformCardProps): React.ReactElement => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <div className={`h-full p-6 bg-white dark:bg-gray-800 rounded-xl border-2 ${color} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
        {comingSoon && (
          <div className="absolute top-4 right-4 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded">
            Coming Soon
          </div>
        )}

        <div className="mb-4">{icon}</div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {name}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export const PlatformsSection = (): React.ReactElement => {
  const platforms = [
    {
      name: "Amazon",
      description: "Generate A+ content, infographics, and Amazon-compliant listing images.",
      icon: <ShoppingBag className="w-10 h-10 text-orange-600 dark:text-orange-400" />,
      color: "border-orange-200 dark:border-orange-800 hover:border-orange-400",
    },
    {
      name: "Shopify",
      description: "Create stunning product images optimized for your Shopify store.",
      icon: <Store className="w-10 h-10 text-green-600 dark:text-green-400" />,
      color: "border-green-200 dark:border-green-800 hover:border-green-400",
    },
    {
      name: "eBay",
      description: "Professional listing images that stand out in eBay search results.",
      icon: <Package className="w-10 h-10 text-blue-600 dark:text-blue-400" />,
      color: "border-blue-200 dark:border-blue-800 hover:border-blue-400",
    },
    {
      name: "Etsy",
      description: "Artistic and brand-consistent product photos for your Etsy shop.",
      icon: <Globe className="w-10 h-10 text-orange-500 dark:text-orange-300" />,
      color: "border-orange-200 dark:border-orange-800 hover:border-orange-400",
    },
    {
      name: "Walmart",
      description: "Walmart Marketplace-ready images with all required specifications.",
      icon: <Building2 className="w-10 h-10 text-blue-700 dark:text-blue-500" />,
      color: "border-blue-200 dark:border-blue-800 hover:border-blue-400",
      comingSoon: true,
    },
    {
      name: "TikTok Shop",
      description: "Eye-catching product visuals optimized for TikTok Shop conversions.",
      icon: <Smartphone className="w-10 h-10 text-pink-600 dark:text-pink-400" />,
      color: "border-pink-200 dark:border-pink-800 hover:border-pink-400",
      comingSoon: true,
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Sell Everywhere,
            <span className="block bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
              Optimize Everything
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
            One platform to create professional product listings for all major
            e-commerce marketplaces. Export optimized images in the perfect format
            for each platform.
          </p>
        </motion.div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {platforms.map((platform, index) => (
            <PlatformCard
              key={platform.name}
              name={platform.name}
              description={platform.description}
              icon={platform.icon}
              color={platform.color}
              delay={index * 0.1}
              comingSoon={platform.comingSoon}
            />
          ))}
        </div>

        {/* Export formats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 p-8 bg-gradient-to-r from-orange-50 via-blue-50 to-green-50 dark:from-orange-900/10 dark:via-blue-900/10 dark:to-green-900/10 rounded-2xl border border-orange-200 dark:border-orange-800"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Smart Export System
          </h3>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            Each platform has unique requirements. We automatically optimize and
            export your images in the correct format, size, and specifications.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="font-semibold text-orange-600 dark:text-orange-400">Auto-Resize</div>
              <div className="text-gray-600 dark:text-gray-400">Platform-specific dimensions</div>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="font-semibold text-blue-600 dark:text-blue-400">Format Convert</div>
              <div className="text-gray-600 dark:text-gray-400">JPG, PNG, WebP support</div>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="font-semibold text-green-600 dark:text-green-400">Bulk Export</div>
              <div className="text-gray-600 dark:text-gray-400">Download ready-to-upload ZIP</div>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="font-semibold text-purple-600 dark:text-purple-400">Compliance Check</div>
              <div className="text-gray-600 dark:text-gray-400">Platform guidelines validated</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
