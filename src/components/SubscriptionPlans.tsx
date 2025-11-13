"use client";

/**
 * Subscription Plans Component
 * 
 * Displays subscription plans with pricing and features
 */

import { api } from "@/lib/trpc/react";
import { SubscriptionPlan } from "@prisma/client";
import { Check, Zap, Sparkles, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  credits: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: 29,
    credits: 10,
    features: [
      "10 credits per month",
      "Basic image generation",
      "1 A+ module per month",
      "Email support",
      "Standard styles",
    ],
    icon: <Zap className="h-6 w-6" />,
  },
  {
    id: "PROFESSIONAL",
    name: "Professional",
    price: 79,
    credits: 50,
    features: [
      "50 credits per month",
      "Unlimited image generation",
      "5 A+ modules per month",
      "Priority support",
      "All styles & templates",
      "Up to 3 brand kits",
    ],
    icon: <Sparkles className="h-6 w-6" />,
    popular: true,
  },
  {
    id: "AGENCY",
    name: "Agency",
    price: 299,
    credits: 999999,
    features: [
      "Unlimited credits",
      "Unlimited everything",
      "Unlimited A+ modules",
      "Unlimited brand kits",
      "Bulk generation",
      "API access",
      "Priority GPU queue",
      "Team workspace (5 users)",
    ],
    icon: <Building2 className="h-6 w-6" />,
  },
];

export function SubscriptionPlans() {
  const router = useRouter();
  const { data: currentSubscription } = api.subscription.get.useQuery();

  const createCheckout = api.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create checkout session");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const handleSubscribe = (planId: SubscriptionPlan) => {
    createCheckout.mutate({ plan: planId });
  };

  const isCurrentPlan = (planId: SubscriptionPlan) => {
    return currentSubscription?.plan === planId;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrent = isCurrentPlan(plan.id);
        const isUpgrade =
          currentSubscription &&
          (currentSubscription.plan === "FREE" ||
            (currentSubscription.plan === "STARTER" && plan.id !== "STARTER") ||
            (currentSubscription.plan === "PROFESSIONAL" && plan.id === "AGENCY"));

        return (
          <div
            key={plan.id}
            className={`relative bg-white dark:bg-gray-800 rounded-lg border-2 p-6 ${
              plan.popular
                ? "border-blue-500 dark:border-blue-400 shadow-lg"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                {plan.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">${plan.price}</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {plan.credits === 999999 ? "Unlimited" : `${plan.credits} credits`} per month
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={createCheckout.isPending || isCurrent}
              className={`w-full py-2.5 px-4 rounded-md font-medium transition-colors ${
                isCurrent
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : plan.popular
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {createCheckout.isPending
                ? "Processing..."
                : isCurrent
                  ? "Current Plan"
                  : isUpgrade
                    ? "Upgrade"
                    : "Subscribe"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

