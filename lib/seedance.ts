import { RecipeStep } from "@/types/recipe";

// BytePlus ModelArk Seedance endpoints
const BASE_URL = "https://ark.ap-southeast.bytepluses.com/api/v3";
const SUBMIT_URL = `${BASE_URL}/contents/generations/tasks`;

const POLL_INTERVAL_MS = 8_000;  // 8 seconds between polls
const MAX_POLLS = 45;             // up to ~6 minutes total

async function generateStepVideo(step: RecipeStep): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
    await new Promise((r) => setTimeout(r, 300));
    return "FALLBACK";
  }

  const apiKey = process.env.SEEDANCE_API_KEY;
  if (!apiKey) {
    console.error("SEEDANCE_API_KEY is not set");
    return "FALLBACK";
  }

  try {
    // 1. Submit the generation task
    const submitRes = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "seedance-1-5-pro-251215",
        content: [
          {
            type: "text",
            text: step.video_prompt,
          },
        ],
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error(
        `[Seedance] Submit failed for step ${step.step_number}: HTTP ${submitRes.status} — ${errText}`
      );
      return "FALLBACK";
    }

    const submitData = await submitRes.json();
    const taskId: string = submitData.id;

    if (!taskId) {
      console.error(
        `[Seedance] No task ID in response for step ${step.step_number}:`,
        submitData
      );
      return "FALLBACK";
    }

    console.log(`[Seedance] Step ${step.step_number} submitted, task ID: ${taskId}`);

    // 2. Poll until succeeded or failed
    const pollUrl = `${SUBMIT_URL}/${taskId}`;

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!pollRes.ok) {
        console.warn(`[Seedance] Poll ${i + 1} failed for step ${step.step_number}: HTTP ${pollRes.status}`);
        continue;
      }

      const data = await pollRes.json();
      console.log(`[Seedance] Step ${step.step_number} status: ${data.status} (poll ${i + 1})`);

      if (data.status === "succeeded") {
        const videoUrl = data.content?.video_url;
        if (videoUrl) {
          console.log(`[Seedance] Step ${step.step_number} done: ${videoUrl}`);
          return videoUrl;
        }
        console.error(`[Seedance] Succeeded but no video_url for step ${step.step_number}:`, data);
        return "FALLBACK";
      }

      if (data.status === "failed") {
        console.error(`[Seedance] Generation failed for step ${step.step_number}:`, data);
        return "FALLBACK";
      }
      // statuses: "submitted" | "running" — keep polling
    }

    console.error(`[Seedance] Timed out for step ${step.step_number} after ${MAX_POLLS} polls`);
    return "FALLBACK";
  } catch (err) {
    console.error(`[Seedance] Exception for step ${step.step_number}:`, err);
    return "FALLBACK";
  }
}

export async function generateAllVideos(
  steps: RecipeStep[]
): Promise<(string | null)[]> {
  return Promise.all(steps.map(generateStepVideo));
}
