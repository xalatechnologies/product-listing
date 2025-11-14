/**
 * Integration tests for project router
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestUser, createTestProject, createTestBrandKit } from '../../../../../tests/integration/setup';
import { createAuthenticatedCaller, createUnauthenticatedCaller } from '../../../../../tests/integration/trpc-utils';
import { ProjectStatus } from '@prisma/client';

describe('Project Router Integration Tests', () => {
  let userId: string;
  let otherUserId: string;

  beforeEach(async () => {
    // Create test users
    const user = await createTestUser('user1@example.com');
    userId = user.id;

    const otherUser = await createTestUser('user2@example.com');
    otherUserId = otherUser.id;
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const caller = createAuthenticatedCaller(userId);

      const project = await caller.project.create({
        name: 'Test Project',
        productName: 'Test Product',
        description: 'Test Description',
      });

      expect(project).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.productName).toBe('Test Product');
      expect(project.status).toBe(ProjectStatus.DRAFT);
      expect(project.userId).toBe(userId);
    });

    it('should create project with brand kit', async () => {
      const caller = createAuthenticatedCaller(userId);
      const brandKit = await createTestBrandKit(userId);

      const project = await caller.project.create({
        name: 'Test Project',
        productName: 'Test Product',
        brandKitId: brandKit.id,
      });

      expect(project.brandKit).toBeDefined();
      expect(project.brandKit?.id).toBe(brandKit.id);
    });

    it('should fail when unauthenticated', async () => {
      const caller = createUnauthenticatedCaller();

      await expect(
        caller.project.create({
          name: 'Test Project',
          productName: 'Test Product',
        })
      ).rejects.toThrow();
    });

    it('should validate input schema', async () => {
      const caller = createAuthenticatedCaller(userId);

      await expect(
        caller.project.create({
          name: '', // Empty name should fail
          productName: 'Test Product',
        })
      ).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should list user projects', async () => {
      const caller = createAuthenticatedCaller(userId);

      // Create multiple projects
      await createTestProject(userId, { name: 'Project 1' });
      await createTestProject(userId, { name: 'Project 2' });
      await createTestProject(otherUserId, { name: 'Other User Project' });

      const result = await caller.project.list();

      // Handle paginated response
      const projects = 'projects' in result ? result.projects : result;
      
      expect(projects).toHaveLength(2);
      expect(projects[0]?.name).toBe('Project 2'); // Should be ordered by updatedAt desc
      expect(projects[1]?.name).toBe('Project 1');
      // Should not include other user's project
      expect(projects.find((p: any) => p.name === 'Other User Project')).toBeUndefined();
    });

    it('should return empty array when user has no projects', async () => {
      const caller = createAuthenticatedCaller(userId);

      const result = await caller.project.list();
      const projects = 'projects' in result ? result.projects : result;

      expect(projects).toHaveLength(0);
    });

    it('should fail when unauthenticated', async () => {
      const caller = createUnauthenticatedCaller();

      await expect(caller.project.list()).rejects.toThrow();
    });
  });

  describe('get', () => {
    it('should get project by id', async () => {
      const caller = createAuthenticatedCaller(userId);
      const project = await createTestProject(userId, { name: 'Test Project' });

      const result = await caller.project.get({ id: project.id });

      expect(result).toBeDefined();
      expect(result?.id).toBe(project.id);
      expect(result?.name).toBe('Test Project');
    });

    it('should return null for non-existent project', async () => {
      const caller = createAuthenticatedCaller(userId);

      const result = await caller.project.get({ id: 'non-existent-id' });

      expect(result).toBeNull();
    });

    it('should not return other user project', async () => {
      const caller = createAuthenticatedCaller(userId);
      const otherProject = await createTestProject(otherUserId, { name: 'Other Project' });

      const result = await caller.project.get({ id: otherProject.id });

      expect(result).toBeNull();
    });

    it('should fail when unauthenticated', async () => {
      const caller = createUnauthenticatedCaller();

      await expect(caller.project.get({ id: 'some-id' })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      const caller = createAuthenticatedCaller(userId);
      const project = await createTestProject(userId, { name: 'Original Name' });

      const updated = await caller.project.update({
        id: project.id,
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.productName).toBe(project.productName); // Should preserve other fields
    });

    it('should update project status', async () => {
      const caller = createAuthenticatedCaller(userId);
      const project = await createTestProject(userId);

      const updated = await caller.project.update({
        id: project.id,
        status: ProjectStatus.PROCESSING,
      });

      expect(updated.status).toBe(ProjectStatus.PROCESSING);
    });

    it('should not update other user project', async () => {
      const caller = createAuthenticatedCaller(userId);
      const otherProject = await createTestProject(otherUserId);

      await expect(
        caller.project.update({
          id: otherProject.id,
          name: 'Updated Name',
        })
      ).rejects.toThrow();
    });

    it('should fail when unauthenticated', async () => {
      const caller = createUnauthenticatedCaller();

      await expect(
        caller.project.update({
          id: 'some-id',
          name: 'Updated Name',
        })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete project', async () => {
      const caller = createAuthenticatedCaller(userId);
      const project = await createTestProject(userId);

      const result = await caller.project.delete({ id: project.id });

      expect(result.success).toBe(true);

      // Verify project is deleted
      const deleted = await caller.project.get({ id: project.id });
      expect(deleted).toBeNull();
    });

    it('should not delete other user project', async () => {
      const caller = createAuthenticatedCaller(userId);
      const otherProject = await createTestProject(otherUserId);

      await expect(caller.project.delete({ id: otherProject.id })).rejects.toThrow();
    });

    it('should fail when unauthenticated', async () => {
      const caller = createUnauthenticatedCaller();

      await expect(caller.project.delete({ id: 'some-id' })).rejects.toThrow();
    });
  });
});

