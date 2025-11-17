"use client";

/**
 * Projects List Page
 * View and manage all projects
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
  Grid3x3,
  List,
  ExternalLink,
} from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { ProjectCardSkeleton } from "@/components/SkeletonLoaders";
import { safeLogError } from "@/lib/utils/errorUtils";

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";
type ViewMode = "grid" | "list";

const ITEMS_PER_PAGE = 12;

export default function ProjectsPage() {
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

  // Log errors
  useEffect(() => {
    if (projectsError) {
      safeLogError("Projects Page - Fetch Projects", projectsError);
    }
  }, [projectsError]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    if (!projects) return [];

    let filtered = projects;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.productName?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const getStatusBadge = (status: string) => {
    const styles = {
      COMPLETED: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      PROCESSING: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse",
      FAILED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      DRAFT: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    };
    return styles[status as keyof typeof styles] || styles.DRAFT;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600 bg-clip-text text-transparent mb-3">
              All Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-xl">
              Manage your product listing projects
            </p>
          </div>

          <Link
            href="/projects/new"
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-blue-600 px-8 py-4 text-base font-bold text-white shadow-2xl hover:shadow-amber-500/50 transition-all"
          >
            <Plus className="h-6 w-6" />
            New Project
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 p-8 mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 text-base border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all shadow-sm hover:shadow-md"
              />
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "ALL")}
                  className="pl-12 pr-10 py-4 text-base border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 cursor-pointer appearance-none shadow-sm hover:shadow-md transition-all"
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
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>

              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-gray-600 shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
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
                >
                  <List className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <AnimatePresence mode="wait">
          {paginatedProjects.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-24 w-24 mx-auto text-gray-400 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                No projects found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "Create your first project to get started"}
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Create Project
              </Link>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
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
                      <span className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${getStatusBadge(project.status)}`}>
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
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
