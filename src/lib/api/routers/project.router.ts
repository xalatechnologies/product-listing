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
import { TRPCError } from "@trpc/server";
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

      const project = await ctx.db.project.create({
        data: {
          userId,
          ...input,
          status: ProjectStatus.DRAFT,
        },
        include: {
          brandKit: true,
          _count: {
            select: {
              productImages: true,
              generatedImages: true,
            },
          },
        },
      });

      return project;
    }),

  /**
   * List all projects for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const projects = await ctx.db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        brandKit: true,
        _count: {
          select: {
            productImages: true,
            generatedImages: true,
          },
        },
      },
    });

    return projects;
  }),

  /**
   * Get a single project by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const project = await ctx.db.project.findFirst({
        where: {
          id: input.id,
          userId,
        },
        include: {
          productImages: {
            orderBy: { order: "asc" },
          },
          generatedImages: {
            orderBy: { createdAt: "desc" },
          },
          brandKit: true,
          aPlusContent: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return project;
    }),

  /**
   * Update a project
   */
  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      // Verify project belongs to user
      const existing = await ctx.db.project.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const project = await ctx.db.project.update({
        where: { id },
        data,
        include: {
          brandKit: true,
          _count: {
            select: {
              productImages: true,
              generatedImages: true,
            },
          },
        },
      });

      return project;
    }),

  /**
   * Delete a project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify project belongs to user
      const existing = await ctx.db.project.findFirst({
        where: { id: input.id, userId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Delete project (cascade will delete related images)
      await ctx.db.project.delete({
        where: { id: input.id },
      });

      // TODO: Delete files from Supabase Storage
      // await deleteProjectFiles(userId, input.id, "product-images");
      // await deleteProjectFiles(userId, input.id, "generated-images");

      return { success: true };
    }),
});

