import React from "react";
import "@/app/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { TRPCReactProvider } from "@/lib/trpc/react";
import { Metadata } from "next";
import ClientProvider from "@/components/ClientProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeAwareToast } from "@/components/theme/ThemeAwareToast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "ListingAI - AI-Powered Product Listings for Amazon, Shopify, eBay & More",
  description: "Generate professional product images, A+ content, and brand-consistent listings for Amazon, Shopify, eBay, Etsy, and more in minutes with AI. Boost your e-commerce sales across all platforms.",
  keywords: ["AI product listings", "Amazon A+ content", "Shopify product images", "eBay listings", "Etsy product photos", "e-commerce AI", "product photography", "listing generator"],
  authors: [{ name: "ListingAI" }],
  openGraph: {
    title: "ListingAI - AI-Powered Multi-Platform Product Listings",
    description: "Create stunning product listings for Amazon, Shopify, eBay, and Etsy in minutes with AI",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="system" enableSystem>
            <ClientProvider>
              <TRPCReactProvider>
                {children}
                <ThemeAwareToast />
              </TRPCReactProvider>
            </ClientProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
