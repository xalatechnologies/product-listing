# Agent System Overview

## Introduction

The Agent System is a modular, extensible architecture for processing AI-powered operations in the product listing application. It provides a standardized way to handle complex workflows like image generation, background removal, A+ content creation, and more.

## Architecture

### Core Components

```
src/lib/agents/
├── base/                    # Base infrastructure
│   ├── Agent.ts            # Agent interface and base class
│   ├── AgentContext.ts      # Shared context
│   ├── AgentResult.ts       # Standardized results
│   ├── AgentError.ts        # Error handling
│   └── ValidationResult.ts  # Input validation
├── image/                   # Image processing agents
│   ├── BackgroundRemovalAgent.ts
│   └── ImageProcessorAgent.ts
├── content/                 # Content generation agents
│   └── APlusContentAgent.ts
├── generation/              # Image generation agents
│   └── MainImageAgent.ts
├── orchestration/           # Agent orchestration
│   ├── AgentOrchestrator.ts
│   └── WorkflowEngine.ts
└── monitoring/              # Analytics and monitoring
    └── AgentMetrics.ts
```

## Agent Interface

All agents implement the `Agent` interface:

```typescript
interface Agent<TInput, TOutput> {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  
  process(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>>;
  validate?(input: TInput): Promise<ValidationResult>;
  shouldRetry?(input: TInput, error: Error, attempt: number): Promise<boolean>;
  getCreditsRequired?(input: TInput): Promise<number>;
}
```

## Available Agents

### 1. BackgroundRemovalAgent

**Purpose**: Removes background from images using Remove.bg or Replicate API.

**Input**:
```typescript
{
  imageUrl: string;
  provider?: "removebg" | "replicate" | "auto";
  maxRetries?: number;
}
```

**Output**:
```typescript
{
  imageBuffer: Buffer;
  width: number;
  height: number;
  provider: "removebg" | "replicate";
}
```

**Features**:
- Automatic fallback between providers
- Retry logic for network errors
- Credit tracking (1 credit per operation)

**Usage**:
```typescript
const agent = new BackgroundRemovalAgent();
const result = await agent.process(
  { imageUrl: "https://example.com/image.jpg", provider: "auto" },
  context
);
```

### 2. ImageProcessorAgent

**Purpose**: Processes and enhances images with lighting, sharpness, resize, and format conversion.

**Input**:
```typescript
{
  imageBuffer: Buffer;
  lighting?: LightingAdjustmentOptions;
  sharpness?: SharpnessOptions;
  replaceBackground?: Buffer;
  resize?: { width?: number; height?: number; fit?: "contain" | "cover" };
  format?: "jpeg" | "png" | "webp";
  quality?: number;
}
```

**Output**:
```typescript
{
  imageBuffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
  operations: string[];
}
```

**Features**:
- Multiple enhancement operations in one pass
- Format conversion
- Resize with different fit modes
- No credits required (local processing)

### 3. APlusContentAgent

**Purpose**: Generates complete Amazon A+ content modules with analysis, templates, and brand kit integration.

**Input**:
```typescript
{
  productName: string;
  description?: string;
  category?: string;
  productImages?: Array<{ url: string }>;
  isPremium?: boolean;
  brandKit?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
  generateImages?: boolean;
}
```

**Output**:
```typescript
{
  modules: APlusModule[];
  analysis: APLusContentAnalysis;
  isPremium: boolean;
  moduleCount: number;
}
```

**Features**:
- GPT-5 powered content analysis
- Template selection and brand kit integration
- Standard and premium module support
- Credit tracking (10-15 credits depending on premium)

### 4. MainImageAgent

**Purpose**: Generates Amazon-compliant main product images (1000x1000px, white background).

**Input**:
```typescript
{
  productImageUrl: string;
  projectId: string;
  userId: string;
  backgroundColor?: { r: number; g: number; b: number };
  padding?: number;
}
```

**Output**:
```typescript
{
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}
```

**Features**:
- Uses BackgroundRemovalAgent internally
- Automatic centering and scaling
- Amazon compliance (1000x1000px, white background)
- Credit tracking (5 credits per operation)

### 5. InfographicAgent

**Purpose**: Generates infographics for Amazon product listings with features and branding.

**Input**:
```typescript
{
  projectId: string;
  userId: string;
  templateId?: string;
  style?: string;
}
```

**Output**:
```typescript
{
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}
```

**Features**:
- GPT-5 powered feature extraction
- Template selection and brand kit integration
- Professional layout generation
- Credit tracking (8 credits per operation)

### 6. FeatureHighlightAgent

**Purpose**: Generates images that highlight a single product feature with visual emphasis.

**Input**:
```typescript
{
  projectId: string;
  userId: string;
  featureTitle?: string;
  style?: string;
}
```

**Output**:
```typescript
{
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}
```

**Features**:
- Automatic feature extraction if not provided
- Brand kit color integration
- Square format (1024x1024px)
- Credit tracking (6 credits per operation)

### 7. LifestyleAgent

**Purpose**: Generates realistic lifestyle scenes featuring the product in use.

**Input**:
```typescript
{
  projectId: string;
  userId: string;
  sceneDescription?: string;
  style?: string;
}
```

**Output**:
```typescript
{
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}
```

**Features**:
- Realistic scene generation
- Natural photography style
- Wide format (1792x1024px)
- Credit tracking (7 credits per operation)

### 8. ComparisonChartAgent

**Purpose**: Generates visual comparison charts showing product vs competitors or feature comparisons.

**Input**:
```typescript
{
  projectId: string;
  userId: string;
  comparisonType?: "features" | "competitors";
  style?: string;
}
```

**Output**:
```typescript
{
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}
```

**Features**:
- Feature-based or competitor comparisons
- Professional chart layout
- Brand kit integration
- Credit tracking (7 credits per operation)

### 9. DimensionDiagramAgent

**Purpose**: Generates technical dimension diagrams showing product measurements.

**Input**:
```typescript
{
  projectId: string;
  userId: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    unit?: string;
  };
  style?: string;
}
```

**Output**:
```typescript
{
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}
```

**Features**:
- Technical drawing style
- Custom dimension support
- Tall format (1024x1792px)
- Credit tracking (6 credits per operation)

## Orchestration

### AgentOrchestrator

Chain agents together, run in parallel, or use conditional execution:

```typescript
import { chainAgents, runAgentsInParallel } from "@/lib/agents/orchestration";

// Chain agents (output of one becomes input of next)
const result = await chainAgents(
  [backgroundAgent, processorAgent],
  initialInput,
  context
);

// Run agents in parallel
const results = await runAgentsInParallel(
  [agent1, agent2, agent3],
  input,
  context
);
```

### WorkflowEngine

Define and execute complex workflows:

```typescript
import { WorkflowEngine } from "@/lib/agents/orchestration";

const engine = new WorkflowEngine();

const workflow = {
  id: "main-image-workflow",
  name: "Main Image Generation",
  steps: [
    {
      id: "remove-bg",
      name: "Remove Background",
      agent: backgroundRemovalAgent,
    },
    {
      id: "process",
      name: "Process Image",
      agent: imageProcessorAgent,
      condition: (prevOutput) => prevOutput.success,
    },
  ],
};

const result = await engine.executeWorkflow(workflow, input, context);
```

## Monitoring & Analytics

### Execution Logging

All agent executions are automatically logged:

```typescript
import { logAgentExecution } from "@/lib/agents/monitoring";

await logAgentExecution(
  agent.name,
  agent.version,
  result,
  { userId, projectId, jobId },
  metadata
);
```

### Performance Tracking

Track agent performance in real-time:

```typescript
import { agentPerformanceTracker } from "@/lib/agents/monitoring";

// Metrics are automatically tracked
const metrics = agentPerformanceTracker.getMetrics("background-removal");
// Returns: { totalExecutions, successRate, averageProcessingTime, ... }
```

## Integration with Job Queue

Agents are integrated with the Supabase job queue system:

1. **Job Creation**: Jobs are created via tRPC routers
2. **Job Processing**: Supabase Edge Function calls Next.js API endpoints
3. **Agent Execution**: API endpoints use agents to process jobs
4. **Result Storage**: Results are saved to database and status updated

### Example Flow

```
User Request (tRPC)
  ↓
Job Queue (Supabase)
  ↓
Edge Function (process-jobs)
  ↓
Next.js API (/api/process-image)
  ↓
Agent (MainImageAgent)
  ↓
Result → Database
```

## Error Handling

All agents use standardized error handling:

```typescript
interface AgentError {
  code: string;
  message: string;
  details?: string;
  retryable?: boolean;
  statusCode?: number;
}
```

Common error codes:
- `VALIDATION_ERROR`: Input validation failed
- `PROCESSING_ERROR`: Processing failed
- `NETWORK_ERROR`: Network/API error
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `INSUFFICIENT_CREDITS`: Not enough credits

## Retry Logic

Agents implement retry logic for transient errors:

```typescript
async shouldRetry(input: TInput, error: Error, attempt: number): Promise<boolean> {
  // Default: retry up to 3 times for network errors
  if (attempt >= 3) return false;
  
  const retryableErrors = ["network", "timeout", "rate limit"];
  return retryableErrors.some(pattern => error.message.includes(pattern));
}
```

## Credit Management

Agents track credit usage:

```typescript
async getCreditsRequired(input: TInput): Promise<number> {
  // Return credits required for this operation
  return 5;
}
```

Credits are deducted before processing and logged in the execution metrics.

## Best Practices

### 1. Always Validate Input

```typescript
async validate(input: TInput): Promise<ValidationResult> {
  const errors = [];
  if (!input.requiredField) {
    errors.push(createValidationError("Field required", "requiredField"));
  }
  return errors.length > 0 ? createInvalidResult(errors) : createValidResult();
}
```

### 2. Use Agent Context

Always pass proper context with userId, projectId, and jobId:

```typescript
const context = createAgentContext({
  userId,
  projectId,
  jobId,
  metadata: { customData: "value" },
});
```

### 3. Log Executions

Always log agent executions for analytics:

```typescript
await logAgentExecution(agent.name, agent.version, result, context);
```

### 4. Handle Errors Gracefully

```typescript
if (!result.success) {
  // Log error, update status, but don't throw
  console.error("Agent failed:", result.error);
  return this.createErrorResult(new Error(result.error.message));
}
```

### 5. Use Orchestration for Complex Flows

Instead of calling agents directly, use orchestrators for complex workflows:

```typescript
// Bad: Manual chaining
const bgResult = await bgAgent.process(input, context);
const processResult = await processorAgent.process(bgResult.data, context);

// Good: Use orchestrator
const result = await chainAgents([bgAgent, processorAgent], input, context);
```

## Future Enhancements

1. **Database Logging**: Store agent executions in database for analytics

2. **Agent Versioning**: Support multiple versions of agents

3. **Agent Marketplace**: Allow plugins/extensions

4. **Distributed Execution**: Run agents in separate services

5. **Agent Dashboard**: Web UI for monitoring agent performance and metrics

## Summary

The Agent System provides:

✅ **Modularity**: Each agent handles one responsibility  
✅ **Testability**: Agents can be tested independently  
✅ **Reusability**: Agents can be composed for different workflows  
✅ **Scalability**: Agents can be moved to separate services  
✅ **Monitoring**: Built-in analytics and performance tracking  
✅ **Error Handling**: Standardized error handling and retry logic  
✅ **Credit Tracking**: Automatic credit usage tracking  

This architecture makes the codebase more maintainable, testable, and scalable for future growth.

