"use client";

/**
 * Edit project page
 */

import { use } from "react";
import { api } from "@/lib/trpc/react";
import { ProjectForm } from "@/components/ProjectForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const { data: project, isLoading } = api.project.get.useQuery({ id: projectId });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Project not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Project
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600 bg-clip-text text-transparent mb-4">
            Edit Project
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xl">
            Update your project details and settings
          </p>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-10 shadow-2xl">
          <ProjectForm
            projectId={projectId}
            initialData={{
              name: project.name,
              description: project.description || undefined,
              productName: project.productName,
              productCategory: project.productCategory || undefined,
              brandKitId: project.brandKitId || undefined,
            }}
            onSuccess={() => {
              window.location.href = `/projects/${projectId}`;
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}

