"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  loggerLink,
  httpBatchStreamLink,
  createWSClient,
  wsLink,
  splitLink,
  createTRPCClient,
  type CreateTRPCClient,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import SuperJSON from "superjson";

import { type AppRouter } from "@/lib/api/root";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes - cache garbage collection (formerly cacheTime)
        refetchOnWindowFocus: false, // Don't refetch on window focus
        retry: 1, // Only retry once on failure
      },
      mutations: {
        retry: false, // Don't retry mutations
      },
    },
  });

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient());
};

export const api = createTRPCReact<AppRouter>();

// create persistent WebSocket connection
const wsClient =
  typeof window !== "undefined"
    ? createWSClient({
        url:
          process.env.NODE_ENV === "development"
            ? "ws://localhost:3001"
            : `wss://${window.location.host}`,
      })
    : undefined;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState<CreateTRPCClient<AppRouter>>(() => {
    return createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        splitLink({
          condition: (op) => !!wsClient && op.type === "subscription",
          true: wsLink({
            client: wsClient!,
            transformer: SuperJSON,
          }),
          false: httpBatchStreamLink({
            transformer: SuperJSON,
            url: getBaseUrl() + "/api/trpc",
            headers: () => {
              return {
                "x-trpc-source": "nextjs-react",
              };
            },
          }),
        }),
      ],
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient as any} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
