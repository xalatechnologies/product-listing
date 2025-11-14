"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics/analytics";

/**
 * Analytics provider component
 * Tracks page views and initializes analytics scripts
 */
export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view on route change
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    // Load Google Analytics script if configured
    if (process.env.NEXT_PUBLIC_GA_ID && typeof window !== "undefined") {
      const script1 = document.createElement("script");
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
      document.head.appendChild(script1);

      const script2 = document.createElement("script");
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
      `;
      document.head.appendChild(script2);
    }

    // Load Plausible script if configured
    if (process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && typeof window !== "undefined") {
      const script = document.createElement("script");
      script.defer = true;
      script.setAttribute("data-domain", process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN);
      script.src = "https://plausible.io/js/script.js";
      document.head.appendChild(script);
    }
  }, []);

  return null;
}

