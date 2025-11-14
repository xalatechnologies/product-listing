/**
 * Job Queue Processor Edge Function
 * 
 * Processes background jobs from the job_queue table
 * Replaces Inngest for background job processing
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers utility (inlined for Edge Function deployment)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function handleCors(req: Request): Response | null {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get next pending job
    const { data: jobs, error: fetchError } = await supabase
      .rpc("get_next_job");

    if (fetchError || !jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No jobs to process" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const job = jobs[0]!;

    // Mark job as processing
    await supabase.rpc("mark_job_processing", { job_id: job.id });

    try {
      // Process job based on type
      switch (job.job_type) {
        case "generate-image": {
          await processImageGeneration(supabase, job);
          break;
        }
        case "generate-complete-pack": {
          await processCompletePack(supabase, job);
          break;
        }
        case "generate-aplus": {
          await processAPlusGeneration(supabase, job);
          break;
        }
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      // Mark job as completed
      await supabase.rpc("mark_job_completed", { job_id: job.id });

      return new Response(
        JSON.stringify({ success: true, jobId: job.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (error) {
      // Mark job as failed (with retry logic)
      await supabase.rpc("mark_job_failed", {
        job_id: job.id,
        error_msg: error.message || "Unknown error",
      });

      return new Response(
        JSON.stringify({ error: error.message, jobId: job.id }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    console.error("Job processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/**
 * Process single image generation job
 */
async function processImageGeneration(supabase: any, job: any) {
  const { projectId, imageType, style } = job.payload;

  // Call your Next.js API endpoint to process the image
  // This keeps the generation logic in your main app
  const apiUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || Deno.env.get("APP_URL") || "http://localhost:3000";
  
  const response = await fetch(`${apiUrl}/api/process-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      projectId,
      imageType,
      style,
      userId: job.user_id,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Image generation failed" }));
    throw new Error(error.message || `HTTP ${response.status}: Image generation failed`);
  }

  const result = await response.json();
  return result;
}

/**
 * Process A+ content generation job
 */
async function processAPlusGeneration(supabase: any, job: any) {
  const { projectId } = job.payload;
  
  // Call Next.js API endpoint for A+ generation
  const apiUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || Deno.env.get("APP_URL") || "http://localhost:3000";
  
  const response = await fetch(`${apiUrl}/api/process-aplus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      projectId,
      userId: job.user_id,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "A+ generation failed" }));
    throw new Error(error.message || `HTTP ${response.status}: A+ generation failed`);
  }

  return await response.json();
}

/**
 * Process complete pack generation job
 * Queues individual image jobs to be processed one at a time
 */
async function processCompletePack(supabase: any, job: any) {
  const { projectId, includeAPlus } = job.payload;
  
  // Call Next.js API endpoint to queue individual jobs
  // This keeps the logic in the main app
  const apiUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || Deno.env.get("APP_URL") || "http://localhost:3000";
  
  const response = await fetch(`${apiUrl}/api/process-complete-pack`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      projectId,
      includeAPlus,
      userId: job.user_id,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Complete pack processing failed" }));
    throw new Error(error.message || `HTTP ${response.status}: Complete pack processing failed`);
  }

  const result = await response.json();
  return result;
}

