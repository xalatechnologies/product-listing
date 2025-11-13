"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

interface PricingTierProps {
  readonly name: string;
  readonly price: string;
  readonly period: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly highlighted?: boolean;
  readonly icon: React.ReactNode;
  readonly delay: number;
}

const PricingTier = ({
  name,
  price,
  period,
  description,
  features,
  highlighted = false,
  icon,
  delay,
}: PricingTierProps): React.ReactElement => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative ${highlighted ? 'md:-mt-8 md:mb-8' : ''}`}
    >
      {/* Popular badge */}
      {highlighted && (
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold shadow-lg">
            <Sparkles className="w-4 h-4" />
            Most Popular
          </div>
        </div>
      )}

      <motion.div
        animate={{
          scale: isHovered ? 1.03 : 1,
        }}
        transition={{ duration: 0.3 }}
        className={`h-full p-8 rounded-2xl border-2 ${
          highlighted
            ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-500 dark:border-blue-400 shadow-2xl'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl'
        } transition-all duration-300`}
      >
        {/* Icon */}
        <motion.div
          animate={{
            rotate: isHovered ? 5 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="inline-flex mb-6"
        >
          {icon}
        </motion.div>

        {/* Plan name */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {name}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{description}</p>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gray-900 dark:text-white">
              {price}
            </span>
            <span className="text-gray-600 dark:text-gray-400">{period}</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/auth/signin"
          className={`block w-full text-center py-4 px-6 rounded-xl font-semibold transition-all duration-300 mb-8 ${
            highlighted
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
          }`}
        >
          Get Started
        </Link>

        {/* Features */}
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: delay + 0.1 * index }}
              className="flex items-start gap-3"
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                highlighted
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                <Check className={`w-4 h-4 ${
                  highlighted ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`} />
              </div>
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
};

export const PricingSection = (): React.ReactElement => {
  const plans = [
    {
      name: "Starter",
      price: "$19",
      period: "/month",
      description: "Perfect for individual sellers getting started",
      icon: <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      features: [
        "10 product listings per month",
        "AI image generation",
        "Basic brand kit",
        "A+ content templates",
        "Email support",
        "Standard quality",
      ],
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      description: "For growing businesses and power sellers",
      icon: <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
      features: [
        "50 product listings per month",
        "Advanced AI image generation",
        "Full brand kit customization",
        "Premium A+ content modules",
        "Priority support",
        "HD quality images",
        "Bulk processing",
        "SEO optimization",
      ],
      highlighted: true,
    },
    {
      name: "Agency",
      price: "$199",
      period: "/month",
      description: "For agencies managing multiple brands",
      icon: <Sparkles className="w-8 h-8 text-orange-600 dark:text-orange-400" />,
      features: [
        "Unlimited product listings",
        "Custom AI model training",
        "Multiple brand kits",
        "White-label options",
        "Dedicated account manager",
        "4K quality images",
        "API access",
        "Custom integrations",
        "Advanced analytics",
      ],
    },
  ];

  return (
    <section
      id="pricing"
      className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
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
            Simple, Transparent
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
            Choose the perfect plan for your business. All plans include a 14-day
            free trial with no credit card required.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingTier
              key={plan.name}
              name={plan.name}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={plan.features}
              highlighted={plan.highlighted}
              icon={plan.icon}
              delay={index * 0.2}
            />
          ))}
        </div>

        {/* Money back guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 dark:text-gray-400">
            💯 30-day money-back guarantee on all plans
          </p>
        </motion.div>
      </div>
    </section>
  );
};
