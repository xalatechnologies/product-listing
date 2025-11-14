import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Log for debugging
    console.log("Middleware - Token exists:", !!req.nextauth.token);
    console.log("Middleware - Path:", req.nextUrl.pathname);
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check for token
        const hasToken = !!token;
        
        // Also check for session cookie as fallback
        const hasSessionCookie = req.cookies.has("next-auth.session-token") || 
                                 req.cookies.has("__Secure-next-auth.session-token");
        
        console.log("Middleware auth check - Token:", hasToken, "Cookie:", hasSessionCookie);
        
        return hasToken || hasSessionCookie;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/profile/:path*", "/billing/:path*"],
};

