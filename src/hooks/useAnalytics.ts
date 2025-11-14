"use client";

import {
  trackEvent,
  trackProjectCreated,
  trackImageGeneration,
  trackAPlusGeneration,
  trackSubscriptionSignup,
  trackExport,
  trackCreditPurchase,
} from "@/lib/analytics/analytics";

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  return {
    trackEvent,
    trackProjectCreated,
    trackImageGeneration,
    trackAPlusGeneration,
    trackSubscriptionSignup,
    trackExport,
    trackCreditPurchase,
  };
}

