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
      whileHover={{ y: -10 }}
      className="relative group"
    >
      <div className="flex flex-col items-center text-center">
        {/* Step Number - Golden */}
        <motion.div
          className="relative w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg"
          whileHover={{
            scale: 1.1,
            rotate: [0, -5, 5, 0],
            boxShadow: "0 20px 25px -5px rgba(251, 191, 36, 0.4), 0 10px 10px -5px rgba(251, 191, 36, 0.3)",
          }}
          transition={{ duration: 0.3 }}
        >
          {number}
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-400/30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: delay,
            }}
          />
        </motion.div>

        {/* Icon - Golden */}
        <motion.div
          className="relative w-20 h-20 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-amber-900/10 rounded-2xl flex items-center justify-center mb-4 border-2 border-amber-200/70 dark:border-amber-900/30 group-hover:border-amber-400 dark:group-hover:border-amber-600 transition-colors overflow-hidden"
          whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-amber-200/50 to-transparent dark:from-amber-600/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          />
          {icon}
        </motion.div>

        {/* Content */}
        <motion.h3
          className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
          whileHover={{ scale: 1.05 }}
        >
          {title}
        </motion.h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-xs">
          {description}
        </p>

        {/* Floating glow effect - Golden */}
        <motion.div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-amber-300/20 dark:bg-amber-600/10 rounded-full blur-3xl -z-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: delay,
          }}
        />
      </div>

      {/* Connector Line - Golden */}
      {number < 4 && (
        <motion.div
          className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-amber-600 to-amber-300 -z-10 overflow-hidden"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: delay + 0.3 }}
        >
          <motion.div
            className="h-full w-8 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: delay,
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export const HowItWorks = (): React.ReactElement => {
  const steps = [
    {
      title: "Upload Your Product",
      description: "Upload 1-10 product photos. Our AI handles the rest - no design skills needed.",
      icon: <Upload className="w-10 h-10 text-amber-700" />,
    },
    {
      title: "AI Generates Content",
      description: "Advanced AI creates professional images, infographics, A+ content, and more in under 2 minutes.",
      icon: <Wand2 className="w-10 h-10 text-amber-700" />,
    },
    {
      title: "Review & Customize",
      description: "Preview all generated assets. Make tweaks with our simple editor or regenerate instantly.",
      icon: <Download className="w-10 h-10 text-amber-700" />,
    },
    {
      title: "Launch & Sell More",
      description: "Export Amazon-ready files or publish directly. Watch your conversion rates soar.",
      icon: <Rocket className="w-10 h-10 text-amber-700" />,
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

        {/* CTA - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/auth/signin"
              className="relative inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-10 py-5 rounded-xl text-lg font-bold shadow-2xl hover:shadow-amber-600/50 transition-all duration-300 overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%', skewX: -20 }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative z-10">Start Creating Now</span>
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative z-10"
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(251, 191, 36, 0)',
                    '0 0 0 10px rgba(251, 191, 36, 0.15)',
                    '0 0 0 0 rgba(251, 191, 36, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
