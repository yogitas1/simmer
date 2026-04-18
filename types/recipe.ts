export interface UserInput {
  dish_name: string;
  skill_level: "Beginner" | "Intermediate" | "Advanced";
  available_ingredients: string[];
  dietary_restrictions: string[];
  serving_size: number;
  time_available_minutes?: number;
}

export interface RecipeStep {
  step_number: number;
  title: string;
  duration_minutes: number;
  instruction: string;
  ingredients_used: string[];
  technique_note: string;
  video_prompt: string;
}

export interface GeneratedRecipe {
  dish_name: string;
  adapted_for: string;
  total_time_minutes: number;
  servings: number;
  missing_ingredients: string[];
  steps: RecipeStep[];
}

export type JobStatus =
  | "pending"
  | "generating_recipe"
  | "generating_videos"
  | "complete"
  | "error";

export interface GenerationJob {
  id: string;
  status: JobStatus;
  user_input: UserInput;
  recipe?: GeneratedRecipe;
  video_urls?: (string | null)[];
  assembled_video_url?: string; // kept for standalone /api/assemble route
  error?: string;
  created_at: number;
  updated_at: number;
}
