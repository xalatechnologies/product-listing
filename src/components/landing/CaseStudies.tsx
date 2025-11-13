"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, DollarSign, Quote } from "lucide-react";

interface CaseStudyProps {
  readonly company: string;
  readonly industry: string;
  readonly challenge: string;
  readonly results: readonly {
    readonly metric: string;
    readonly value: string;
  }[];
  readonly quote: string;
  readonly author: string;
  readonly role: string;
  readonly delay: number;
}

const CaseStudy = ({
  company,
  industry,
  challenge,
  results,
  quote,
  author,
  role,
  delay,
}: CaseStudyProps): React.ReactElement => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700"
    >
      {/* Company Info */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {company}
        </h3>
        <p className="text-orange-600 dark:text-orange-500 font-semibold">
          {industry}
        </p>
      </div>

      {/* Challenge */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
          Challenge
        </h4>
        <p className="text-gray-700 dark:text-gray-300">
          {challenge}
        </p>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        {results.map((result, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500 mb-1">
              {result.value}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {result.metric}
            </div>
          </div>
        ))}
      </div>

      {/* Quote */}
      <div className="relative">
        <Quote className="w-8 h-8 text-orange-600 opacity-20 absolute -top-2 -left-2" />
        <p className="text-gray-700 dark:text-gray-300 italic mb-4 pl-6">
          "{quote}"
        </p>
        <div className="pl-6">
          <div className="font-semibold text-gray-900 dark:text-white">
            {author}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {role}, {company}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const CaseStudies = (): React.ReactElement => {
  const caseStudies = [
    {
      company: "EcoHome Products",
      industry: "Home & Garden (Amazon & Shopify)",
      challenge:
        "Struggled to create professional product images on a limited budget. Listings had low conversion rates and high bounce rates.",
      results: [
        { metric: "Sales Increase", value: "+127%" },
        { metric: "Time Saved", value: "25 hrs/wk" },
        { metric: "ROI", value: "8x" },
      ],
      quote:
        "We went from spending $5,000/month on freelance designers to generating better images in minutes. Our conversion rate doubled within the first month.",
      author: "Sarah Chen",
      role: "Founder",
    },
    {
      company: "TechGear Pro",
      industry: "Electronics (Amazon, eBay, Walmart)",
      challenge:
        "Needed to launch 50+ new products per month across multiple marketplaces. Traditional design workflows couldn't keep up.",
      results: [
        { metric: "Launch Speed", value: "10x Faster" },
        { metric: "Products/Month", value: "50+" },
        { metric: "Cost Savings", value: "$3.2K" },
      ],
      quote:
        "The ability to generate platform-specific images for Amazon, eBay, and Walmart from a single upload is incredible. We've scaled our catalog without scaling our team.",
      author: "Michael Park",
      role: "Operations Director",
    },
    {
      company: "Boutique Fashion Co",
      industry: "Apparel & Accessories (Etsy, Shopify)",
      challenge:
        "Manual product photography was time-consuming and inconsistent. Brand presentation varied across platforms.",
      results: [
        { metric: "Brand Consistency", value: "100%" },
        { metric: "Avg. Order Value", value: "+34%" },
        { metric: "Return Rate", value: "-18%" },
      ],
      quote:
        "Now every product has the same professional look across Etsy and our Shopify store. Customers recognize our brand instantly, and returns have dropped significantly.",
      author: "Emma Rodriguez",
      role: "Creative Director",
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
            Success Stories
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Real results from businesses like yours selling on Amazon, Shopify, eBay,
            Etsy, and more.
          </p>
        </motion.div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {caseStudies.map((study, index) => (
            <CaseStudy
              key={index}
              company={study.company}
              industry={study.industry}
              challenge={study.challenge}
              results={study.results}
              quote={study.quote}
              author={study.author}
              role={study.role}
              delay={index * 0.2}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
