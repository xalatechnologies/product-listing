"use client";

/**
 * Dashboard page - displays user's projects with statistics and enhancements
 */

import { api } from "@/lib/trpc/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Image as ImageIcon,
  Package,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  Zap,
  Palette,
  TrendingUp,
  FileText,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Activity,
  BarChart3,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { CreditBalance } from "@/components/CreditBalance";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ProjectStatus } from "@prisma/client";
import { motion } from "framer-motion";

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

const ITEMS_PER_PAGE = 12;

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch projects with pagination (fetch more than needed for client-side filtering)
  const { data: projectsData, isLoading, error: projectsError } = api.project.list.useQuery({
    limit: 100, // Fetch up to 100 projects for client-side filtering
    offset: 0,
  }, {
    retry: false,
  });

  // Handle both paginated and non-paginated responses
  const projects = Array.isArray(projectsData) 
    ? projectsData 
    : projectsData?.projects || [];
  const totalProjects = Array.isArray(projectsData) 
    ? projectsData.length 
    : projectsData?.total || 0;
  const { data: credits, error: creditsError } = api.subscription.getCredits.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds
    retry: false,
  });

  // Log errors for debugging
  useEffect(() => {
    if (projectsError) {
      console.error("Failed to fetch projects:", projectsError);
    }
    if (creditsError) {
      console.error("Failed to fetch credits:", creditsError);
    }
  }, [projectsError, creditsError]);

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

  // Paginate filtered and sorted projects
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedProjects.slice(startIndex, endIndex);
  }, [filteredAndSortedProjects, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProjects.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  // Calculate statistics from all fetched projects
  const stats = useMemo(() => {
    if (!projects || projects.length === 0) return { totalProjects: 0, totalImages: 0, totalGenerated: 0 };

    const totalImages = projects.reduce((sum, p) => sum + p._count.productImages, 0);
    const totalGenerated = projects.reduce((sum, p) => sum + p._count.generatedImages, 0);

    return { totalProjects, totalImages, totalGenerated };
  }, [projects, totalProjects]);

  // Get recent projects (last 5)
  const recentProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [projects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  // Show error state if there's an error
  if (projectsError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {projectsError.message || "Failed to load your projects. Please try again."}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all"
          >
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 dark:border-amber-800 dark:border-t-amber-400" />
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <OnboardingTour />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Welcome back! Here's what's happening with your projects
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <Plus className="h-5 w-5" />
              New Project
            </Link>
          </motion.div>
        </motion.div>

      {/* Statistics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        data-onboarding="statistics"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Projects</p>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-gray-900 dark:text-gray-100"
              >
                {stats.totalProjects}
              </motion.p>
            </div>
            <motion.div
              whileHover={{ rotate: 10 }}
              className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-xl shadow-lg"
            >
              <Package className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Product Images</p>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-gray-900 dark:text-gray-100"
              >
                {stats.totalImages}
              </motion.p>
            </div>
            <motion.div
              whileHover={{ rotate: -10 }}
              className="p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-xl shadow-lg"
            >
              <ImageIcon className="h-7 w-7 text-green-600 dark:text-green-400" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Generated Images</p>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-gray-900 dark:text-gray-100"
              >
                {stats.totalGenerated}
              </motion.p>
            </div>
            <motion.div
              whileHover={{ rotate: 10 }}
              className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl shadow-lg"
            >
              <TrendingUp className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

        {/* Credit Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <CreditBalance />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-lg"
        data-onboarding="quick-actions"
      >
        <div className="flex items-center gap-2 mb-6">
          <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/projects/new"
              className="group flex items-center gap-4 p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-xl group-hover:shadow-lg transition-shadow"
              >
                <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Create Project
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start a new project</p>
              </div>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/brand-kits/new"
              className="group flex items-center gap-4 p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
            >
              <motion.div
                whileHover={{ rotate: -90 }}
                className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl group-hover:shadow-lg transition-shadow"
              >
                <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Create Brand Kit
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Set up brand colors</p>
              </div>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/billing"
              className="group flex items-center gap-4 p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
            >
              <motion.div
                whileHover={{ rotate: 10 }}
                className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-xl group-hover:shadow-lg transition-shadow"
              >
                <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  Manage Credits
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">View billing & credits</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      {recentProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Activity</h2>
          </div>
          <div className="space-y-2">
            {recentProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="group flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-2.5 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200 dark:group-hover:from-blue-900/50 dark:group-hover:to-blue-800/50 transition-all"
                    >
                      <Package className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </motion.div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${getStatusColor(
                      project.status,
                    )}`}
                  >
                    {project.status}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-6 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors" />
            <input
              type="text"
              placeholder="Search projects by name, product, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm hover:shadow-md"
            />
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "ALL")}
              className="pl-12 pr-10 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm hover:shadow-md cursor-pointer appearance-none"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Sort */}
          <div className="relative group">
            <ArrowUpDown className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="pl-12 pr-10 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm hover:shadow-md cursor-pointer appearance-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </div>
        </div>
      </motion.div>

      {!projects || projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Package className="h-20 w-20 mx-auto text-gray-400 dark:text-gray-500 mb-6" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            No projects yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Get started by creating your first product listing project
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all"
            >
              <Plus className="h-5 w-5" />
              Create Your First Project
            </Link>
          </motion.div>
        </motion.div>
      ) : filteredAndSortedProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Search className="h-20 w-20 mx-auto text-gray-400 dark:text-gray-500 mb-6" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            No projects match your filters
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Try adjusting your search or filter criteria
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all"
          >
            Clear Filters
          </motion.button>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {paginatedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                whileHover={{ y: -8 }}
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-2xl transition-all overflow-hidden relative"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-blue-500/0 group-hover:from-amber-500/5 group-hover:to-blue-500/5 transition-all" />
                  
                  <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm flex-shrink-0 ml-2 ${getStatusColor(
                          project.status,
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    {project.productName && (
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 line-clamp-1">
                        {project.productName}
                      </p>
                    )}

                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-5">
                      <div className="flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.2 }}>
                          <ImageIcon className="h-4 w-4" />
                        </motion.div>
                        <span className="font-medium">{project._count.productImages}</span>
                        <span className="text-xs">images</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.2 }}>
                          <Package className="h-4 w-4" />
                        </motion.div>
                        <span className="font-medium">{project._count.generatedImages}</span>
                        <span className="text-xs">generated</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>
                          Updated {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </motion.div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 gap-4"
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Showing <span className="font-bold text-gray-900 dark:text-gray-100">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-bold text-gray-900 dark:text-gray-100">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedProjects.length)}</span> of{" "}
                <span className="font-bold text-gray-900 dark:text-gray-100">{filteredAndSortedProjects.length}</span> projects
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 transition-all shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </motion.button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-amber-500 to-blue-600 text-white shadow-lg shadow-amber-500/25"
                            : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 shadow-sm hover:shadow-md"
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600 transition-all shadow-sm hover:shadow-md"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

