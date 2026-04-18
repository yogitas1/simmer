export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { assembleVideo } from "@/lib/ffmpeg";
import { uploadVideoToBlob, cleanupFile } from "@/lib/storage";
import { RecipeStep } from "@/types/recipe";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let videoUrls: (string | null)[];
  let steps: RecipeStep[];

  try {
    const body = await request.json();
    videoUrls = body.video_urls;
    steps = body.steps;

    if (!Array.isArray(videoUrls) || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: "video_urls and steps arrays are required" },
        { status: 400 }
      );
    }

    if (videoUrls.length !== steps.length) {
      return NextResponse.json(
        { error: "video_urls and steps must have the same length" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const outputPath = await assembleVideo(videoUrls, steps);
    const filename = `simmer-assembly-${Date.now()}.mp4`;
    const publicUrl = await uploadVideoToBlob(outputPath, filename);
    cleanupFile(outputPath);

    return NextResponse.json({ video_url: publicUrl });
  } catch (err) {
    console.error("Assembly error:", err);
    return NextResponse.json(
      { error: "Video assembly failed" },
      { status: 500 }
    );
  }
}
