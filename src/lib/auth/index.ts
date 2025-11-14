import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import AppleProvider from "next-auth/providers/apple";

export enum UserRole {
  user = "user",
  admin = "admin",
}

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth/adapters" {
  interface AdapterUser {
    login?: string;
    role?: UserRole;
    dashboardEnabled?: boolean;
    isTeamAdmin?: boolean;
  }
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string;
      role?: UserRole;
      dashboardEnabled?: boolean;
      isAdmin?: boolean;
      expires?: string;
      isTeamAdmin?: boolean;
    };
    accessToken?: string;
  }

  export interface Profile {
    login: string;
  }

  interface User {
    role?: UserRole;
    login?: string;
    expires?: string;
    isTeamAdmin?: boolean;
    isAdmin?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    }),
    // OAuth providers (only enabled if credentials are configured)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.APPLE_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_PRIVATE_KEY &&
    process.env.APPLE_KEY_ID
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID,
            clientSecret: {
              appleId: process.env.APPLE_ID,
              teamId: process.env.APPLE_TEAM_ID,
              privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
              keyId: process.env.APPLE_KEY_ID,
            } as any, // NextAuth v4 type definitions are incorrect for Apple provider
          }),
        ]
      : []),
    // Custom OAuth providers for Amazon and eBay
    ...(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET
      ? [
          {
            id: "amazon",
            name: "Amazon",
            type: "oauth" as const,
            version: "2.0",
            scope: "profile",
            params: { grant_type: "authorization_code" },
            accessTokenUrl: "https://api.amazon.com/auth/o2/token",
            authorizationUrl: "https://www.amazon.com/ap/oa?response_type=code",
            profileUrl: "https://api.amazon.com/user/profile",
            clientId: process.env.AMAZON_CLIENT_ID,
            clientSecret: process.env.AMAZON_CLIENT_SECRET,
            profile(profile: any) {
              return {
                id: profile.user_id,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
              };
            },
          },
        ]
      : []),
    ...(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET
      ? [
          {
            id: "ebay",
            name: "eBay",
            type: "oauth" as const,
            version: "2.0",
            scope: "https://api.ebay.com/oauth/api_scope",
            params: { grant_type: "authorization_code" },
            accessTokenUrl: "https://api.ebay.com/identity/v1/oauth2/token",
            authorizationUrl:
              "https://auth.ebay.com/oauth2/authorize?response_type=code",
            profileUrl: "https://api.ebay.com/identity/v1/userinfo",
            clientId: process.env.EBAY_CLIENT_ID,
            clientSecret: process.env.EBAY_CLIENT_SECRET,
            profile(profile: any) {
              return {
                id: profile.userId || profile.sub,
                name: profile.username || profile.name,
                email: profile.email,
                image: null,
              };
            },
          },
        ]
      : []),
  ],
  session: {
    strategy: "database",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        const email = user?.email;
        if (!email) return false;

        /*
        // Enable this to restrict sign-ins to certain domains or allowlist
        const domainCheck = ALLOWED_DOMAINS.some((d) => email.endsWith(d));
        if (!domainCheck) {
          const inAllowlist = await prisma.allowlist.findUnique({
            where: { email },
          });

          if (!inAllowlist) {
            return false;
          }
        }
        */

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async session({ session, user }) {
      try {
        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
            role: user.role,
            login: user.login,
            isAdmin: user.isAdmin,
          },
        };
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
