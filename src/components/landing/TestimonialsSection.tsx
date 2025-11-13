"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

interface TestimonialCardProps {
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly content: string;
  readonly rating: number;
  readonly image: string;
  readonly delay: number;
}

const TestimonialCard = ({
  name,
  role,
  company,
  content,
  rating,
  image,
  delay,
}: TestimonialCardProps): React.ReactElement => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <motion.div
        animate={{
          y: isHovered ? -8 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="h-full p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-shadow duration-300"
      >
        {/* Quote icon */}
        <div className="mb-6">
          <Quote className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-50" />
        </div>

        {/* Rating */}
        <div className="flex gap-1 mb-6">
          {[...Array(rating)].map((_, index) => (
            <Star
              key={index}
              className="w-5 h-5 fill-yellow-400 text-yellow-400"
            />
          ))}
        </div>

        {/* Content */}
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8 text-lg">
          "{content}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
            {image}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {name}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {role} at {company}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const TestimonialsSection = (): React.ReactElement => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "CEO",
      company: "Eco Products Co",
      content:
        "This platform revolutionized how we create product listings across Amazon and Shopify. We went from spending 2 hours per listing to just 5 minutes. The AI-generated images are stunning and our conversion rate increased by 47%.",
      rating: 5,
      image: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Marketing Director",
      company: "TechGear Plus",
      content:
        "The brand consistency across all our products is incredible. Our brand kit automatically applies to every listing, and the A+ content looks like it was designed by a professional agency.",
      rating: 5,
      image: "MC",
    },
    {
      name: "Emily Rodriguez",
      role: "Founder",
      company: "Home Essentials",
      content:
        "As a solo entrepreneur selling on Amazon, eBay, and Etsy, this tool is a game-changer. I can compete with big brands without hiring a design team. The ROI has been phenomenal across all platforms.",
      rating: 5,
      image: "ER",
    },
    {
      name: "David Park",
      role: "E-commerce Manager",
      company: "Lifestyle Brands Inc",
      content:
        "We manage 50+ brands and this platform scales perfectly. The bulk processing feature saves us hundreds of hours monthly. Customer support is also outstanding.",
      rating: 5,
      image: "DP",
    },
    {
      name: "Jessica Taylor",
      role: "Product Manager",
      company: "Fashion Forward",
      content:
        "The quality of AI-generated lifestyle images is mind-blowing. Our customers can't tell they're AI-created. Sales have increased by 63% since we started using this platform.",
      rating: 5,
      image: "JT",
    },
    {
      name: "Robert Martinez",
      role: "Operations Lead",
      company: "Global Retail Solutions",
      content:
        "From onboarding to daily use, everything is smooth and intuitive. The 14-day trial convinced us immediately. Best investment we've made for our Amazon business.",
      rating: 5,
      image: "RM",
    },
  ];

  return (
    <section
      id="testimonials"
      className="py-24 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800"
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
            Loved by
            <span className="block bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
              Thousands of Sellers
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
            Join successful e-commerce sellers who are already using our platform to
            scale their business across multiple platforms.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {[
            { value: "10,000+", label: "Active Users" },
            { value: "500K+", label: "Listings Created" },
            { value: "98%", label: "Satisfaction Rate" },
            { value: "47%", label: "Avg. Sales Increase" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              name={testimonial.name}
              role={testimonial.role}
              company={testimonial.company}
              content={testimonial.content}
              rating={testimonial.rating}
              image={testimonial.image}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
