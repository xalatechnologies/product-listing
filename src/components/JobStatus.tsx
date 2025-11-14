"use client";

/**
 * Job Status Component
 * 
 * Displays the status of a background job with progress indication
 */

import { useJobStatus, usePendingJobsCount } from "@/hooks/useJobStatus";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface JobStatusProps {
  jobId: string | null | undefined;
  onComplete?: () => void;
  onError?: (error: string) => void;
  showDetails?: boolean;
}

export function JobStatus({ jobId, onComplete, onError, showDetails = false }: JobStatusProps) {
  const { job, isLoading, isPolling, error } = useJobStatus({
    jobId,
    enabled: !!jobId,
    onComplete,
    onError,
  });

  if (!jobId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking job status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to check job status</span>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "processing":
        return "Processing";
      case "pending":
        return "Queued";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      case "processing":
        return "text-blue-600 dark:text-blue-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        {getStatusIcon()}
        <span className={getStatusColor()}>{getStatusText()}</span>
        {isPolling && job.status !== "completed" && job.status !== "failed" && (
          <span className="text-xs text-gray-500 dark:text-gray-400">(updating...)</span>
        )}
      </div>

      {showDetails && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Job Type: {job.jobType}</div>
          {job.retryCount > 0 && (
            <div>Retries: {job.retryCount} / {job.maxRetries}</div>
          )}
          {job.errorMessage && (
            <div className="text-red-600 dark:text-red-400">Error: {job.errorMessage}</div>
          )}
          {job.completedAt && (
            <div>
              Completed: {new Date(job.completedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pending Jobs Badge
 * Shows count of pending/processing jobs
 */
export function PendingJobsBadge() {
  const { pendingCount, pending, processing } = usePendingJobsCount();

  if (pendingCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
        <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
          {pendingCount} {pendingCount === 1 ? "job" : "jobs"} in queue
        </span>
      </div>
      {(pending > 0 || processing > 0) && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({pending} pending, {processing} processing)
        </span>
      )}
    </div>
  );
}

