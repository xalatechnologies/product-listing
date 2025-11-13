"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Users,
  Globe2,
  Award,
} from "lucide-react";

interface FeatureProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly metric?: string;
  readonly delay: number;
}

const Feature = ({ icon, title, description, metric, delay }: FeatureProps): React.ReactElement => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-600 dark:hover:border-orange-600 transition-colors duration-300"
    >
      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      <p className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
        {description}
      </p>

      {metric && (
        <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
          {metric}
        </div>
      )}
    </motion.div>
  );
};

export const BusinessFeatures = (): React.ReactElement => {
  const features = [
    {
      icon: <DollarSign className="w-6 h-6 text-orange-600" />,
      title: "Increase Revenue",
      description: "Better images = higher conversion rates. Our customers see an average 47% increase in sales.",
      metric: "+47% Sales",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-orange-600" />,
      title: "Reduce Time to Market",
      description: "Launch new products 10x faster. What took days now takes minutes.",
      metric: "10x Faster",
    },
    {
      icon: <Zap className="w-6 h-6 text-orange-600" />,
      title: "Save on Design Costs",
      description: "Eliminate expensive freelancers. Save $2,000+ per month on design work.",
      metric: "$2K+ Saved",
    },
    {
      icon: <Shield className="w-6 h-6 text-orange-600" />,
      title: "Amazon Compliant",
      description: "100% compliance guaranteed. All images meet Amazon's strict technical requirements.",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
      title: "Data-Driven Optimization",
      description: "AI analyzes top-performing listings to create content proven to convert.",
    },
    {
      icon: <Users className="w-6 h-6 text-orange-600" />,
      title: "Team Collaboration",
      description: "Built for teams. Multiple users, approval workflows, and centralized brand assets.",
    },
    {
      icon: <Globe2 className="w-6 h-6 text-orange-600" />,
      title: "Multi-Marketplace",
      description: "One platform for Amazon, Shopify, eBay, Etsy, Walmart, and more.",
    },
    {
      icon: <Award className="w-6 h-6 text-orange-600" />,
      title: "White-Label Ready",
      description: "Perfect for agencies. White-label options and API access available.",
    },
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Built for Business Growth
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Every feature designed to help you sell more, save time, and scale faster
            on Amazon and beyond.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              metric={feature.metric}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700"
        >
          {[
            { value: "98%", label: "Customer Satisfaction" },
            { value: "24/7", label: "Support Available" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "SOC 2", label: "Certified" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-500 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
