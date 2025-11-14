"use client";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Loader2, Sparkles, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { signInWithPassword } from "@/lib/auth/supabase";

// Check if OAuth providers are available
const hasGoogleAuth = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const hasGitHubAuth = !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const hasAppleAuth = !!process.env.NEXT_PUBLIC_APPLE_ID;
const hasAmazonAuth = !!process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID;
const hasEbayAuth = !!process.env.NEXT_PUBLIC_EBAY_CLIENT_ID;

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (usePassword && !password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    
    try {
      if (usePassword) {
        // Use Supabase password authentication
        try {
          const result = await signInWithPassword(email, password);
          
          if (!result.user || !result.session) {
            toast.error("Failed to sign in. Please try again.");
            setIsLoading(false);
            return;
          }

          // Sync user to Prisma if needed
          try {
            const syncResponse = await fetch("/api/auth/sync-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: result.user.id }),
            });
            
            if (!syncResponse.ok) {
              console.warn("Failed to sync user to Prisma");
            }
          } catch (syncError) {
            console.warn("User sync error:", syncError);
          }

          // Create NextAuth session from Supabase auth
          // This allows the middleware to recognize the user as authenticated
          try {
            const sessionResponse = await fetch("/api/auth/supabase-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                accessToken: result.session.access_token 
              }),
              credentials: "include", // Important: include cookies
            });

            if (!sessionResponse.ok) {
              const errorData = await sessionResponse.json().catch(() => ({}));
              console.error("Failed to create NextAuth session:", errorData);
              toast.error("Session creation failed. Please try again.");
              setIsLoading(false);
              return;
            }

            const sessionData = await sessionResponse.json();
            console.log("Session created successfully:", sessionData);
            
            // Wait a moment for cookie to be set
            await new Promise(resolve => setTimeout(resolve, 300));
            
            toast.success("Signed in successfully!");
            
            // Use window.location for full page reload to ensure session is recognized
            console.log("Redirecting to:", callbackUrl);
            window.location.href = callbackUrl;
          } catch (sessionError) {
            console.error("Session creation error:", sessionError);
            toast.error("Failed to create session. Please try again.");
            setIsLoading(false);
            return;
          }
        } catch (error: any) {
          toast.error(error.message || "Invalid email or password");
          setIsLoading(false);
          return;
        }
      } else {
        // Use NextAuth magic link
        const result = await signIn("email", { 
          email, 
          callbackUrl,
          redirect: false,
        });

        if (result?.error) {
          toast.error("Failed to send sign-in link. Please try again.");
          setIsLoading(false);
        } else {
          toast.success("Check your email for the sign-in link!");
          router.push("/auth/verify");
        }
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 px-4 py-12">
      <Link
        href="/"
        className="group absolute left-4 top-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-white/50 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/50"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to home
      </Link>

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-blue-600 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Sign in to your account to continue creating amazing product listings
            </p>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-8 shadow-xl">
          {/* Toggle between password and magic link */}
          <div className="mb-6 flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              type="button"
              onClick={() => {
                setUsePassword(true);
                setPassword("");
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                usePassword
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setUsePassword(false);
                setPassword("");
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                !usePassword
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="block w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {usePassword && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required={usePassword}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="block w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sign in with your password
                  </p>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            {!usePassword && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                We'll send you a magic link to sign in securely
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || (usePassword && !password)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-blue-600 px-4 py-3 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {usePassword ? "Signing in..." : "Sending magic link..."}
                </>
              ) : (
                <>
                  {usePassword ? (
                    <>
                      <Lock className="h-5 w-5" />
                      Sign in
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      Send magic link
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* OAuth Providers */}
          {(hasGoogleAuth || hasGitHubAuth || hasAppleAuth || hasAmazonAuth || hasEbayAuth) && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {hasGoogleAuth && (
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl })}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                )}

                {hasGitHubAuth && (
                  <button
                    type="button"
                    onClick={() => signIn("github", { callbackUrl })}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Continue with GitHub
                  </button>
                )}

                {hasAppleAuth && (
                  <button
                    type="button"
                    onClick={() => signIn("apple", { callbackUrl })}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-black dark:bg-gray-900 px-4 py-3 text-white font-semibold hover:bg-gray-900 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.41.88-3.31-.1-1.03-1.11-2.23-1.11-3.48 0-.9.98-2.33 1.05-3.31.1a2.4 2.4 0 0 1-.26-3.19C8.29 15.54 9.8 14.62 9.8 13.5c0-1.21-1.51-2.04-2.11-3.43a2.4 2.4 0 0 1 .26-3.19c.98-.95 2.41-.88 3.31.1 1.03 1.11 2.23 1.11 3.48 0 .9-.98 2.33-1.05 3.31-.1a2.4 2.4 0 0 1 .26 3.19C16.71 8.46 15.2 9.38 15.2 10.5c0 1.21 1.51 2.04 2.11 3.43a2.4 2.4 0 0 1-.26 3.19z" />
                    </svg>
                    Continue with Apple
                  </button>
                )}

                {hasAmazonAuth && (
                  <button
                    type="button"
                    onClick={() => signIn("amazon", { callbackUrl })}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.94 4.66h-2.5l-1.5 8.5h2.5l1.5-8.5zm-5.5 0H6.94l-1.5 8.5h2.5l1.5-8.5zm11 0h-2.5l-1.5 8.5h2.5l1.5-8.5zm-5.5 0h-2.5l-1.5 8.5h2.5l1.5-8.5z" />
                      <path d="M22 19.5H2v-15h20v15z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    Continue with Amazon
                  </button>
                )}

                {hasEbayAuth && (
                  <button
                    type="button"
                    onClick={() => signIn("ebay", { callbackUrl })}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                    Continue with eBay
                  </button>
                )}
              </div>
            </>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                New to ListingAI?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            href="/auth/signup"
            className="block w-full text-center rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            Create an account
          </Link>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our{" "}
              <Link
                href="/legal/privacy"
                className="font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/legal/terms"
                className="font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
              >
                Terms of Service
              </Link>
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help?{" "}
            <Link
              href="/support"
              className="font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
