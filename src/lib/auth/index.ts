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
import { Resend } from "resend";

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

// Initialize Resend for email sending
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER || "",
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      // Use Resend API if available, otherwise fall back to SMTP
      sendVerificationRequest: resend
        ? async ({ identifier: email, url, provider }) => {
            try {
              await resend.emails.send({
                from: provider.from as string,
                to: email,
                subject: "Sign in to ListingAI",
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Sign in to ListingAI</title>
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <div style="background: linear-gradient(135deg, #f59e0b 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Sign in to ListingAI</h1>
                      </div>
                      <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; margin-bottom: 20px;">Click the button below to sign in to your account:</p>
                        <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #3b82f6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0;">Sign In</a>
                        <p style="font-size: 14px; color: #666; margin-top: 30px;">Or copy and paste this link into your browser:</p>
                        <p style="font-size: 12px; color: #999; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px;">${url}</p>
                        <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">This link will expire in 24 hours. If you didn't request this email, you can safely ignore it.</p>
                      </div>
                    </body>
                  </html>
                `,
                text: `Sign in to ListingAI\n\nClick this link to sign in:\n${url}\n\nThis link will expire in 24 hours.`,
              });
            } catch (error) {
              console.error("Failed to send email:", error);
              throw new Error("Failed to send email");
            }
          }
        : undefined,
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
            authorization: {
              url: "https://www.amazon.com/ap/oa",
              params: {
                response_type: "code",
                scope: "profile",
              },
            },
            token: "https://api.amazon.com/auth/o2/token",
            userinfo: "https://api.amazon.com/user/profile",
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
          } as any, // Custom provider type
        ]
      : []),
    ...(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET
      ? [
          {
            id: "ebay",
            name: "eBay",
            type: "oauth" as const,
            authorization: {
              url: "https://auth.ebay.com/oauth2/authorize",
              params: {
                response_type: "code",
                scope: "https://api.ebay.com/oauth/api_scope",
              },
            },
            token: "https://api.ebay.com/identity/v1/oauth2/token",
            userinfo: "https://api.ebay.com/identity/v1/userinfo",
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
          } as any, // Custom provider type
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
