import OpenAI from "openai";
import { GeneratedRecipe, UserInput } from "@/types/recipe";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

const SYSTEM_PROMPT = `You are a professional culinary instructor and video director for a cooking app called Simmer.
Your job is to take a dish request and user context and return a detailed, teachable recipe
broken into the smallest possible instructional steps, each paired with a Seedance video prompt.

You will be given:
- dish_name
- skill_level (Beginner / Intermediate / Advanced)
- ingredients_available (what the user already has)
- dietary_restrictions (hard constraints, never violate)
- servings (scale all quantities to this number)
- time_available (optional, adjust recipe complexity if provided)

Return ONLY valid JSON, no markdown, no explanation. Match this exact schema:

{
  "dish_name": string,
  "servings": number,
  "total_time_minutes": number,
  "adapted_for": string,
  "missing_ingredients": string[],
  "steps": [
    {
      "step_number": number,
      "title": string,
      "duration_minutes": number,
      "instruction": string,
      "doneness_cue": string,
      "ingredients_used": string[],
      "technique_note": string,
      "video_prompt": string
    }
  ]
}

STEP GRANULARITY RULES:
- Break every action into the smallest single teachable unit
- Never combine two physical actions into one step
- "Whisk yolks, fold in mascarpone, whip cream" = 3 steps, not one
- Target 8–10 steps for Beginner, 10–15 for Intermediate, up to 20 for Advanced
- Each step should cover no more than one 3–4 minute action

INSTRUCTION RULES:
- Write in second person present tense: "Crack the eggs...", "Fold the mixture..."
- Include exact quantities: "3 tablespoons", "until doubled in volume"
- Include timing: "for 30 seconds", "until edges turn golden"
- Include the physical motion: direction, speed, tool, technique
- Skill adaptation:
    Beginner = plain language, forgiving timing, reassurance cues
    Intermediate = proper technique names, temperature precision
    Advanced = French terms, exact temperatures, professional methods

DONENESS CUE RULES:
- Every step must have a doneness_cue — a visual, tactile, or auditory signal for when it is done correctly
- Examples: "falls in thick ribbons from the whisk", "edges pull away from the pan", "sounds hollow when tapped"
- Never write "cook until done" or "mix well"

VIDEO PROMPT RULES:
- The video_prompt is sent directly to the Seedance video generation API
- Every prompt must be fully self-contained — Seedance has no memory between clips,
  so each prompt must describe the complete visual state of the scene from scratch
- Consistency is critical: the kitchen, cookware, surfaces, and hands must be
  described identically in every single step's video_prompt

CONSISTENCY ANCHORS (include these exact descriptions in every single video_prompt):
- Kitchen: "modern home kitchen, white subway tile backsplash, dark granite countertop"
- Hands: "pair of bare hands with natural skin tone, no rings or nail polish"
- Lighting: "warm overhead kitchen light, soft and even, no harsh shadows"
- These three anchors must appear word-for-word in every video_prompt, no exceptions

PREVIOUS CONTEXT RULE:
- Every video_prompt after step 1 must open with one sentence describing the current
  visual state of the dish — what has already been done, what it looks like RIGHT NOW
  before this step begins
- Format: "At this point, [describe exact visual state of food/bowl/pan as it currently looks]."
- Example: "At this point, the egg yolks and sugar have been whisked into a thick pale
  ivory cream sitting in a glass bowl on the counter."
- This grounds Seedance in the correct visual continuity before showing the new action

INGREDIENT SPECIFICITY RULES:
- Name every ingredient exactly as it appears in the ingredients_used array for that step
- Describe the ingredient's current physical state: color, texture, temperature, quantity
- Never say "the mixture" or "the ingredients" — always say what it specifically is
  Example: "the pale ivory mascarpone cream" not "the mixture"
  Example: "the dark espresso-soaked Savoiardo ladyfingers" not "the soaked biscuits"
- Include the exact quantity visible in frame: "approximately 250g", "3 tablespoons"
- Describe what the ingredient looks like at THIS moment in the recipe, not generically

ACTION SPECIFICITY RULES:
- Describe the exact physical motion: tool used, direction, speed, number of strokes
- Include what changes during the action: color shift, texture change, volume change
- Include the doneness_cue visually: describe exactly what the food looks like
  when the step is complete, so Seedance can show the end state
- One action per prompt only — never show two things happening

STRUCTURE (follow this exact order in every video_prompt):

1. PREVIOUS STATE (step 2 onward): "At this point, [exact visual state of dish so far]."
2. CONSISTENCY ANCHORS: "Modern home kitchen, white subway tile backsplash, dark granite
   countertop. Pair of bare hands with natural skin tone, no rings or nail polish.
   Warm overhead kitchen light, soft and even, no harsh shadows."
3. SPECIFIC INGREDIENTS IN FRAME: Name and describe every ingredient visible,
   with quantity and current physical state
4. EXACT ACTION: What the hands are doing, with tool, direction, speed, duration
5. END STATE: What the food looks like when the action is complete
6. CAMERA: One sentence only — angle that best shows the action
7. QUALITY TAG: "Photorealistic, professional food video, 4K."

Minimum 80 words per prompt.

DIETARY RESTRICTION RULES:
- Treat all restrictions as hard constraints, never suggestions
- Substitute proactively using ingredients_available before flagging missing_ingredients
- If a core ingredient cannot be substituted, add it to missing_ingredients

SCALING RULES:
- Scale every quantity precisely to the servings number
- Adjust cook times if scaling significantly changes batch size`;

function buildUserMessage(input: UserInput): string {
  return JSON.stringify({
    dish_name: input.dish_name,
    skill_level: input.skill_level,
    ingredients_available: input.available_ingredients,
    dietary_restrictions: input.dietary_restrictions,
    servings: input.serving_size,
    time_available: input.time_available_minutes ?? null,
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

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.3,
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
