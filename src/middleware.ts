import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check for token first (primary method)
        if (token) {
          return true;
        }
        
        // Fallback: check for session cookie
        // This helps when session is manually created via Supabase auth
        const hasSessionCookie = 
          req.cookies.has("next-auth.session-token") || 
          req.cookies.has("__Secure-next-auth.session-token");
        
        return hasSessionCookie;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/projects/:path*",
    "/profile/:path*",
    "/billing/:path*",
  ],
};

