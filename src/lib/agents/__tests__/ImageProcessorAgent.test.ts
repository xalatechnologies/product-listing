/**
 * Tests for ImageProcessorAgent
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImageProcessorAgent } from "../image/ImageProcessorAgent";
import { createAgentContext } from "../base";
import sharp from "sharp";
import * as imageManipulation from "@/lib/ai/imageManipulation";

vi.mock("sharp");
vi.mock("@/lib/ai/imageManipulation");

describe("ImageProcessorAgent", () => {
  let agent: ImageProcessorAgent;
  let context: ReturnType<typeof createAgentContext>;
  let mockImageBuffer: Buffer;

  beforeEach(() => {
    agent = new ImageProcessorAgent();
    context = createAgentContext({
      userId: "user-123",
      projectId: "project-456",
    });
    mockImageBuffer = Buffer.from("fake-image-data");
    vi.clearAllMocks();

    // Mock image manipulation functions
    vi.spyOn(imageManipulation, "adjustLighting").mockResolvedValue(mockImageBuffer);
    vi.spyOn(imageManipulation, "enhanceSharpness").mockResolvedValue(mockImageBuffer);
    vi.spyOn(imageManipulation, "replaceBackground").mockResolvedValue(mockImageBuffer);

    // Mock sharp methods
    const mockSharp = {
      metadata: vi.fn().mockResolvedValue({ width: 1000, height: 1000, format: "jpeg" }),
      resize: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      png: vi.fn().mockReturnThis(),
      webp: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);
  });

  describe("Properties", () => {
    it("should have correct name and version", () => {
      expect(agent.name).toBe("image-processor");
      expect(agent.version).toBe("1.0.0");
    });
  });

  describe("Validation", () => {
    it("should validate correct input", async () => {
      const result = await agent.validate({
        imageBuffer: mockImageBuffer,
      });

      expect(result.valid).toBe(true);
    });

    it("should reject empty buffer", async () => {
      const result = await agent.validate({
        imageBuffer: Buffer.alloc(0),
      });

      expect(result.valid).toBe(false);
    });

    it("should reject invalid resize dimensions", async () => {
      const result = await agent.validate({
        imageBuffer: mockImageBuffer,
        resize: { width: -1, height: 100 },
      });

      expect(result.valid).toBe(false);
    });

    it("should reject invalid quality", async () => {
      const result = await agent.validate({
        imageBuffer: mockImageBuffer,
        quality: 150,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("Processing", () => {
    it("should process image without modifications", async () => {
      const result = await agent.process(
        {
          imageBuffer: mockImageBuffer,
        },
        context,
      );

      expect(result.success).toBe(true);
      expect(result.data?.imageBuffer).toBeDefined();
      expect(result.data?.operations).toHaveLength(0);
    });

    it("should apply lighting adjustments", async () => {
      const result = await agent.process(
        {
          imageBuffer: mockImageBuffer,
          lighting: { brightness: 10, contrast: 5 },
        },
        context,
      );

      expect(result.success).toBe(true);
      expect(result.data?.operations).toContain("lighting-adjustment");
    });

    it("should apply sharpness enhancement", async () => {
      const result = await agent.process(
        {
          imageBuffer: mockImageBuffer,
          sharpness: { amount: 50 },
        },
        context,
      );

      expect(result.success).toBe(true);
      expect(result.data?.operations).toContain("sharpness-enhancement");
    });

    it("should resize image", async () => {
      const result = await agent.process(
        {
          imageBuffer: mockImageBuffer,
          resize: { width: 500, height: 500 },
        },
        context,
      );

      expect(result.success).toBe(true);
      expect(result.data?.operations).toContain("resize");
    });

    it("should convert format", async () => {
      const result = await agent.process(
        {
          imageBuffer: mockImageBuffer,
          format: "webp",
          quality: 90,
        },
        context,
      );

      expect(result.success).toBe(true);
      expect(result.data?.operations).toContain("format-webp");
    });

    it("should apply multiple operations", async () => {
      const result = await agent.process(
        {
          imageBuffer: mockImageBuffer,
          lighting: { brightness: 10 },
          sharpness: { amount: 50 },
          resize: { width: 500, height: 500 },
          format: "png",
        },
        context,
      );

      expect(result.success).toBe(true);
      expect(result.data?.operations.length).toBeGreaterThan(1);
    });

    it("should handle processing errors", async () => {
      vi.mocked(sharp).mockImplementation(() => {
        throw new Error("Processing failed");
      });

      const result = await agent.process(
        {
          imageBuffer: mockImageBuffer,
        },
        context,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Credits", () => {
    it("should return zero credits (local processing)", async () => {
      const credits = await agent.getCreditsRequired({
        imageBuffer: mockImageBuffer,
      });

      expect(credits).toBe(0);
    });
  });
});

