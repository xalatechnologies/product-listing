/**
 * A+ Content Analysis Service
 * 
 * Analyzes product data using GPT-5 to generate structured content for A+ modules
 */

import { generateChatCompletion } from "@/lib/aiClient";
import { extractFeaturesFromProduct } from "../ai/featureExtraction";

export interface APLusModuleContent {
  moduleType: string;
  headline: string;
  bodyText: string;
  imageDescriptions: string[];
  additionalContent?: {
    bullets?: string[];
    sidebar?: string[];
    specifications?: Record<string, string>;
    comparisonData?: Array<{
      feature: string;
      value: string;
    }>;
  };
}

export interface APLusContentAnalysis {
  modules: APLusModuleContent[];
  summary: string;
  keyFeatures: string[];
  benefits: string[];
  useCases: string[];
  specifications: Record<string, string>;
}

/**
 * Analyze project data and generate structured A+ content
 */
export async function analyzeProductForAPlus(data: {
  productName: string;
  description?: string;
  category?: string;
  productImages?: Array<{ url: string }>;
}): Promise<APLusContentAnalysis> {
  // Step 1: Extract features using existing feature extraction
  const featureResult = await extractFeaturesFromProduct({
    productName: data.productName,
    description: data.description,
    category: data.category,
  });

  // Step 2: Generate A+ content structure using GPT-5
  const prompt = createAPlusAnalysisPrompt(data, featureResult);

  try {
    const response = await generateChatCompletion(
      [
        {
          role: "system",
          content:
            "You are an expert Amazon A+ content creator. Always respond with valid JSON only. Create compelling, conversion-focused A+ content that highlights product benefits and features.",
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
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;

    const analysis = JSON.parse(jsonString) as APLusContentAnalysis;

    // Merge with extracted features
    analysis.keyFeatures = featureResult.features.map((f) => f.title);
    analysis.modules = analysis.modules || [];

    return analysis;
  } catch (error) {
    console.error("A+ content analysis error:", error);
    // Fallback to basic structure
    return createFallbackAPlusContent(data, featureResult);
  }
}

/**
 * Create prompt for A+ content analysis
 */
function createAPlusAnalysisPrompt(
  data: {
    productName: string;
    description?: string;
    category?: string;
  },
  featureResult: {
    features: Array<{ title: string; description: string }>;
    summary: string;
  },
): string {
  const featureList = featureResult.features.map((f) => `- ${f.title}: ${f.description}`).join("\n");

  return `Analyze the following product and create structured Amazon A+ content.

Product Name: ${data.productName}
${data.description ? `Description: ${data.description}` : ""}
${data.category ? `Category: ${data.category}` : ""}

Key Features:
${featureList}

Create a comprehensive A+ content structure with 4-6 modules. For each module, provide:

1. Module Type (choose from: standard-single-image-sidebar, standard-single-image-highlights, standard-four-images-text, standard-single-image-specs, standard-comparison-table, standard-single-image-bullets)
2. Headline (10-50 characters, compelling and benefit-focused)
3. Body Text (50-2000 characters, detailed and persuasive)
4. Image Descriptions (what images should show for this module)
5. Additional Content (bullets, sidebar items, specifications, or comparison data as appropriate)

Also provide:
- Summary: Brief 1-2 sentence product summary
- Key Features: Top 5-7 feature titles
- Benefits: Top 5-7 customer benefits
- Use Cases: Top 3-5 use cases
- Specifications: Key technical specifications (if applicable)

Return the response as a JSON object with this structure:
{
  "modules": [
    {
      "moduleType": "standard-single-image-sidebar",
      "headline": "Compelling headline",
      "bodyText": "Detailed body text...",
      "imageDescriptions": ["Description of image 1", "Description of image 2"],
      "additionalContent": {
        "bullets": ["Bullet 1", "Bullet 2"],
        "sidebar": ["Sidebar item 1", "Sidebar item 2"],
        "specifications": {"Spec 1": "Value 1"},
        "comparisonData": [{"feature": "Feature", "value": "Value"}]
      }
    }
  ],
  "summary": "Product summary",
  "keyFeatures": ["Feature 1", "Feature 2"],
  "benefits": ["Benefit 1", "Benefit 2"],
  "useCases": ["Use case 1", "Use case 2"],
  "specifications": {"Spec": "Value"}
}

Focus on:
- Highlighting unique selling points
- Addressing customer pain points
- Creating emotional connection
- Providing clear value proposition
- Making content scannable and easy to understand`;
}

/**
 * Create fallback A+ content structure
 */
function createFallbackAPlusContent(
  data: {
    productName: string;
    description?: string;
  },
  featureResult: {
    features: Array<{ title: string; description: string }>;
    summary: string;
  },
): APLusContentAnalysis {
  const topFeatures = featureResult.features.slice(0, 5);

  return {
    modules: [
      {
        moduleType: "standard-single-image-sidebar",
        headline: `Why Choose ${data.productName}?`,
        bodyText:
          data.description ||
          `${data.productName} delivers exceptional quality and performance. Designed with attention to detail, this product offers outstanding value and reliability.`,
        imageDescriptions: ["Main product image showcasing key features"],
        additionalContent: {
          sidebar: topFeatures.slice(0, 4).map((f) => `${f.title}: ${f.description}`),
        },
      },
      {
        moduleType: "standard-single-image-highlights",
        headline: "Key Features",
        bodyText: `Discover what makes ${data.productName} stand out from the competition.`,
        imageDescriptions: ["Product image highlighting features"],
        additionalContent: {
          bullets: topFeatures.map((f) => `${f.title}: ${f.description}`),
        },
      },
      {
        moduleType: "standard-four-images-text",
        headline: "See It In Action",
        bodyText: `Explore ${data.productName} from every angle and see how it can enhance your experience.`,
        imageDescriptions: [
          "Product front view",
          "Product side view",
          "Product detail view",
          "Product in use",
        ],
      },
    ],
    summary: featureResult.summary || `${data.productName} - Quality product for your needs`,
    keyFeatures: topFeatures.map((f) => f.title),
    benefits: topFeatures.map((f) => f.description),
    useCases: [
      "Everyday use",
      "Professional applications",
      "Special occasions",
    ],
    specifications: {},
  };
}

/**
 * Generate module content suggestions based on analysis
 */
export function generateModuleContentSuggestions(
  analysis: APLusContentAnalysis,
  moduleType: string,
): APLusModuleContent | undefined {
  // Find existing module or create new one
  let module = analysis.modules.find((m) => m.moduleType === moduleType);

  if (!module) {
    // Create default module based on type
    module = {
      moduleType,
      headline: `Discover ${analysis.keyFeatures[0] || "Features"}`,
      bodyText: analysis.summary,
      imageDescriptions: ["Product image"],
      additionalContent: {},
    };
  }

  return module;
}

