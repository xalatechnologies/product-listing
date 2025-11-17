"use client";

/**
 * Dashboard Page - Redesigned
 * Modern, professional dashboard with enhanced UI/UX
 */

import { useState, useMemo, useEffect } from 'react';
import { api } from "@/lib/trpc/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectStatus } from "@prisma/client";
import {
  Plus,
  Search,
  Filter,
  Package,
  Image as ImageIcon,
  Sparkles,
  Clock,
  ArrowRight,
  Grid3x3,
  List,
  ExternalLink,
  TrendingUp,
  Activity,
  Zap,
  FileText,
} from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { DashboardSkeleton, ProjectCardSkeleton } from "@/components/SkeletonLoaders";
import { OnboardingTour } from "@/components/OnboardingTour";
import { safeLogError } from "@/lib/utils/errorUtils";

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";
type ViewMode = "grid" | "list";

const ITEMS_PER_PAGE = 12;

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch projects
  const { data: projectsData, isLoading, error: projectsError } = api.project.list.useQuery({
    limit: 100,
    offset: 0,
  }, {
    retry: false,
  });

  const projects = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.projects || [];

  const totalProjects = Array.isArray(projectsData)
    ? projectsData.length
    : projectsData?.total || 0;

  // Log errors (sanitized to prevent 431 errors)
  useEffect(() => {
    if (projectsError) {
      safeLogError("Dashboard - Fetch Projects", projectsError);
    }
  }, [projectsError]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    if (!projects) return [];

    let filtered = projects;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.productName?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query),
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "oldest":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [projects, searchQuery, statusFilter, sortBy]);

  // Paginate
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedProjects.slice(startIndex, endIndex);
  }, [filteredAndSortedProjects, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProjects.length / ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!projects || projects.length === 0)
      return { totalProjects: 0, totalImages: 0, totalGenerated: 0, completedProjects: 0 };

    const totalImages = projects.reduce((sum, p) => sum + p._count.productImages, 0);
    const totalGenerated = projects.reduce((sum, p) => sum + p._count.generatedImages, 0);
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;

    return { totalProjects, totalImages, totalGenerated, completedProjects };
  }, [projects, totalProjects]);

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      COMPLETED: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      PROCESSING: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse",
      FAILED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      DRAFT: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    };
    return styles[status as keyof typeof styles] || styles.DRAFT;
  };

  // Error state
  if (projectsError) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="bg-red-500/10 rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {projectsError.message || "Failed to load your projects. Please try again."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            >
              Retry
            </button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto">
        <OnboardingTour />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6"
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600 bg-clip-text text-transparent mb-3">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-xl">
              Welcome back! Here's an overview of your projects
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-blue-600 px-8 py-4 text-base font-bold text-white shadow-2xl hover:shadow-amber-500/50 transition-all focus:outline-none focus:ring-4 focus:ring-amber-500/50 focus:ring-offset-2"
              aria-label="Create new project"
            >
              <Plus className="h-6 w-6" />
              New Project
            </Link>
          </motion.div>
        </motion.div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={Package}
            colorScheme="blue"
            trend={{ value: 12, label: "vs last month" }}
            delay={0}
          />
          <StatCard
            title="Completed"
            value={stats.completedProjects}
            icon={Sparkles}
            colorScheme="green"
            trend={{ value: 8, label: "vs last month" }}
            delay={0.1}
          />
          <StatCard
            title="Product Images"
            value={stats.totalImages}
            icon={ImageIcon}
            colorScheme="purple"
            trend={{ value: 15, label: "vs last month" }}
            delay={0.2}
          />
          <StatCard
            title="AI Generated"
            value={stats.totalGenerated}
            icon={TrendingUp}
            colorScheme="amber"
            trend={{ value: 20, label: "vs last month" }}
            delay={0.3}
          />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 p-8 mb-12 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Zap className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <Link
                href="/projects/new"
                className="group flex items-center gap-5 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-gradient-to-br hover:from-amber-50 hover:to-blue-50 dark:hover:from-amber-900/10 dark:hover:to-blue-900/10 transition-all shadow-md hover:shadow-xl"
                aria-label="New Project"
              >
                <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 group-hover:scale-110 transition-all shadow-lg">
                  <Plus className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">New Project</h3>
                  <p className="text-base text-gray-600 dark:text-gray-400">Start fresh</p>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <Link
                href="/brand-kits/new"
                className="group flex items-center gap-5 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-gradient-to-br hover:from-amber-50 hover:to-blue-50 dark:hover:from-amber-900/10 dark:hover:to-blue-900/10 transition-all shadow-md hover:shadow-xl"
                aria-label="Brand Kit"
              >
                <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 group-hover:scale-110 transition-all shadow-lg">
                  <FileText className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Brand Kit</h3>
                  <p className="text-base text-gray-600 dark:text-gray-400">Create branding</p>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
            >
              <Link
                href="/subscription"
                className="group flex items-center gap-5 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-gradient-to-br hover:from-amber-50 hover:to-blue-50 dark:hover:from-amber-900/10 dark:hover:to-blue-900/10 transition-all shadow-md hover:shadow-xl"
                aria-label="Get Credits"
              >
                <div className="p-4 bg-green-500/10 rounded-2xl group-hover:bg-green-500/20 group-hover:scale-110 transition-all shadow-lg">
                  <Activity className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Get Credits</h3>
                  <p className="text-base text-gray-600 dark:text-gray-400">Manage billing</p>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 p-8 mb-8 shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 text-base border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all shadow-sm hover:shadow-md"
                aria-label="Search projects"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "ALL")}
                  className="pl-12 pr-10 py-4 text-base border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 cursor-pointer appearance-none shadow-sm hover:shadow-md transition-all"
                  aria-label="Filter by status"
                >
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-6 py-4 text-base border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 cursor-pointer shadow-sm hover:shadow-md transition-all"
                aria-label="Sort projects"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-gray-600 shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                >
                  <Grid3x3 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-600 shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <List className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{paginatedProjects.length}</span> of{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredAndSortedProjects.length}</span> projects
            </p>
          </div>
        </motion.div>

        {/* Projects Grid/List */}
        <AnimatePresence mode="wait">
          {paginatedProjects.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20"
            >
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery || statusFilter !== "ALL" ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "Create your first project to get started with AI-powered product listings"}
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-5 w-5" />
                Create Project
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {paginatedProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className="group block bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-2xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 mb-2 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {project.productName}
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${getStatusBadge(
                          project.status,
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-base text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400">
                        <ImageIcon className="h-5 w-5" />
                        <span>{project._count.productImages} images</span>
                      </div>
                      <div className="flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <span>{project._count.generatedImages} AI</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(project.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-2 mt-8"
          >
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Previous page"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 w-10 rounded-lg font-medium transition-all ${
                    currentPage === page
                      ? "bg-gradient-to-r from-amber-500 to-blue-600 text-white shadow-lg"
                      : "border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-500 dark:hover:border-amber-500"
                  }`}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Next page"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
