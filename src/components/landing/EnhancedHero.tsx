"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useAnimation } from "framer-motion";
import { ArrowRight, CheckCircle2, TrendingUp, Clock, Star, Users, Zap, Sparkles } from "lucide-react";
import Image from "next/image";

export const EnhancedHero = (): React.ReactElement => {
  const [listingsCount, setListingsCount] = useState(87);

  // Animated counter for listings created
  useEffect(() => {
    const interval = setInterval(() => {
      setListingsCount((prev) => (prev >= 95 ? 87 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <section className="relative bg-gradient-to-b from-orange-50 via-white to-gray-50 dark:from-gray-900 dark:to-gray-800 pt-24 pb-16 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(to right, #FF9900 1px, transparent 1px), linear-gradient(to bottom, #FF9900 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}/>

        {/* Floating Shapes - Enhanced */}
        <motion.div
          className="absolute top-20 right-10 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-80 h-80 bg-orange-600/3 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-500/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Top Bar - Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-8 mb-12 text-sm text-gray-600 dark:text-gray-400"
        >
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-orange-600 fill-orange-600" />
            <span className="font-semibold">4.9/5</span>
            <span className="text-gray-500">(2,500+ reviews)</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span className="font-semibold">10,000+</span>
            <span className="text-gray-500">active sellers</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="font-semibold">47%</span>
            <span className="text-gray-500">avg. sales increase</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            {/* Badge - Enhanced with pulse animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-full text-sm font-bold mb-6 shadow-lg overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 relative z-10" />
              </motion.div>
              <span className="relative z-10">#1 AI Listing Generator for E-commerce</span>
              <motion.div
                className="absolute -inset-1 bg-orange-600/50 rounded-full blur-md"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ zIndex: -1 }}
              />
            </motion.div>

            {/* Main Headline - Enhanced with gradient animation */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <motion.span
                className="block text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Generate Professional
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                style={{
                  animation: 'gradient 3s linear infinite',
                }}
              >
                Product Listings
              </motion.span>
              <motion.span
                className="block text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                in{" "}
                <span className="relative inline-block">
                  <span className="text-orange-600 dark:text-orange-500">2 Minutes</span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-3 bg-orange-200/50 dark:bg-orange-900/30 -z-10"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                </span>
              </motion.span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              AI-powered images, A+ content, and listings for Amazon, Shopify, eBay & Etsy.
              <span className="font-semibold text-orange-600"> Save 20+ hours per week.</span>
            </p>

            {/* Key Benefits with Icons - Enhanced */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                { icon: Clock, text: "2-minute generation", subtext: "Not hours", color: "orange" },
                { icon: TrendingUp, text: "47% higher conversions", subtext: "Proven results", color: "green" },
                { icon: CheckCircle2, text: "100% compliant", subtext: "All platforms", color: "blue" },
                { icon: Zap, text: "No design skills needed", subtext: "AI does it all", color: "purple" },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  whileHover={{
                    y: -5,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                  className="relative flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 cursor-pointer group overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <benefit.icon className="w-6 h-6 text-orange-600" />
                  </motion.div>
                  <div className="relative z-10">
                    <div className="font-bold text-gray-900 dark:text-white mb-1">
                      {benefit.text}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {benefit.subtext}
                    </div>
                  </div>
                  <motion.div
                    className="absolute top-0 right-0 w-20 h-20 bg-orange-400/10 rounded-full blur-2xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/auth/signin"
                  className="relative group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-10 py-5 rounded-xl text-lg font-bold shadow-2xl hover:shadow-orange-600/50 transition-all duration-300 overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%', skewX: -20 }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10">Start Free 14-Day Trial</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(255, 153, 0, 0)',
                        '0 0 0 10px rgba(255, 153, 0, 0.1)',
                        '0 0 0 0 rgba(255, 153, 0, 0)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="#demo"
                  className="group inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-10 py-5 rounded-xl text-lg font-semibold border-2 border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-600 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span>Watch 2-Min Demo</span>
                  <motion.span
                    className="inline-block"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ▶
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">No credit card required</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">Free migration support</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">Cancel anytime</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Visual Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            {/* Main Demo Card */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
              {/* Live Stats Banner - Enhanced with animated counter */}
              <motion.div
                className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg"
                animate={{
                  boxShadow: [
                    '0 10px 15px -3px rgba(255, 153, 0, 0.3)',
                    '0 10px 25px -3px rgba(255, 153, 0, 0.5)',
                    '0 10px 15px -3px rgba(255, 153, 0, 0.3)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.span
                  key={listingsCount}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  🔥 {listingsCount} listings created in the last hour
                </motion.span>
              </motion.div>

              {/* Stats Grid - Enhanced */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[
                  { value: "< 2 min", label: "Generation Time", icon: Clock, trend: "Fast", color: "orange" },
                  { value: "+47%", label: "Avg. Conversion", icon: TrendingUp, trend: "Up", color: "green" },
                  { value: "10,000+", label: "Active Users", icon: Users, trend: "Growing", color: "blue" },
                  { value: "500K+", label: "Listings Made", icon: CheckCircle2, trend: "Proven", color: "purple" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    whileHover={{
                      scale: 1.05,
                      rotate: [0, -1, 1, 0],
                      transition: { duration: 0.3 },
                    }}
                    className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50/50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl border-2 border-orange-200 dark:border-orange-900/50 hover:border-orange-600 dark:hover:border-orange-500 transition-all duration-300 cursor-pointer group overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-transparent dark:from-orange-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <motion.div
                      whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <stat.icon className="w-8 h-8 text-orange-600 mb-3 relative z-10" />
                    </motion.div>
                    <motion.div
                      className="text-3xl font-bold text-gray-900 dark:text-white mb-1 relative z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 relative z-10">
                      {stat.label}
                    </div>
                    <motion.div
                      className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded relative z-10"
                      whileHover={{ scale: 1.1 }}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-2 -right-2 w-24 h-24 bg-orange-300/20 dark:bg-orange-600/10 rounded-full blur-2xl"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.3,
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Platform Badges */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center font-medium">
                  Works seamlessly with
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {["Amazon", "Shopify", "eBay", "Etsy", "Walmart"].map((platform, index) => (
                    <motion.div
                      key={platform}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                    >
                      {platform}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Badge - Award */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border-2 border-orange-600"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600 fill-orange-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    #1 Rated Tool
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    2025 Seller Choice Awards
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
