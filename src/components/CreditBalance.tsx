"use client";

/**
 * Credit Balance Component
 * 
 * Displays user's current credit balance prominently
 */

import { api } from "@/lib/trpc/react";
import { Coins, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { subscribeToCredits } from "@/lib/supabase/realtime";
import { useSession } from "next-auth/react";

interface CreditBalanceProps {
  readonly compact?: boolean;
}

export function CreditBalance({ compact = false }: CreditBalanceProps) {
  const { data: session } = useSession();
  const { data: credits, refetch } = api.subscription.getCredits.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds for updates
  });

  const balance = credits?.balance || 0;

  // Subscribe to realtime credit updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = subscribeToCredits(session.user.id, () => {
      // Refetch credits when transaction changes
      refetch();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [session?.user?.id, refetch]);

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-amber-500 to-blue-600 rounded-lg p-3 text-white">
        <div className="flex items-center justify-center gap-2">
          <Coins className="h-4 w-4" />
          <span className="text-lg font-bold">{balance.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Coins className="h-5 w-5" />
            <h2 className="text-lg font-medium">Credit Balance</h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{balance.toLocaleString()}</span>
            <span className="text-lg opacity-90">credits</span>
          </div>
          {balance === 0 && (
            <p className="text-sm opacity-90 mt-2">You're out of credits. Purchase more to continue generating.</p>
          )}
        </div>
        <div className="bg-white/20 rounded-lg p-3">
          <TrendingUp className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

