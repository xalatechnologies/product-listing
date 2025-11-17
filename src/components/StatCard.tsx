"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly trend?: {
    readonly value: number;
    readonly label: string;
  };
  readonly colorScheme?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'amber';
  readonly delay?: number;
}

const colorSchemes = {
  blue: {
    bg: 'from-blue-500/10 to-cyan-500/10',
    icon: 'from-blue-500 to-cyan-500',
    text: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  purple: {
    bg: 'from-purple-500/10 to-pink-500/10',
    icon: 'from-purple-500 to-pink-500',
    text: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/10',
  },
  green: {
    bg: 'from-green-500/10 to-emerald-500/10',
    icon: 'from-green-500 to-emerald-500',
    text: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-500/10',
  },
  orange: {
    bg: 'from-orange-500/10 to-amber-500/10',
    icon: 'from-orange-500 to-amber-500',
    text: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-500/10',
  },
  pink: {
    bg: 'from-pink-500/10 to-rose-500/10',
    icon: 'from-pink-500 to-rose-500',
    text: 'text-pink-600 dark:text-pink-400',
    iconBg: 'bg-pink-500/10',
  },
  amber: {
    bg: 'from-amber-500/10 to-yellow-500/10',
    icon: 'from-amber-500 to-yellow-500',
    text: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  colorScheme = 'blue',
  delay = 0,
}: StatCardProps) => {
  const colors = colorSchemes[colorScheme];
  const isPositiveTrend = trend ? trend.value > 0 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <p className="text-base font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
              {title}
            </p>
            <h3 className={`text-4xl md:text-5xl font-black ${colors.text}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h3>
          </div>

          {/* Icon */}
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colors.iconBg} shadow-lg`}>
            <Icon className={`h-8 w-8 ${colors.text}`} />
          </div>
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              isPositiveTrend
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-xs font-semibold">
                {Math.abs(trend.value)}%
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {trend.label}
            </span>
          </div>
        )}
      </div>

      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
        }}
      />
    </motion.div>
  );
};

// Mini stat card for smaller spaces
interface MiniStatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly colorScheme?: 'blue' | 'purple' | 'green' | 'orange';
}

export const MiniStatCard = ({
  label,
  value,
  icon: Icon,
  colorScheme = 'blue',
}: MiniStatCardProps) => {
  const colors = colorSchemes[colorScheme];

  return (
    <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg}`}>
        <Icon className={`h-5 w-5 ${colors.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
          {label}
        </p>
        <p className={`text-lg font-bold ${colors.text} truncate`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
};
