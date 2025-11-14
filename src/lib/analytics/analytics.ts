/**
 * Analytics utilities for tracking user events
 * 
 * Supports multiple analytics providers:
 * - Google Analytics (gtag)
 * - Plausible (privacy-friendly)
 * - Custom event tracking
 */

type AnalyticsEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
};

/**
 * Track a page view
 */
export function trackPageView(path: string): void {
  if (typeof window === 'undefined') return;

  // Google Analytics
  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_path: path,
    });
  }

  // Plausible
  if (window.plausible) {
    window.plausible('pageview', { u: path });
  }

  // Custom tracking (can be extended)
  console.log('[Analytics] Page view:', path);
}

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  const { action, category, label, value, ...rest } = event;

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...rest,
    });
  }

  // Plausible
  if (window.plausible) {
    window.plausible(action, {
      props: {
        category,
        label,
        value,
        ...rest,
      },
    });
  }

  // Custom tracking
  console.log('[Analytics] Event:', event);
}

/**
 * Track project creation
 */
export function trackProjectCreated(projectId: string): void {
  trackEvent({
    action: 'project_created',
    category: 'Projects',
    label: projectId,
  });
}

/**
 * Track image generation
 */
export function trackImageGeneration(
  type: string,
  projectId: string,
  success: boolean,
): void {
  trackEvent({
    action: 'image_generated',
    category: 'Image Generation',
    label: type,
    success: success ? 1 : 0,
    projectId,
  });
}

/**
 * Track A+ content generation
 */
export function trackAPlusGeneration(
  projectId: string,
  isPremium: boolean,
  success: boolean,
): void {
  trackEvent({
    action: 'aplus_generated',
    category: 'A+ Content',
    label: isPremium ? 'premium' : 'standard',
    success: success ? 1 : 0,
    projectId,
  });
}

/**
 * Track subscription signup
 */
export function trackSubscriptionSignup(plan: string): void {
  trackEvent({
    action: 'subscription_signup',
    category: 'Conversion',
    label: plan,
    value: 1,
  });
}

/**
 * Track export
 */
export function trackExport(platform: string, projectId: string): void {
  trackEvent({
    action: 'export',
    category: 'Export',
    label: platform,
    projectId,
  });
}

/**
 * Track credit purchase
 */
export function trackCreditPurchase(amount: number, credits: number): void {
  trackEvent({
    action: 'credit_purchase',
    category: 'Billing',
    value: amount,
    credits,
  });
}

// Type declarations for window objects
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | object,
      config?: Record<string, unknown>,
    ) => void;
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, unknown>; u?: string },
    ) => void;
  }
}

