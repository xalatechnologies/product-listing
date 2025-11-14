/**
 * Integration tests for brand kit router
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestUser, createTestBrandKit, createTestProject } from '../../../../../tests/integration/setup';
import { createAuthenticatedCaller, createUnauthenticatedCaller } from '../../../../../tests/integration/trpc-utils';

describe('Brand Kit Router Integration Tests', () => {
  let userId: string;
  let otherUserId: string;

  beforeEach(async () => {
    const user = await createTestUser('user1@example.com');
    userId = user.id;

    const otherUser = await createTestUser('user2@example.com');
    otherUserId = otherUser.id;
  });

  describe('create', () => {
    it('should create a new brand kit', async () => {
      const caller = createAuthenticatedCaller(userId);

      const brandKit = await caller.brandKit.create({
        name: 'Test Brand Kit',
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        accentColor: '#FF0000',
      });

      expect(brandKit).toBeDefined();
      expect(brandKit.name).toBe('Test Brand Kit');
      expect(brandKit.primaryColor).toBe('#000000');
      expect(brandKit.userId).toBe(userId);
      expect(brandKit.isDefault).toBe(false);
    });

    it('should validate hex color format', async () => {
      const caller = createAuthenticatedCaller(userId);

      await expect(
        caller.brandKit.create({
          name: 'Test Brand Kit',
          primaryColor: 'not-a-hex-color', // Invalid format
          secondaryColor: '#FFFFFF',
          accentColor: '#FF0000',
        })
      ).rejects.toThrow();
    });

    it('should fail when unauthenticated', async () => {
      const caller = createUnauthenticatedCaller();

      await expect(
        caller.brandKit.create({
          name: 'Test Brand Kit',
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
          accentColor: '#FF0000',
        })
      ).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should list user brand kits', async () => {
      const caller = createAuthenticatedCaller(userId);

      await createTestBrandKit(userId, { name: 'Brand Kit 1' });
      await createTestBrandKit(userId, { name: 'Brand Kit 2' });
      await createTestBrandKit(otherUserId, { name: 'Other User Brand Kit' });

      const brandKits = await caller.brandKit.list();

      expect(brandKits).toHaveLength(2);
      expect(brandKits.find((bk) => bk.name === 'Other User Brand Kit')).toBeUndefined();
    });

    it('should return empty array when user has no brand kits', async () => {
      const caller = createAuthenticatedCaller(userId);

      const brandKits = await caller.brandKit.list();

      expect(brandKits).toHaveLength(0);
    });
  });

  describe('get', () => {
    it('should get brand kit by id', async () => {
      const caller = createAuthenticatedCaller(userId);
      const brandKit = await createTestBrandKit(userId, { name: 'Test Brand Kit' });

      const result = await caller.brandKit.get({ id: brandKit.id });

      expect(result).toBeDefined();
      expect(result?.id).toBe(brandKit.id);
      expect(result?.name).toBe('Test Brand Kit');
    });

    it('should not return other user brand kit', async () => {
      const caller = createAuthenticatedCaller(userId);
      const otherBrandKit = await createTestBrandKit(otherUserId);

      await expect(caller.brandKit.get({ id: otherBrandKit.id })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update brand kit', async () => {
      const caller = createAuthenticatedCaller(userId);
      const brandKit = await createTestBrandKit(userId, { name: 'Original Name' });

      const updated = await caller.brandKit.update({
        id: brandKit.id,
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should not update other user brand kit', async () => {
      const caller = createAuthenticatedCaller(userId);
      const otherBrandKit = await createTestBrandKit(otherUserId);

      await expect(
        caller.brandKit.update({
          id: otherBrandKit.id,
          name: 'Updated Name',
        })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete brand kit', async () => {
      const caller = createAuthenticatedCaller(userId);
      const brandKit = await createTestBrandKit(userId);

      const result = await caller.brandKit.delete({ id: brandKit.id });

      expect(result.success).toBe(true);

      // Verify brand kit is deleted
      await expect(caller.brandKit.get({ id: brandKit.id })).rejects.toThrow();
    });

    it('should not delete other user brand kit', async () => {
      const caller = createAuthenticatedCaller(userId);
      const otherBrandKit = await createTestBrandKit(otherUserId);

      await expect(caller.brandKit.delete({ id: otherBrandKit.id })).rejects.toThrow();
    });
  });

  describe('setDefault', () => {
    it('should set brand kit as default', async () => {
      const caller = createAuthenticatedCaller(userId);
      const brandKit1 = await createTestBrandKit(userId, { name: 'Brand Kit 1' });
      const brandKit2 = await createTestBrandKit(userId, { name: 'Brand Kit 2' });

      await caller.brandKit.setDefault({ id: brandKit1.id });

      const updated1 = await caller.brandKit.get({ id: brandKit1.id });
      const updated2 = await caller.brandKit.get({ id: brandKit2.id });

      expect(updated1?.isDefault).toBe(true);
      expect(updated2?.isDefault).toBe(false);
    });

    it('should unset previous default when setting new default', async () => {
      const caller = createAuthenticatedCaller(userId);
      const brandKit1 = await createTestBrandKit(userId, { name: 'Brand Kit 1' });
      const brandKit2 = await createTestBrandKit(userId, { name: 'Brand Kit 2' });

      await caller.brandKit.setDefault({ id: brandKit1.id });
      await caller.brandKit.setDefault({ id: brandKit2.id });

      const updated1 = await caller.brandKit.get({ id: brandKit1.id });
      const updated2 = await caller.brandKit.get({ id: brandKit2.id });

      expect(updated1?.isDefault).toBe(false);
      expect(updated2?.isDefault).toBe(true);
    });
  });
});

