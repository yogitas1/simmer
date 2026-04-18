import OpenAI from "openai";
import { GeneratedRecipe, UserInput } from "@/types/recipe";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a professional recipe developer and culinary expert. When given a dish and user context, you return a structured JSON recipe broken into many small, specific cooking steps — each covering exactly ONE action.

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:

{
  "dish_name": string,
  "adapted_for": string (brief description of adaptations made),
  "total_time_minutes": number,
  "servings": number,
  "missing_ingredients": string[] (critical ingredients the user doesn't have),
  "steps": [
    {
      "step_number": number,
      "title": string (short, action-verb title e.g. "Dice the onion", "Bloom the spices", "Deglaze the pan"),
      "duration_minutes": number,
      "instruction": string (clear, skill-appropriate instruction for this single action only),
      "ingredients_used": string[],
      "technique_note": string (tip appropriate for the skill level, empty string if none),
      "video_prompt": string
    }
  ]
}

STEP GRANULARITY RULES — CRITICAL:
- Each step must cover exactly ONE discrete cooking action. Never combine multiple actions in one step.
- Wrong: "Dice onion and garlic, then heat oil in a pan" — that is 3 steps.
- Right: Step 1 = "Dice the onion", Step 2 = "Mince the garlic", Step 3 = "Heat oil in the pan".
- Aim for 12–16 steps for Beginner, 18–25 steps for Intermediate/Advanced.
- Adapt language to skill_level: Beginner = plain language, forgiving timing. Advanced = precise temperatures, named techniques.
- Scale all quantities to serving_count exactly.
- Replace unavailable ingredients where possible. Flag truly essential missing ones.
- Treat dietary restrictions as HARD constraints — never include restricted ingredients even in trace amounts.

VIDEO PROMPT RULES — CRITICAL:
Each video_prompt must follow this exact 10-point structure in order. Minimum 80 words per prompt.

1. SHOT TYPE + ANGLE — e.g. "Extreme close-up, 45-degree angle at counter height" or "Overhead bird's-eye, straight down" or "Low side angle at cutting board level". Vary the shot type across steps.
2. HAND DESCRIPTION + EXACT PHYSICAL ACTION — describe the hand (e.g. "a woman's right hand with short unpainted nails"), the tool held, the direction and speed of movement (e.g. "slowly dragging a chef's knife through a yellow onion in firm downward strokes, left to right").
3. FOOD SUBJECT — describe its exact current color, texture, surface quality, and state (e.g. "translucent half-moon onion slices glistening with moisture, edges slightly frayed, stacked loosely on the board").
4. COOKWARE / TOOL — specify material, color, and condition (e.g. "a well-seasoned cast iron skillet with a matte black interior, slight oil sheen", or "a pale maple end-grain cutting board with visible knife grooves").
5. 2–3 SECONDARY ITEMS — visible but slightly out of focus in the background or edge of frame (e.g. "a small ceramic bowl of kosher salt, a bunch of fresh thyme, and a copper saucepan").
6. COUNTER SURFACE — material and color (e.g. "honed white Carrara marble counter", "warm butcher block", "dark slate surface").
7. LIGHTING — specify the source, direction, color temperature, and any atmospheric effects: (e.g. "single large north-facing window to the left casting soft cool daylight at 5500K, gentle shadows falling right, steam rising and catching the light"). Never write "cinematic kitchen lighting" alone.
8. CAMERA MOTION — one of: static locked-off, very slow push-in toward subject, slow pull back, or rack focus from background to subject.
9. DURATION — between 5 and 7 seconds.
10. END TAG — every prompt must end exactly with: "photorealistic, professional food cinematography, shallow depth of field, 4K"

STRICT RULES:
- Never use vague phrases like "cinematic kitchen lighting", "smooth motion", or "beautiful presentation" without specific detail.
- Never describe narrative context or what happened before ("after sautéing…", "previously…") — describe only what is VISUALLY happening right now in the frame.
- Every element (shot, hands, food, tool, surface, light, motion) must be present in every prompt.
- Prompts must be at least 80 words.`;

function buildUserMessage(input: UserInput): string {
  return JSON.stringify({
    dish: input.dish_name,
    skill_level: input.skill_level,
    available_ingredients: input.available_ingredients,
    dietary_restrictions: input.dietary_restrictions,
    serving_count: input.serving_size,
    time_available_minutes: input.time_available_minutes ?? null,
  });
}

export async function generateRecipe(
  input: UserInput
): Promise<GeneratedRecipe> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
    return getMockRecipe(input);
  }

  async function callOpenAI(extraInstruction = ""): Promise<GeneratedRecipe> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT + extraInstruction },
      { role: "user", content: buildUserMessage(input) },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content ?? "";
    try {
      return JSON.parse(content) as GeneratedRecipe;
    } catch {
      throw new Error("Invalid JSON from OpenAI: " + content.slice(0, 200));
    }
  }

  try {
    return await callOpenAI();
  } catch {
    // Retry once with explicit instruction
    return await callOpenAI(
      "\n\nReturn ONLY the JSON object, no other text."
    );
  }
}

function getMockRecipe(input: UserInput): GeneratedRecipe {
  return {
    dish_name: input.dish_name,
    adapted_for: `Adapted for ${input.skill_level} skill level with ${input.serving_size} servings.`,
    total_time_minutes: 30,
    servings: input.serving_size,
    missing_ingredients: ["fresh herbs"],
    steps: [
      {
        step_number: 1,
        title: "Prepare Ingredients",
        duration_minutes: 5,
        instruction:
          "Gather and measure all ingredients. Wash vegetables thoroughly and pat dry.",
        ingredients_used: ["vegetables", "water"],
        technique_note: "Having everything ready before cooking saves time.",
        video_prompt:
          "Close-up overhead shot of hands arranging fresh vegetables on a wooden cutting board, bright natural light, 5 seconds, smooth motion, cinematic kitchen lighting.",
      },
      {
        step_number: 2,
        title: "Heat the Pan",
        duration_minutes: 2,
        instruction:
          "Place a large pan over medium heat. Add oil and wait until it shimmers.",
        ingredients_used: ["oil"],
        technique_note: "A properly heated pan prevents sticking.",
        video_prompt:
          "Medium shot of oil being poured into a gleaming stainless steel pan on a gas stove, golden shimmer as it heats, 5 seconds, smooth motion, cinematic kitchen lighting.",
      },
      {
        step_number: 3,
        title: `Cook the ${input.dish_name}`,
        duration_minutes: 15,
        instruction:
          "Add main ingredients and cook, stirring occasionally, until done.",
        ingredients_used: ["main ingredient"],
        technique_note: "Don't overcrowd the pan for even cooking.",
        video_prompt:
          "Wide shot of colorful ingredients sizzling in a pan, steam rising, chef stirring gently with a wooden spoon, 5 seconds, smooth motion, cinematic kitchen lighting.",
      },
      {
        step_number: 4,
        title: "Season and Serve",
        duration_minutes: 3,
        instruction:
          "Taste and adjust seasoning. Plate beautifully and serve immediately.",
        ingredients_used: ["salt", "pepper"],
        technique_note: "Season at the end for best flavor control.",
        video_prompt:
          "Close-up shot of a beautifully plated dish being set on a white plate, garnish being added with tweezers, soft side lighting, 5 seconds, smooth motion, cinematic kitchen lighting.",
      },
    ],
  };
}
