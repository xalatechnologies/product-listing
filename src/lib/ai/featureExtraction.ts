/**
 * Feature extraction from product data using GPT-5
 */

import { generateChatCompletion } from "@/lib/aiClient";

export interface ProductFeature {
  title: string;
  description: string;
  priority: number; // 1-10, higher is more important
  icon?: string; // Suggested icon name
}

export interface FeatureExtractionResult {
  features: ProductFeature[];
  summary: string;
}

/**
 * Extract features from product data using GPT-5
 */
export async function extractFeaturesFromProduct(data: {
  productName: string;
  description?: string;
  category?: string;
}): Promise<FeatureExtractionResult> {
  const prompt = `You are a product marketing expert. Analyze the following product information and extract the most important features for an Amazon product listing infographic.

Product Name: ${data.productName}
${data.description ? `Description: ${data.description}` : ""}
${data.category ? `Category: ${data.category}` : ""}

Please extract 5-8 key features that would be most compelling for potential customers. For each feature, provide:
1. A short, punchy title (3-5 words)
2. A brief description (10-15 words)
3. A priority score from 1-10 (10 being most important)
4. A suggested icon name (e.g., "shield", "battery", "wifi", "water-drop")

Return the response as a JSON object with this structure:
{
  "features": [
    {
      "title": "Feature title",
      "description": "Feature description",
      "priority": 8,
      "icon": "icon-name"
    }
  ],
  "summary": "Brief 1-2 sentence product summary"
}

Focus on features that:
- Highlight unique selling points
- Address customer pain points
- Are easily visualized
- Differentiate from competitors
- Are relevant to the product category`;

  try {
    const response = await generateChatCompletion(
      [
        {
          role: "system",
          content:
            "You are a product marketing expert specializing in Amazon product listings. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      "GPT_5",
      { temperature: 0.7 },
    );

    // Parse JSON response
    const content = response.trim();
    // Remove markdown code blocks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    
    const result = JSON.parse(jsonString) as FeatureExtractionResult;

    // Sort features by priority (highest first)
    result.features.sort((a, b) => b.priority - a.priority);

    return result;
  } catch (error) {
    console.error("Feature extraction error:", error);
    // Fallback to basic features if AI fails
    return {
      features: [
        {
          title: "High Quality",
          description: "Premium materials and construction",
          priority: 7,
          icon: "star",
        },
        {
          title: "Easy to Use",
          description: "Simple setup and operation",
          priority: 6,
          icon: "check-circle",
        },
      ],
      summary: data.description || `${data.productName} - Quality product for your needs`,
    };
  }
}

/**
 * Format features for infographic display
 */
export function formatFeaturesForInfographic(
  features: ProductFeature[],
  maxFeatures: number = 6,
): Array<{ title: string; description: string; icon?: string }> {
  return features
    .slice(0, maxFeatures)
    .map((feature) => ({
      title: feature.title,
      description: feature.description,
      icon: feature.icon,
    }));
}

/**
 * Prioritize features (most important first)
 */
export function prioritizeFeatures(features: ProductFeature[]): ProductFeature[] {
  return [...features].sort((a, b) => b.priority - a.priority);
}

