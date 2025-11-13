import { serve } from "inngest/next";
import { inngest, userRegisteredFn, messageHandlerFn } from "@/../inngest.config";
import { generateListingImagesFn } from "@/lib/inngest/functions/generateImages";

export const { POST, GET } = serve({
  client: inngest,
  functions: [userRegisteredFn, messageHandlerFn, generateListingImagesFn],
});

