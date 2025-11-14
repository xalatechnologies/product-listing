"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Orb {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export const AnimatedBackground = (): React.ReactElement => {
  const [orbs, setOrbs] = useState<Orb[]>([]);

  // Generate random positions for floating orbs only on client side to avoid hydration mismatch
  useEffect(() => {
    setOrbs(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 200 + 100,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
        color: [
          "bg-orange-400/10",
          "bg-blue-400/10",
          "bg-green-400/10",
          "bg-yellow-400/10",
          "bg-red-400/10",
        ][Math.floor(Math.random() * 5)],
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-green-900/20" />

      {/* Animated grid */}
      <motion.div
        className="absolute inset-0 opacity-30 dark:opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 152, 0, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(33, 150, 243, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
        animate={{
          backgroundPosition: ["0px 0px", "60px 60px"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Floating orbs */}
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className={`absolute rounded-full blur-3xl ${orb.color}`}
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
          }}
          animate={{
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 30, -30, 0],
            y: [0, -30, 30, 0],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent dark:from-gray-900/50" />
    </div>
  );
};
