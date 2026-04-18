import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobStore";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = getJob(params.id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Return safe subset — omit large recipe data unless complete
  const response = {
    id: job.id,
    status: job.status,
    error: job.error,
    assembled_video_url: job.assembled_video_url,
    recipe: job.status === "complete" ? job.recipe : undefined,
    has_recipe: !!job.recipe,
    video_count: job.video_urls?.length ?? 0,
    updated_at: job.updated_at,
  };

  return NextResponse.json(response);
}
