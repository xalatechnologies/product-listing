"use client";

/**
 * New project creation page
 */

import { ProjectForm } from "@/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Project</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Start a new product listing project
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <ProjectForm />
      </div>
    </div>
  );
}

