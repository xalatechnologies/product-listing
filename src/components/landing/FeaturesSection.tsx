"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Image,
  Palette,
  Wand2,
  LayoutTemplate,
  Zap,
  Target,
  RefreshCw,
  Shield,
} from "lucide-react";

interface FeatureCardProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly color: string;
  readonly delay: number;
}

const FeatureCard = ({
  icon,
  title,
  description,
  color,
  delay,
}: FeatureCardProps): React.ReactElement => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <div className="h-full p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
        {/* Icon */}
        <motion.div
          animate={{
            scale: isHovered ? 1.1 : 1,
            rotate: isHovered ? 5 : 0,
          }}
          transition={{ duration: 0.3 }}
          className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${color} mb-6`}
        >
          {icon}
        </motion.div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>

        {/* Hover effect border */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className={`absolute bottom-0 left-0 right-0 h-1 ${color.replace('bg-', 'bg-gradient-to-r from-')} rounded-b-2xl`}
          style={{ transformOrigin: "left" }}
        />
      </div>
    </motion.div>
  );
};

export const FeaturesSection = (): React.ReactElement => {
  const features = [
    {
      icon: <Image className="w-7 h-7 text-white" />,
      title: "AI Image Generation",
      description:
        "Generate professional product images with white backgrounds, lifestyle scenes, and feature infographics automatically.",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      icon: <Palette className="w-7 h-7 text-white" />,
      title: "Brand Kit System",
      description:
        "Maintain brand consistency across all listings with custom colors, fonts, and logos automatically applied.",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      icon: <Wand2 className="w-7 h-7 text-white" />,
      title: "A+ Content Builder",
      description:
        "Create stunning Amazon A+ content modules with AI-powered layouts and optimized copy that converts.",
      color: "bg-gradient-to-br from-pink-500 to-pink-600",
    },
    {
      icon: <LayoutTemplate className="w-7 h-7 text-white" />,
      title: "Smart Templates",
      description:
        "Choose from professionally designed templates optimized for different product categories and niches.",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
    },
    {
      icon: <Zap className="w-7 h-7 text-white" />,
      title: "Lightning Fast",
      description:
        "Generate complete listings in seconds, not hours. Our AI processes everything in parallel for maximum speed.",
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
    },
    {
      icon: <Target className="w-7 h-7 text-white" />,
      title: "SEO Optimized",
      description:
        "Every listing is optimized for Amazon's search algorithm with keyword-rich titles and descriptions.",
      color: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
      icon: <RefreshCw className="w-7 h-7 text-white" />,
      title: "Bulk Processing",
      description:
        "Process multiple products simultaneously with our batch generation system. Scale your catalog effortlessly.",
      color: "bg-gradient-to-br from-teal-500 to-teal-600",
    },
    {
      icon: <Shield className="w-7 h-7 text-white" />,
      title: "Quality Assurance",
      description:
        "Every generated asset goes through automated quality checks to ensure professional standards.",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    },
  ];

  return (
    <section
      id="features"
      className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
    >
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
            Everything You Need to
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dominate Amazon
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
            Powerful features designed to help you create professional product
            listings that stand out and convert.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
