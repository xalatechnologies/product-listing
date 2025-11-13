/**
 * Supabase Auth integration utilities
 *
 * Provides Supabase Auth alongside NextAuth for flexible authentication.
 * Use Supabase Auth for:
 * - Real-time auth state changes
 * - Social auth providers
 * - Magic links
 * - Phone authentication
 */

import { supabase } from "../supabase/client";
import { supabaseAdmin } from "../supabase/server";

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

/**
 * Sign in with email and password using Supabase Auth
 */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign up with email and password using Supabase Auth
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  metadata?: { name?: string },
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with magic link (passwordless)
 */
export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 */
export async function signInWithOAuth(provider: "google" | "github" | "apple") {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void,
) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(metadata: Record<string, unknown>) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) throw error;
  return data;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) throw error;
  return data;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

/**
 * Sync Supabase Auth user to Prisma User table
 * Call this after successful Supabase auth to create/update user in Prisma
 */
export async function syncUserToPrisma(supabaseUserId: string) {
  const { data: supabaseUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(
    supabaseUserId,
  );

  if (fetchError || !supabaseUser) {
    throw new Error("Failed to fetch Supabase user");
  }

  // Import prisma dynamically to avoid issues
  const { prisma } = await import("../db");

  const email = supabaseUser.user.email;
  if (!email) {
    throw new Error("User email not found");
  }

  // Create or update user in Prisma
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      email,
      name: supabaseUser.user.user_metadata?.name || null,
      image: supabaseUser.user.user_metadata?.avatar_url || null,
    },
    create: {
      id: supabaseUserId,
      email,
      name: supabaseUser.user.user_metadata?.name || null,
      image: supabaseUser.user.user_metadata?.avatar_url || null,
    },
  });

  return user;
}

