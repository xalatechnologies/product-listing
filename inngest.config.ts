import { Inngest } from "inngest";
import { serve } from "inngest/next";

// Define event types for better type safety
export type AppEvents = {
  "user/registered": {
    data: {
      userId: string;
      email: string;
      name?: string;
      timestamp: string;
    };
  };
  "inngest/send": {
    data: {
      message: string;
      metadata?: Record<string, any>;
    };
  };
  "image/generate": {
    data: {
      projectId: string;
      userId: string;
      imageType: string;
      style?: string;
    };
  };
};

// Initialize Inngest with typed events
export const inngest = new Inngest({
  id: "product-listing",
  eventKey: process.env.INNGEST_EVENT_KEY || "local",
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

// Define event handlers
export const userRegisteredFn = inngest.createFunction(
  { id: "user-registered-handler" },
  { event: "user/registered" },
  async ({ event, step }) => {
    await step.run("Log registration", async () => {
      console.log(`New user registered: ${event.data.email}`);
    });

    // Example: Send welcome email
    await step.run("Send welcome email", async () => {
      // Add your email sending logic here
      console.log(`Sending welcome email to ${event.data.email}`);
    });
  },
);

export const messageHandlerFn = inngest.createFunction(
  { id: "message-handler" },
  { event: "inngest/send" },
  async ({ event, step }) => {
    await step.run("Process message", async () => {
      console.log(`Processing message: ${event.data.message}`);
      if (event.data.metadata) {
        console.log("Metadata:", event.data.metadata);
      }
    });
  },
);

// Export the serve function for use in API routes
// Functions will be added dynamically in the API route handler
export const serveInngest = serve({
  client: inngest,
  functions: [userRegisteredFn, messageHandlerFn],
});
