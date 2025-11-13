"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Upload, Wand2, Download, Rocket, ArrowRight } from "lucide-react";

interface StepProps {
  readonly number: number;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly delay: number;
}

const Step = ({ number, title, description, icon, delay }: StepProps): React.ReactElement => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <div className="flex flex-col items-center text-center">
        {/* Step Number */}
        <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">
          {number}
        </div>

        {/* Icon */}
        <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mb-4">
          {icon}
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-xs">
          {description}
        </p>
      </div>

      {/* Connector Line (except for last item) */}
      {number < 4 && (
        <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-orange-600 to-orange-300 -z-10" />
      )}
    </motion.div>
  );
};

export const HowItWorks = (): React.ReactElement => {
  const steps = [
    {
      title: "Upload Your Product",
      description: "Upload 1-10 product photos. Our AI handles the rest - no design skills needed.",
      icon: <Upload className="w-10 h-10 text-orange-600" />,
    },
    {
      title: "AI Generates Content",
      description: "Advanced AI creates professional images, infographics, A+ content, and more in under 2 minutes.",
      icon: <Wand2 className="w-10 h-10 text-orange-600" />,
    },
    {
      title: "Review & Customize",
      description: "Preview all generated assets. Make tweaks with our simple editor or regenerate instantly.",
      icon: <Download className="w-10 h-10 text-orange-600" />,
    },
    {
      title: "Launch & Sell More",
      description: "Export Amazon-ready files or publish directly. Watch your conversion rates soar.",
      icon: <Rocket className="w-10 h-10 text-orange-600" />,
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-gray-900">
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
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            From product photo to professional listing in 4 simple steps.
            No design experience required.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative">
          {steps.map((step, index) => (
            <Step
              key={index}
              number={index + 1}
              title={step.title}
              description={step.description}
              icon={step.icon}
              delay={index * 0.2}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
