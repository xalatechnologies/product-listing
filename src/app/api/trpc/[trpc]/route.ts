import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { appRouter } from "@/lib/api/root";
import { createTRPCContext } from "@/lib/api/trpc";
import { safeLogError } from "@/lib/utils/errorUtils";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const env = process.env;

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: ({ path, error }) => {
      // Use safe logging to prevent 431 errors from large error serialization
      safeLogError(`tRPC [${path ?? "<no-path>"}]`, error);
    },
  });

export { handler as GET, handler as POST };
