"use client";

/**
 * Credit History Component
 * 
 * Displays credit transaction history with pagination
 */

import { api } from "@/lib/trpc/react";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Minus } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export function CreditHistory() {
  const [offset, setOffset] = useState(0);

  const { data: history, isLoading } = api.subscription.getCreditHistory.useQuery({
    limit: ITEMS_PER_PAGE,
    offset,
  });

  const transactions = history?.transactions || [];
  const total = history?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const currentPage = Math.floor(offset / ITEMS_PER_PAGE) + 1;

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SUBSCRIPTION: "Monthly Subscription",
      PURCHASE: "Credit Purchase",
      USAGE: "Usage",
      REFUND: "Refund",
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    if (type === "USAGE") return "text-red-600 dark:text-red-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Credit History</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No credit transactions yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {getTransactionTypeLabel(transaction.type)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {transaction.description || "-"}
                    </td>
                    <td
                      className={`py-3 px-4 text-sm font-medium text-right ${getTransactionTypeColor(
                        transaction.type,
                      )}`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {transaction.amount > 0 ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <Minus className="h-4 w-4" />
                        )}
                        {Math.abs(transaction.amount).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {offset + 1} to {Math.min(offset + ITEMS_PER_PAGE, total)} of {total} transactions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - ITEMS_PER_PAGE))}
                  disabled={offset === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + ITEMS_PER_PAGE)}
                  disabled={offset + ITEMS_PER_PAGE >= total}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

