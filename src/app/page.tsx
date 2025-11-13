import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/landing/Navigation";
import { AmazonHero } from "@/components/landing/AmazonHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BusinessFeatures } from "@/components/landing/BusinessFeatures";
import { CaseStudies } from "@/components/landing/CaseStudies";
import { ProfessionalPricing } from "@/components/landing/ProfessionalPricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export const dynamic = "force-dynamic";

async function getSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

export default async function Page() {
  const session = await getSession();

  // Redirect authenticated users to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <AmazonHero />
        <HowItWorks />
        <BusinessFeatures />
        <CaseStudies />
        <ProfessionalPricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
