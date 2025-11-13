/**
 * Shared types for Supabase Edge Functions
 */

export interface EdgeFunctionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WebhookPayload {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

