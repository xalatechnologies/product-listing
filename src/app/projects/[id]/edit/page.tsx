"use client";

/**
 * Edit project page
 */

import { use } from "react";
import { api } from "@/lib/trpc/react";
import { ProjectForm } from "@/components/ProjectForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const { data: project, isLoading } = api.project.get.useQuery({ id: projectId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Project not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Project</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Update your project details
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <ProjectForm
          projectId={projectId}
          initialData={{
            name: project.name,
            description: project.description || undefined,
            productName: project.productName,
            productCategory: project.productCategory || undefined,
          }}
          onSuccess={() => {
            window.location.href = `/projects/${projectId}`;
          }}
        />
      </div>
    </div>
  );
}

