"use client";

import React from 'react';

// Base skeleton component
interface SkeletonProps {
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

export const Skeleton = ({ className = "", style }: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-lg ${className}`}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
        ...style,
      }}
    />
  );
};

// Stat card skeleton
export const StatCardSkeleton = () => {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
};

// Project card skeleton
export const ProjectCardSkeleton = () => {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center gap-4 pt-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
};

// Image grid skeleton
export const ImageGridSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-xl" />
      ))}
    </div>
  );
};

// Table row skeleton
export const TableRowSkeleton = () => {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
  );
};

// Chart skeleton
export const ChartSkeleton = () => {
  // Use fixed heights to prevent hydration mismatch (Math.random() causes different server/client values)
  const heights = [65, 75, 55, 85, 70, 60, 80, 65, 75, 70, 60, 80];
  
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="h-64 flex items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${heights[i] || 70}%` }}
          />
        ))}
      </div>
    </div>
  );
};

// List skeleton
export const ListSkeleton = ({ count = 5 }: { readonly count?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
          <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
};

// Page header skeleton
export const PageHeaderSkeleton = () => {
  return (
    <div className="space-y-4 mb-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
};

// Form skeleton
export const FormSkeleton = () => {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-4 pt-4">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-32 rounded-lg" />
      </div>
    </div>
  );
};

// Dashboard skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Projects Grid */}
      <div>
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      </div>
    </div>
  );
};

// Note: Shimmer animation is handled via CSS-in-JS inline styles
// Global styles should be added via CSS file or Next.js _app to prevent hydration issues
