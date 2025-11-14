/**
 * Integration tests for upload API route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../upload/route';
import { createTestUser, createTestProject } from '../../../tests/integration/setup';
import { getServerAuthSession } from '@/lib/auth';

// Mock NextAuth
vi.mock('@/lib/auth', () => ({
  getServerAuthSession: vi.fn(),
}));

// Mock Supabase Storage
vi.mock('@/lib/storage', () => ({
  uploadProductImage: vi.fn().mockResolvedValue({
    url: 'https://example.com/uploaded-image.jpg',
  }),
}));

describe('Upload API Route Integration Tests', () => {
  let userId: string;
  let projectId: string;

  beforeEach(async () => {
    const user = await createTestUser('user@example.com');
    userId = user.id;

    const project = await createTestProject(userId);
    projectId = project.id;

    // Mock authenticated session
    vi.mocked(getServerAuthSession).mockResolvedValue({
      user: {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        role: 'USER',
      },
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    });
  });

  it('should upload image file', async () => {
    // Create a mock file
    const file = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('type', 'product');

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBeDefined();
    expect(data.width).toBeDefined();
    expect(data.height).toBeDefined();
  });

  it('should reject unauthenticated requests', async () => {
    vi.mocked(getServerAuthSession).mockResolvedValue(null);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('type', 'product');

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should validate file type', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('type', 'product');

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should validate file size', async () => {
    // Create a large file (11MB)
    const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
    const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('type', 'product');

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should require projectId', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'product');

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

