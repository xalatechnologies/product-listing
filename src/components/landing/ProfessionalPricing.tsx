"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Zap, Crown, Building2 } from "lucide-react";

interface PricingTierProps {
  readonly name: string;
  readonly price: string;
  readonly period: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly highlighted?: boolean;
  readonly icon: React.ReactNode;
  readonly badge?: string;
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
  badge,
  delay,
}: PricingTierProps): React.ReactElement => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 ${
        highlighted
          ? "border-orange-600 shadow-2xl scale-105"
          : "border-gray-200 dark:border-gray-700 shadow-lg"
      } p-8`}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            {badge}
          </div>
        </div>
      )}

      {/* Icon & Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {name}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {description}
      </p>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-gray-900 dark:text-white">
            {price}
          </span>
          <span className="text-gray-600 dark:text-gray-400">{period}</span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/auth/signin"
        className={`block w-full text-center py-4 px-6 rounded-lg font-semibold mb-8 transition-all duration-200 ${
          highlighted
            ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl"
            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
        }`}
      >
        Start Free Trial
      </Link>

      {/* Features */}
      <ul className="space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export const ProfessionalPricing = (): React.ReactElement => {
  const plans = [
    {
      name: "Starter",
      price: "$19",
      period: "/month",
      description: "Perfect for individual sellers testing the waters",
      icon: <Zap className="w-6 h-6 text-orange-600" />,
      features: [
        "10 product listings per month",
        "All AI image generation tools",
        "Basic A+ content templates",
        "Amazon & Shopify export",
        "Email support",
        "14-day free trial",
      ],
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      description: "For growing businesses and power sellers",
      icon: <Crown className="w-6 h-6 text-orange-600" />,
      badge: "Most Popular",
      highlighted: true,
      features: [
        "50 product listings per month",
        "Advanced AI with custom styles",
        "Premium A+ content modules",
        "All marketplace exports",
        "Brand Kit (unlimited)",
        "Priority support",
        "Team collaboration (3 users)",
        "API access",
      ],
    },
    {
      name: "Agency",
      price: "$199",
      period: "/month",
      description: "For agencies and large-scale operations",
      icon: <Building2 className="w-6 h-6 text-orange-600" />,
      features: [
        "Unlimited product listings",
        "White-label capabilities",
        "Custom AI model training",
        "Unlimited brand kits",
        "Dedicated account manager",
        "Phone & chat support",
        "Unlimited team members",
        "Full API access",
        "Custom integrations",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-gray-900">
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
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your business. All plans include a 14-day free
            trial with full access.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button className="px-6 py-2 rounded-md font-semibold bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm">
              Monthly
            </button>
            <button className="px-6 py-2 rounded-md font-semibold text-gray-600 dark:text-gray-400">
              Annual <span className="text-orange-600">(Save 20%)</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
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
              badge={plan.badge}
              delay={index * 0.2}
            />
          ))}
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-8 text-center text-white"
        >
          <h3 className="text-3xl font-bold mb-4">Enterprise Solutions</h3>
          <p className="text-xl mb-6 opacity-90">
            Need custom pricing, dedicated infrastructure, or special requirements?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact Sales Team
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center text-gray-600 dark:text-gray-400"
        >
          <p>✓ No credit card required • ✓ 14-day free trial • ✓ Cancel anytime • ✓ 30-day money-back guarantee</p>
        </motion.div>
      </div>
    </section>
  );
};
