"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItemProps {
  readonly question: string;
  readonly answer: string;
  readonly delay: number;
}

const FAQItem = ({ question, answer, delay }: FAQItemProps): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="border-b border-gray-200 dark:border-gray-700 last:border-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-orange-600 transition-colors"
      >
        <span className="text-lg font-semibold text-gray-900 dark:text-white pr-8">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-orange-600 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FAQ = (): React.ReactElement => {
  const faqs = [
    {
      question: "Which platforms and marketplaces do you support?",
      answer:
        "We support all major e-commerce platforms including Amazon (with A+ content), Shopify, eBay, Etsy, Walmart Marketplace, and TikTok Shop. Each platform has specific image requirements, and our AI automatically optimizes for each one.",
    },
    {
      question: "How long does it take to generate a complete listing?",
      answer:
        "Most listings are generated in under 2 minutes. This includes main images, infographics, lifestyle photos, A+ content modules, and all marketplace-specific formats. Complex A+ content may take up to 5 minutes.",
    },
    {
      question: "Do I need design skills or software?",
      answer:
        "No design skills needed! Simply upload your product photos and our AI handles everything. We provide an optional simple editor for minor tweaks, but most users publish generated content without any changes.",
    },
    {
      question: "Are the images compliant with Amazon's requirements?",
      answer:
        "Yes, 100% guaranteed. All generated images meet Amazon's technical specifications including size, format, background requirements, and content guidelines. We stay updated with platform policy changes.",
    },
    {
      question: "Can I use my own brand colors and logo?",
      answer:
        "Absolutely! Our Brand Kit feature allows you to upload your logo, set brand colors, and define your visual style. All generated content will automatically incorporate your brand identity.",
    },
    {
      question: "What if I'm not satisfied with the generated content?",
      answer:
        "You can regenerate any content with different styles instantly. We also offer a 30-day money-back guarantee on all paid plans. Plus, our support team can help optimize results for your specific products.",
    },
    {
      question: "Do you offer team/agency features?",
      answer:
        "Yes! Professional and Agency plans include multi-user access, role-based permissions, approval workflows, and white-label options. Enterprise plans also include API access for automation.",
    },
    {
      question: "How is pricing calculated?",
      answer:
        "Plans are based on the number of product listings you need per month. Each plan includes unlimited regenerations and all features. We also offer pay-as-you-go credits for occasional users.",
    },
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Everything you need to know about our platform
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              delay={index * 0.05}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@listingai.com"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold"
          >
            Contact our support team →
          </a>
        </motion.div>
      </div>
    </section>
  );
};
