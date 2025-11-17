"use client";

/**
 * Onboarding tour component for new users
 * Shows a step-by-step guide to key features
 */

import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  action?: {
    label: string;
    href: string;
  };
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to ListingAI!",
    description: "Let's take a quick tour to help you get started. We'll show you how to create projects, upload images, and generate professional listings.",
  },
  {
    id: "statistics",
    title: "Track Your Progress",
    description: "Monitor your total projects, uploaded images, and generated content. Your credit balance is shown here too.",
    target: "[data-onboarding='statistics']",
  },
  {
    id: "quick-actions",
    title: "Quick Actions",
    description: "Use these shortcuts to quickly create projects, set up brand kits, or manage your credits.",
    target: "[data-onboarding='quick-actions']",
  },
  {
    id: "create-project",
    title: "Create Your First Project",
    description: "Click 'New Project' to start. You'll be able to upload product images and generate professional listings.",
    action: {
      label: "Create Project",
      href: "/projects/new",
    },
  },
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    setMounted(true);
    
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem("onboarding_completed") === "true";
    
    // Show onboarding if not completed
    if (!hasCompletedOnboarding) {
      // Small delay to ensure page is rendered
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted || !isVisible) return null;

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    setIsVisible(false);
  };

  const handleAction = () => {
    const step = onboardingSteps[currentStep];
    if (step.action) {
      handleComplete();
      router.push(step.action.href);
    }
  };

  if (!isVisible) return null;

  const step = onboardingSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSkip} />

      {/* Tour Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 pointer-events-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Step {currentStep + 1} of {onboardingSteps.length}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {step.description}
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex gap-1">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded ${
                    index <= currentStep
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Skip tour
            </button>

            <div className="flex gap-2">
              {!isFirstStep && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
              )}

              {step.action ? (
                <button
                  onClick={handleAction}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {step.action.label}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

