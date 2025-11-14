/**
 * Utilities for testing tRPC procedures
 */

import { createCaller } from '@/lib/api/root';
import { createTRPCContext } from '@/lib/api/trpc';
import { Session } from 'next-auth';
import { UserRole } from '@/lib/auth';
import { testPrisma } from './setup';

/**
 * Create a tRPC caller with a mock session
 */
export function createTestCaller(session: Session | null) {
  const context = {
    session,
    db: testPrisma,
    headers: new Headers(),
  };

  return createCaller(context as any);
}

/**
 * Create a tRPC caller for an authenticated user
 */
export function createAuthenticatedCaller(userId: string, email: string = 'test@example.com') {
  const session: Session = {
    user: {
      id: userId,
      email,
      name: 'Test User',
      role: UserRole.user,
    },
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };

  return createTestCaller(session);
}

/**
 * Create a tRPC caller for an unauthenticated user
 */
export function createUnauthenticatedCaller() {
  return createTestCaller(null);
}

