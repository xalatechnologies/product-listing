/**
 * Supabase Realtime utilities for live updates.
 *
 * Use this for:
 * - Real-time project status updates
 * - Live image generation progress
 * - Collaborative editing (future)
 */

import { supabase } from "./client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to project status changes
 * @param projectId - Project ID to watch
 * @param callback - Callback function when status changes
 * @returns Realtime channel (call .unsubscribe() to stop)
 */
export function subscribeToProjectStatus(
  projectId: string,
  callback: (payload: { status: string; progress?: number }) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`project:${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "Project",
        filter: `id=eq.${projectId}`,
      },
      (payload) => {
        callback({
          status: payload.new.status,
          progress: payload.new.progress,
        });
      },
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to generated image updates for a project
 * @param projectId - Project ID to watch
 * @param callback - Callback function when new images are added
 * @returns Realtime channel
 */
export function subscribeToGeneratedImages(
  projectId: string,
  callback: (image: { id: string; url: string; type: string }) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`generated-images:${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "GeneratedImage",
        filter: `projectId=eq.${projectId}`,
      },
      (payload) => {
        callback({
          id: payload.new.id,
          url: payload.new.url,
          type: payload.new.type,
        });
      },
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to credit balance changes for the current user
 * @param userId - User ID to watch
 * @param callback - Callback function when credits change
 * @returns Realtime channel
 */
export function subscribeToCredits(
  userId: string,
  callback: (balance: number) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`credits:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "CreditTransaction",
        filter: `userId=eq.${userId}`,
      },
      async () => {
        // Calculate new balance
        // This would typically be done via a database function or view
        // For now, we'll just notify that credits changed
        callback(0); // Placeholder - implement balance calculation
      },
    )
    .subscribe();

  return channel;
}

