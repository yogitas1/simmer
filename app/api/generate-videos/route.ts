import { NextRequest, NextResponse } from "next/server";
import { generateAllVideos } from "@/lib/seedance";
import { RecipeStep } from "@/types/recipe";

export async function POST(request: NextRequest) {
  let steps: RecipeStep[];
  try {
    const body = await request.json();
    steps = body.steps;
    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: "steps array is required" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const videoUrls = await generateAllVideos(steps);
    const allFallback = videoUrls.every((u) => u === "FALLBACK" || u === null);

    if (allFallback) {
      return NextResponse.json(
        {
          error: "All video generation attempts failed",
          video_urls: videoUrls,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ video_urls: videoUrls });
  } catch (err) {
    console.error("Video generation error:", err);
    return NextResponse.json(
      { error: "Video generation failed" },
      { status: 500 }
    );
  }
}
