/**
 * Integration tests for image router
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestUser, createTestProject } from '../../../../tests/integration/setup';
import { createAuthenticatedCaller, createUnauthenticatedCaller } from '../../../../tests/integration/trpc-utils';
import { ImageType } from '@prisma/client';

describe('Image Router Integration Tests', () => {
  let userId: string;
  let otherUserId: string;
  let projectId: string;
  let otherProjectId: string;

  beforeEach(async () => {
    const user = await createTestUser('user1@example.com');
    userId = user.id;

    const otherUser = await createTestUser('user2@example.com');
    otherUserId = otherUser.id;

    const project = await createTestProject(userId);
    projectId = project.id;

    const otherProject = await createTestProject(otherUserId);
    otherProjectId = otherProject.id;
  });

  describe('upload', () => {
    it('should upload product image', async () => {
      const caller = createAuthenticatedCaller(userId);

      const image = await caller.image.upload({
        projectId,
        url: 'https://example.com/image.jpg',
        width: 1000,
        height: 1000,
        size: 100000,
        order: 0,
      });

      expect(image).toBeDefined();
      expect(image.projectId).toBe(projectId);
      expect(image.url).toBe('https://example.com/image.jpg');
      expect(image.width).toBe(1000);
      expect(image.height).toBe(1000);
    });

    it('should not upload to other user project', async () => {
      const caller = createAuthenticatedCaller(userId);

      await expect(
        caller.image.upload({
          projectId: otherProjectId,
          url: 'https://example.com/image.jpg',
          width: 1000,
          height: 1000,
          size: 100000,
        })
      ).rejects.toThrow();
    });

    it('should fail when unauthenticated', async () => {
      const caller = createUnauthenticatedCaller();

      await expect(
        caller.image.upload({
          projectId,
          url: 'https://example.com/image.jpg',
          width: 1000,
          height: 1000,
          size: 100000,
        })
      ).rejects.toThrow();
    });

    it('should validate input schema', async () => {
      const caller = createAuthenticatedCaller(userId);

      await expect(
        caller.image.upload({
          projectId,
          url: 'not-a-url', // Invalid URL
          width: 1000,
          height: 1000,
          size: 100000,
        })
      ).rejects.toThrow();
    });
  });

  describe('listProductImages', () => {
    it('should list product images for project', async () => {
      const caller = createAuthenticatedCaller(userId);

      // Upload images
      await caller.image.upload({
        projectId,
        url: 'https://example.com/image1.jpg',
        width: 1000,
        height: 1000,
        size: 100000,
        order: 0,
      });

      await caller.image.upload({
        projectId,
        url: 'https://example.com/image2.jpg',
        width: 1000,
        height: 1000,
        size: 100000,
        order: 1,
      });

      const images = await caller.image.listProductImages({ projectId });

      expect(images).toHaveLength(2);
      expect(images[0].order).toBe(0);
      expect(images[1].order).toBe(1);
    });

    it('should return empty array when no images', async () => {
      const caller = createAuthenticatedCaller(userId);

      const images = await caller.image.listProductImages({ projectId });

      expect(images).toHaveLength(0);
    });

    it('should not list images for other user project', async () => {
      const caller = createAuthenticatedCaller(userId);

      await expect(caller.image.listProductImages({ projectId: otherProjectId })).rejects.toThrow();
    });
  });

  describe('deleteProductImage', () => {
    it('should delete product image', async () => {
      const caller = createAuthenticatedCaller(userId);

      const image = await caller.image.upload({
        projectId,
        url: 'https://example.com/image.jpg',
        width: 1000,
        height: 1000,
        size: 100000,
      });

      const result = await caller.image.deleteProductImage({ id: image.id });

      expect(result.success).toBe(true);

      // Verify image is deleted
      const images = await caller.image.listProductImages({ projectId });
      expect(images).toHaveLength(0);
    });

    it('should not delete other user image', async () => {
      const caller = createAuthenticatedCaller(userId);
      const otherCaller = createAuthenticatedCaller(otherUserId);

      const image = await otherCaller.image.upload({
        projectId: otherProjectId,
        url: 'https://example.com/image.jpg',
        width: 1000,
        height: 1000,
        size: 100000,
      });

      await expect(caller.image.deleteProductImage({ id: image.id })).rejects.toThrow();
    });
  });

  describe('list (generated images)', () => {
    it('should list generated images for project', async () => {
      const caller = createAuthenticatedCaller(userId);

      // Note: In a real scenario, generated images would be created by the image generation process
      // For testing, we can verify the query works even with empty results
      const images = await caller.image.list({ projectId });

      expect(Array.isArray(images)).toBe(true);
    });

    it('should not list generated images for other user project', async () => {
      const caller = createAuthenticatedCaller(userId);

      await expect(caller.image.list({ projectId: otherProjectId })).rejects.toThrow();
    });
  });

  describe('generate', () => {
    it('should validate project ownership', async () => {
      const caller = createAuthenticatedCaller(userId);

      await expect(
        caller.image.generate({
          projectId: otherProjectId,
          type: ImageType.MAIN_IMAGE,
        })
      ).rejects.toThrow();
    });

    it('should fail when unauthenticated', async () => {
      const caller = createUnauthenticatedCaller();

      await expect(
        caller.image.generate({
          projectId,
          type: ImageType.MAIN_IMAGE,
        })
      ).rejects.toThrow();
    });
  });
});

