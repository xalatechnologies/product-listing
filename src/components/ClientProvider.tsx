"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { safeLogError } from "@/lib/utils/errorUtils";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Global error handler to catch unhandled errors and sanitize them
    // This helps prevent 431 errors from Next.js error overlay serialization
    const handleError = (event: ErrorEvent) => {
      safeLogError("Global Error Handler", event.error || event.message);
      
      // Sanitize the error object to prevent large serialization
      if (event.error && event.error instanceof Error) {
        // Replace the error with a sanitized version
        const originalError = event.error;
        const sanitized = new Error(originalError.message);
        sanitized.name = originalError.name;
        sanitized.stack = originalError.stack?.split("\n").slice(0, 10).join("\n");
        // Replace the error property with sanitized version
        Object.defineProperty(event, "error", {
          value: sanitized,
          writable: false,
          configurable: true,
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      safeLogError("Unhandled Promise Rejection", event.reason);
      
      // Sanitize the rejection reason if it's an error object
      if (event.reason instanceof Error) {
        const originalError = event.reason;
        const sanitized = new Error(originalError.message);
        sanitized.name = originalError.name;
        sanitized.stack = originalError.stack?.split("\n").slice(0, 10).join("\n");
        // Replace the reason with sanitized version
        Object.defineProperty(event, "reason", {
          value: sanitized,
          writable: false,
          configurable: true,
        });
      }
    };

    window.addEventListener("error", handleError, true); // Use capture phase
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
