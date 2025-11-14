/**
 * React hook for polling job status
 * 
 * Polls job status until it completes or fails
 */

import { useEffect, useState } from "react";
import { api } from "@/lib/trpc/react";
import type { JobStatus } from "@/lib/utils/jobQueue";

interface UseJobStatusOptions {
  jobId: string | null | undefined;
  enabled?: boolean;
  pollInterval?: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

interface JobStatusData {
  id: string;
  jobType: string;
  status: JobStatus;
  retryCount: number;
  maxRetries: number;
  errorMessage: string | null;
  createdAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
}

export function useJobStatus({
  jobId,
  enabled = true,
  pollInterval = 2000,
  onComplete,
  onError,
}: UseJobStatusOptions) {
  const [isPolling, setIsPolling] = useState(false);

  const { data: job, error, refetch } = api.job.getStatus.useQuery(
    { jobId: jobId! },
    {
      enabled: enabled && !!jobId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        // Stop polling if job is completed or failed
        if (status === "completed" || status === "failed") {
          setIsPolling(false);
          return false;
        }
        setIsPolling(true);
        return pollInterval;
      },
      retry: false,
    },
  );

  useEffect(() => {
    if (job?.status === "completed") {
      onComplete?.();
    } else if (job?.status === "failed") {
      onError?.(job.errorMessage || "Job failed");
    }
  }, [job?.status, job?.errorMessage, onComplete, onError]);

  return {
    job: job as JobStatusData | undefined,
    isLoading: !job && enabled && !!jobId,
    isPolling,
    error: error?.message,
    refetch,
  };
}

/**
 * Hook to get pending jobs count
 */
export function usePendingJobsCount() {
  const { data, refetch } = api.job.getPendingCount.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds
  });

  return {
    pendingCount: data?.count || 0,
    pending: data?.pending || 0,
    processing: data?.processing || 0,
    refetch,
  };
}

