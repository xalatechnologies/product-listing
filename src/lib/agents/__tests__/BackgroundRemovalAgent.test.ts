/**
 * Tests for BackgroundRemovalAgent
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BackgroundRemovalAgent } from "../image/BackgroundRemovalAgent";
import { createAgentContext } from "../base";
import * as backgroundRemoval from "@/lib/ai/backgroundRemoval";

vi.mock("@/lib/ai/backgroundRemoval");

describe("BackgroundRemovalAgent", () => {
  let agent: BackgroundRemovalAgent;
  let context: ReturnType<typeof createAgentContext>;

  beforeEach(() => {
    agent = new BackgroundRemovalAgent();
    context = createAgentContext({
      userId: "user-123",
      projectId: "project-456",
    });
    vi.clearAllMocks();
  });

  describe("Properties", () => {
    it("should have correct name and version", () => {
      expect(agent.name).toBe("background-removal");
      expect(agent.version).toBe("1.0.0");
    });
  });

  describe("Validation", () => {
    it("should validate correct input", async () => {
      const result = await agent.validate({
        imageUrl: "https://example.com/image.jpg",
        provider: "removebg",
      });

      expect(result.valid).toBe(true);
    });

    it("should reject missing image URL", async () => {
      const result = await agent.validate({
        imageUrl: "",
        provider: "removebg",
      } as any);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject invalid URL", async () => {
      const result = await agent.validate({
        imageUrl: "not-a-url",
        provider: "removebg",
      });

      expect(result.valid).toBe(false);
    });

    it("should reject invalid provider", async () => {
      const result = await agent.validate({
        imageUrl: "https://example.com/image.jpg",
        provider: "invalid" as any,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Processing", () => {
    it("should successfully remove background with removebg", async () => {
      const mockResult = {
        imageBuffer: Buffer.from("image-data"),
        width: 1000,
        height: 1000,
      };

      vi.spyOn(backgroundRemoval, "removeBackground").mockResolvedValue(mockResult);

      const result = await agent.process(
        {
          imageUrl: "https://example.com/image.jpg",
          provider: "removebg",
        },
        context,
      );

      expect(result.success).toBe(true);
      expect(result.data?.imageBuffer).toBeDefined();
      expect(result.data?.provider).toBe("removebg");
      expect(result.metadata?.processingTime).toBeDefined();
    });

    it("should successfully remove background with replicate", async () => {
      const mockResult = {
        imageBuffer: Buffer.from("image-data"),
        width: 1000,
        height: 1000,
      };

      vi.spyOn(backgroundRemoval, "removeBackgroundReplicate").mockResolvedValue(mockResult);

      const result = await agent.process(
        {
          imageUrl: "https://example.com/image.jpg",
          provider: "replicate",
        },
        context,
      );

      expect(result.success).toBe(true);
      expect(result.data?.provider).toBe("replicate");
    });

    it("should fallback to replicate when removebg fails with auto provider", async () => {
      const mockResult = {
        imageBuffer: Buffer.from("image-data"),
        width: 1000,
        height: 1000,
      };

      vi.spyOn(backgroundRemoval, "removeBackground").mockRejectedValue(new Error("API error"));
      vi.spyOn(backgroundRemoval, "removeBackgroundReplicate").mockResolvedValue(mockResult);

      const result = await agent.process(
        {
          imageUrl: "https://example.com/image.jpg",
          provider: "auto",
        },
        context,
      );

      expect(result.success).toBe(true);
      expect(result.data?.provider).toBe("replicate");
    });

    it("should handle errors gracefully", async () => {
      vi.spyOn(backgroundRemoval, "removeBackground").mockRejectedValue(new Error("API error"));

      const result = await agent.process(
        {
          imageUrl: "https://example.com/image.jpg",
          provider: "removebg",
        },
        context,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Retry Logic", () => {
    it("should retry on network errors", async () => {
      const networkError = new Error("Network timeout");
      const shouldRetry = await agent.shouldRetry(
        { imageUrl: "https://example.com/image.jpg" },
        networkError,
        0,
      );

      expect(shouldRetry).toBe(true);
    });

    it("should retry on rate limit errors", async () => {
      const rateLimitError = new Error("Rate limit exceeded");
      const shouldRetry = await agent.shouldRetry(
        { imageUrl: "https://example.com/image.jpg" },
        rateLimitError,
        0,
      );

      expect(shouldRetry).toBe(true);
    });

    it("should not retry after max attempts", async () => {
      const networkError = new Error("Network timeout");
      const shouldRetry = await agent.shouldRetry(
        { imageUrl: "https://example.com/image.jpg", maxRetries: 3 },
        networkError,
        3,
      );

      expect(shouldRetry).toBe(false);
    });
  });

  describe("Credits", () => {
    it("should return correct credits required", async () => {
      const credits = await agent.getCreditsRequired({
        imageUrl: "https://example.com/image.jpg",
      });

      expect(credits).toBe(1);
    });
  });
});

