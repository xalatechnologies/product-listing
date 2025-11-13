"use client";

/**
 * Billing Dashboard Page
 * 
 * Displays subscription status, credit balance, and billing management
 */

import { api } from "@/lib/trpc/react";
import { toast } from "react-toastify";
import { CreditCard, Zap, Calendar, AlertCircle, CheckCircle2, XCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { CreditBalance } from "@/components/CreditBalance";
import { CreditHistory } from "@/components/CreditHistory";
import { useState } from "react";

export default function BillingPage() {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: subscription, isLoading: subscriptionLoading } = api.subscription.get.useQuery();
  const { data: credits } = api.subscription.getCredits.useQuery();

  const cancelSubscription = api.subscription.cancel.useMutation({
    onSuccess: () => {
      toast.success("Subscription will be canceled at the end of the billing period");
      setShowCancelConfirm(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  const resumeSubscription = api.subscription.resume.useMutation({
    onSuccess: () => {
      toast.success("Subscription resumed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resume subscription");
    },
  });

  const purchaseCredits = api.subscription.purchaseCredits.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create checkout session");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to purchase credits");
    },
  });

  // Credit packages (these would typically come from Stripe products)
  const creditPackages = [
    { credits: 10, price: 19, priceId: "" }, // Placeholder - needs actual Stripe price IDs
    { credits: 25, price: 39, priceId: "" },
    { credits: 50, price: 69, priceId: "" },
    { credits: 100, price: 119, priceId: "" },
  ];

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const planNames: Record<string, string> = {
    FREE: "Free",
    STARTER: "Starter",
    PROFESSIONAL: "Professional",
    AGENCY: "Agency",
  };

  const planCredits: Record<string, number> = {
    FREE: 0,
    STARTER: 10,
    PROFESSIONAL: 50,
    AGENCY: 999999,
  };

  const canUpgrade = !subscription || (subscription.plan === "FREE" || subscription.plan === "STARTER" || subscription.plan === "PROFESSIONAL");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Billing & Subscription</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your subscription and credits</p>
      </div>

      {/* Credit Balance - Prominent Display */}
      <div className="mb-8">
        <CreditBalance />
      </div>

      {/* Subscription Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Current Subscription
            </h2>
            {subscription ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {planNames[subscription.plan] || subscription.plan}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      subscription.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : subscription.status === "TRIALING"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : subscription.status === "PAST_DUE"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {subscription.status === "ACTIVE" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {subscription.status === "PAST_DUE" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {subscription.status === "CANCELED" && <XCircle className="h-3 w-3 mr-1" />}
                    {subscription.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {planCredits[subscription.plan] || 0} credits per month
                </p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No active subscription</p>
            )}
          </div>

          <div className="flex gap-2">
            {canUpgrade && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Zap className="h-4 w-4" />
                Upgrade Plan
              </Link>
            )}
            {subscription && subscription.status === "ACTIVE" && !subscription.cancelAtPeriodEnd && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="inline-flex items-center gap-2 rounded-md border border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Cancel Subscription
              </button>
            )}
            {subscription && subscription.cancelAtPeriodEnd && (
              <button
                onClick={() => resumeSubscription.mutate()}
                disabled={resumeSubscription.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Resume Subscription
              </button>
            )}
          </div>
        </div>

        {/* Subscription Details */}
        {subscription && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Period</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Billing Date</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {subscription.cancelAtPeriodEnd
                    ? "Subscription ends on " + new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    : new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </dd>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credit Purchase Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Purchase Credits</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Buy additional credits to use for image generation and A+ content creation.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.credits}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pkg.credits}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">credits</div>
              </div>
              <div className="text-center mb-3">
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">${pkg.price}</span>
              </div>
              <button
                onClick={() => {
                  if (!pkg.priceId) {
                    toast.error("Credit packages not configured. Please contact support.");
                    return;
                  }
                  purchaseCredits.mutate({
                    amount: pkg.credits,
                    priceId: pkg.priceId,
                  });
                }}
                disabled={purchaseCredits.isPending || !pkg.priceId}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchaseCredits.isPending ? "Processing..." : "Purchase"}
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          Note: Credit packages need to be configured in Stripe. Contact support for assistance.
        </p>
      </div>

      {/* Credit History */}
      <div className="mb-8">
        <CreditHistory />
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Cancel Subscription?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Your subscription will remain active until the end of the current billing period (
                {subscription && new Date(subscription.currentPeriodEnd).toLocaleDateString()}). You will
                continue to have access to all features until then.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => cancelSubscription.mutate()}
                  disabled={cancelSubscription.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelSubscription.isPending ? "Canceling..." : "Cancel Subscription"}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

