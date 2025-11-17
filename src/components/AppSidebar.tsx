"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Palette,
  CreditCard,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Package,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { CreditBalance } from './CreditBalance';

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ElementType;
  readonly badge?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    label: 'Brand Kits',
    href: '/brand-kits',
    icon: Palette,
  },
  {
    label: 'Subscription',
    href: '/subscription',
    icon: CreditCard,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

const quickActions: NavItem[] = [
  {
    label: 'New Project',
    href: '/projects/new',
    icon: Package,
  },
  {
    label: 'Generate Images',
    href: '/dashboard',
    icon: ImageIcon,
  },
  {
    label: 'A+ Content',
    href: '/dashboard',
    icon: FileText,
  },
];

export const AppSidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActiveRoute = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle mobile menu"
        className="fixed top-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 lg:hidden dark:bg-gray-800/90 dark:border-gray-700"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        ) : (
          <Menu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        )}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '5rem' : '16rem',
        }}
        className={`fixed left-0 top-0 z-40 h-screen bg-white/90 backdrop-blur-xl border-r border-gray-200 dark:bg-gray-900/90 dark:border-gray-800 transition-all duration-300 hidden lg:flex flex-col ${
          isMobileOpen ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Logo Section */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-blue-600 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent"
              >
                ProductAI
              </motion.span>
            )}
          </Link>

          {/* Collapse Button (Desktop Only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Credit Balance */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <CreditBalance compact={isCollapsed} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={`nav-${item.label}-${index}`}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/10 to-blue-500/10 text-amber-600 dark:text-amber-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-amber-500 to-blue-600"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />

                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}

                {item.badge && !isCollapsed && (
                  <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-t border-gray-200 dark:border-gray-800 px-4 py-4 space-y-2"
          >
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4">
              Quick Actions
            </p>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={`quick-action-${action.label}-${index}`}
                  href={action.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  aria-label={action.label}
                >
                  <Icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}

        {/* User Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
          <Link
            href="/settings"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="User settings"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-semibold text-white">
              U
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  User Account
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  View profile
                </p>
              </motion.div>
            )}
          </Link>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed left-0 top-0 z-40 h-screen w-64 bg-white/95 backdrop-blur-xl border-r border-gray-200 dark:bg-gray-900/95 dark:border-gray-800 flex flex-col lg:hidden"
          >
            {/* Logo Section */}
            <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-blue-600 shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent">
                  ProductAI
                </span>
              </Link>
            </div>

            {/* Credit Balance */}
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
              <CreditBalance />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/10 to-blue-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-amber-500 to-blue-600" />
                    )}
                    <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4">
                Quick Actions
              </p>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                    aria-label={action.label}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Section */}
            <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
              <Link
                href="/settings"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="User settings"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-semibold text-white">
                  U
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    User Account
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    View profile
                  </p>
                </div>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
