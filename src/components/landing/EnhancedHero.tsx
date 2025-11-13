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
    <section className="relative bg-gradient-to-b from-amber-50 via-yellow-50/30 to-white dark:from-gray-900 dark:via-amber-950/20 dark:to-gray-800 pt-24 pb-16 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern - Golden */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(to right, #FFBF00 1px, transparent 1px), linear-gradient(to bottom, #FFBF00 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}/>

        {/* Floating Shapes - Golden tones */}
        <motion.div
          className="absolute top-20 right-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
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
          className="absolute bottom-20 left-10 w-96 h-96 bg-yellow-500/8 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
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
          className="absolute top-1/2 left-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Floating Particles - Subtle golden sparkles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-amber-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.6, 0],
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
        {/* Top Bar - Trust Indicators with better contrast */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm"
        >
          <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200/50 dark:border-amber-900/30">
            <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span className="font-bold text-gray-900 dark:text-white">Loved by sellers</span>
          </div>
          <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200/50 dark:border-amber-900/30">
            <Users className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-gray-900 dark:text-white">Trusted worldwide</span>
          </div>
          <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200/50 dark:border-amber-900/30">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-gray-900 dark:text-white">Proven results</span>
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
            {/* Badge - Golden tone */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-gray-900 rounded-full text-sm font-bold mb-6 shadow-xl overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-white/30"
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
                <Sparkles className="w-4 h-4 relative z-10 text-amber-900" />
              </motion.div>
              <span className="relative z-10 text-amber-950">Turn your products into bestsellers</span>
              <motion.div
                className="absolute -inset-1 bg-amber-400/40 rounded-full blur-md"
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

            {/* Main Headline - Human & conversational with golden gradient */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <motion.span
                className="block text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Create Stunning
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
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
                That Actually{" "}
                <span className="relative inline-block">
                  <span className="text-amber-600 dark:text-amber-500">Sell</span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-3 bg-amber-200/60 dark:bg-amber-900/40 -z-10 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                </span>
              </motion.span>
            </h1>

            {/* Subheadline - More human, less robotic */}
            <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed font-medium">
              Let AI handle the hard work—professional images, compelling copy, and eye-catching designs ready for Amazon, Shopify, eBay, and Etsy.
              <span className="block mt-2 text-amber-700 dark:text-amber-400 font-bold">Finally, get back to running your business.</span>
            </p>

            {/* Key Benefits - Human-friendly messages with golden accents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                { icon: Clock, text: "Minutes, not hours", subtext: "Get listings done fast" },
                { icon: TrendingUp, text: "Sell more products", subtext: "Better listings = more sales" },
                { icon: CheckCircle2, text: "Works everywhere", subtext: "Amazon, Shopify, eBay, Etsy" },
                { icon: Zap, text: "You don't need to be a designer", subtext: "AI handles everything" },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  whileHover={{
                    y: -5,
                    boxShadow: "0 20px 25px -5px rgba(217, 119, 6, 0.15), 0 10px 10px -5px rgba(217, 119, 6, 0.05)",
                  }}
                  className="relative flex items-start gap-3 p-5 bg-white dark:bg-gray-800 rounded-xl border-2 border-amber-200/70 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300 cursor-pointer group overflow-hidden shadow-sm"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-amber-900/10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 border border-amber-200/50 dark:border-amber-800/30"
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <benefit.icon className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                  </motion.div>
                  <div className="relative z-10">
                    <div className="font-bold text-gray-900 dark:text-white mb-1 text-base">
                      {benefit.text}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {benefit.subtext}
                    </div>
                  </div>
                  <motion.div
                    className="absolute top-0 right-0 w-20 h-20 bg-amber-400/15 rounded-full blur-2xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.7, 0.4],
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

            {/* CTA Buttons - Golden with high contrast */}
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
                  className="relative group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-gray-900 px-10 py-5 rounded-xl text-lg font-bold shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-white/30"
                    initial={{ x: '-100%', skewX: -20 }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10 text-amber-950">Try it Free—No Credit Card</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10 text-amber-950" />
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
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="#demo"
                  className="group inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-10 py-5 rounded-xl text-lg font-bold border-2 border-amber-300 dark:border-amber-700 hover:border-amber-500 dark:hover:border-amber-500 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span>See How It Works</span>
                  <motion.span
                    className="inline-block text-amber-600"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ▶
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Badges - Better contrast */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span className="font-bold text-gray-800 dark:text-gray-200">No credit card needed</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span className="font-bold text-gray-800 dark:text-gray-200">We'll help you get started</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span className="font-bold text-gray-800 dark:text-gray-200">Cancel anytime</span>
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
            {/* Main Demo Card - Golden theme */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-amber-200/60 dark:border-amber-900/40 p-8">
              {/* Live Stats Banner - Golden with better contrast */}
              <motion.div
                className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-gray-900 px-6 py-2 rounded-full text-sm font-bold shadow-xl"
                animate={{
                  boxShadow: [
                    '0 10px 15px -3px rgba(251, 191, 36, 0.4)',
                    '0 10px 25px -3px rgba(251, 191, 36, 0.6)',
                    '0 10px 15px -3px rgba(251, 191, 36, 0.4)',
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
                  className="text-amber-950"
                >
                  ✨ People are creating listings right now
                </motion.span>
              </motion.div>

              {/* Stats Grid - Human & golden */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[
                  { value: "Minutes", label: "Not Days", icon: Clock, trend: "Lightning fast" },
                  { value: "More Sales", label: "Better Conversions", icon: TrendingUp, trend: "Real results" },
                  { value: "Thousands", label: "Happy Sellers", icon: Users, trend: "Join them" },
                  { value: "Proven", label: "Works Every Time", icon: CheckCircle2, trend: "Guaranteed" },
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
                    className="relative bg-gradient-to-br from-amber-50 via-yellow-50/30 to-white dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl border-2 border-amber-200/70 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 cursor-pointer group overflow-hidden shadow-sm"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-transparent dark:from-amber-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <motion.div
                      whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <stat.icon className="w-8 h-8 text-amber-700 dark:text-amber-400 mb-3 relative z-10" />
                    </motion.div>
                    <motion.div
                      className="text-2xl font-bold text-gray-900 dark:text-white mb-1 relative z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 relative z-10 font-semibold">
                      {stat.label}
                    </div>
                    <motion.div
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded relative z-10"
                      whileHover={{ scale: 1.1 }}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-2 -right-2 w-24 h-24 bg-amber-300/20 dark:bg-amber-600/10 rounded-full blur-2xl"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.4, 0.7, 0.4],
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

              {/* Platform Badges - Golden theme */}
              <div className="mt-8 pt-6 border-t border-amber-200/50 dark:border-amber-900/30">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 text-center font-bold">
                  Works with your favorite platforms
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {["Amazon", "Shopify", "eBay", "Etsy", "Walmart"].map((platform, index) => (
                    <motion.div
                      key={platform}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm font-bold text-gray-800 dark:text-gray-200 border-2 border-amber-200/70 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600 transition-colors shadow-sm"
                    >
                      {platform}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Badge - Award with golden theme */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border-2 border-amber-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-amber-900/20 rounded-lg flex items-center justify-center border border-amber-300 dark:border-amber-700">
                  <Star className="w-6 h-6 text-amber-600 fill-amber-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    Loved by Sellers
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                    Trusted worldwide
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
