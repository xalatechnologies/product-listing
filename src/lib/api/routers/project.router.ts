/**
 * Project router for managing product listing projects.
 *
 * Handles CRUD operations for projects, including:
 * - Creating new projects
 * - Listing user's projects
 * - Getting project details
 * - Updating projects
 * - Deleting projects
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ProjectStatus } from "@prisma/client";

const projectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  productName: z.string().min(1).max(255),
  productCategory: z.string().optional(),
  brandKitId: z.string().optional(),
});

const updateProjectSchema = projectSchema.partial().extend({
  id: z.string(),
});

export const projectRouter = createTRPCRouter({
  /**
   * Create a new project
   */
  create: protectedProcedure
    .input(projectSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // TODO: Implement project creation after Prisma client is generated
      // const project = await ctx.db.project.create({
      //   data: {
      //     userId,
      //     ...input,
      //     status: ProjectStatus.DRAFT,
      //   },
      // });

      // return project;

      throw new Error("Not implemented: Prisma client needs to be generated");
    }),

  /**
   * List all projects for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // TODO: Implement project listing after Prisma client is generated
    // const projects = await ctx.db.project.findMany({
    //   where: { userId },
    //   orderBy: { updatedAt: "desc" },
    //   include: {
    //     brandKit: true,
    //     _count: {
    //       select: {
    //         productImages: true,
    //         generatedImages: true,
    //       },
    //     },
    //   },
    // });

    // return projects;

    throw new Error("Not implemented: Prisma client needs to be generated");
  }),

  /**
   * Get a single project by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // TODO: Implement project retrieval after Prisma client is generated
      // const project = await ctx.db.project.findFirst({
      //   where: {
      //     id: input.id,
      //     userId,
      //   },
      //   include: {
      //     productImages: {
      //       orderBy: { order: "asc" },
      //     },
      //     generatedImages: {
      //       orderBy: { createdAt: "desc" },
      //     },
      //     brandKit: true,
      //     aPlusContent: true,
      //   },
      // });

      // if (!project) {
      //   throw new TRPCError({
      //     code: "NOT_FOUND",
      //     message: "Project not found",
      //   });
      // }

      // return project;

      throw new Error("Not implemented: Prisma client needs to be generated");
    }),

  /**
   * Update a project
   */
  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      // TODO: Implement project update after Prisma client is generated
      // const project = await ctx.db.project.updateMany({
      //   where: {
      //     id,
      //     userId,
      //   },
      //   data,
      // });

      // return project;

      throw new Error("Not implemented: Prisma client needs to be generated");
    }),

  /**
   * Delete a project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // TODO: Implement project deletion after Prisma client is generated
      // await ctx.db.project.deleteMany({
      //   where: {
      //     id: input.id,
      //     userId,
      //   },
      // });

      // return { success: true };

      throw new Error("Not implemented: Prisma client needs to be generated");
    }),
});

