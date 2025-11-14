import { createCallerFactory, createTRPCRouter } from "./trpc";
import { projectRouter } from "./routers/project.router";
import { brandKitRouter } from "./routers/brandKit.router";
import { imageRouter } from "./routers/image.router";
import { subscriptionRouter } from "./routers/subscription.router";
import { aPlusRouter } from "./routers/aPlus.router";
import { exportRouter } from "./routers/export.router";
import { userRouter } from "./routers/user.router";
import { jobRouter } from "./routers/job.router";
import { adminRouter } from "./routers/admin.router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  project: projectRouter,
  brandKit: brandKitRouter,
  image: imageRouter,
  subscription: subscriptionRouter,
  aPlus: aPlusRouter,
  export: exportRouter,
  user: userRouter,
  job: jobRouter,
  admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
