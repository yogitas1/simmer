import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { generateRecipe } from "@/lib/openai";
import { generateAllVideos } from "@/lib/seedance";
import { createJob, updateJob } from "@/lib/jobStore";
import { UserInput } from "@/types/recipe";

export async function POST(request: NextRequest) {
  let body: UserInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.dish_name?.trim()) {
    return NextResponse.json(
      { error: "dish_name is required" },
      { status: 400 }
    );
  }

  const jobId = uuidv4();
  const now = Date.now();

  createJob({
    id: jobId,
    status: "generating_recipe",
    user_input: body,
    created_at: now,
    updated_at: now,
  });

  // Run the pipeline asynchronously so we can return the job ID immediately
  runPipeline(jobId, body).catch((err) => {
    console.error(`Pipeline failed for job ${jobId}:`, err);
    updateJob(jobId, {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return NextResponse.json({ generation_id: jobId }, { status: 202 });
}

async function runPipeline(jobId: string, input: UserInput): Promise<void> {
  // 1. Generate recipe
  updateJob(jobId, { status: "generating_recipe" });
  const recipe = await generateRecipe(input);
  updateJob(jobId, { recipe });

  // 2. Generate videos
  updateJob(jobId, { status: "generating_videos" });
  const videoUrls = await generateAllVideos(recipe.steps);

  updateJob(jobId, {
    video_urls: videoUrls,
    status: "complete",
  });
}
