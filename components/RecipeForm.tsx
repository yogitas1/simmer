"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserInput } from "@/types/recipe";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut-free",
  "Halal",
  "Kosher",
] as const;

export default function RecipeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dishName, setDishName] = useState("");
  const [skillLevel, setSkillLevel] =
    useState<UserInput["skill_level"]>("Beginner");
  const [ingredients, setIngredients] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [servingSize, setServingSize] = useState(2);
  const [timeAvailable, setTimeAvailable] = useState("");

  function toggleDietary(option: string) {
    setDietary((prev) =>
      prev.includes(option)
        ? prev.filter((d) => d !== option)
        : [...prev, option]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dishName.trim()) {
      setError("Please enter a dish name.");
      return;
    }
    setError(null);
    setLoading(true);

    const payload: UserInput = {
      dish_name: dishName.trim(),
      skill_level: skillLevel,
      available_ingredients: ingredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      dietary_restrictions: dietary,
      serving_size: servingSize,
      time_available_minutes: timeAvailable
        ? parseInt(timeAvailable, 10)
        : undefined,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start generation");
      }

      const { generation_id } = await res.json();
      router.push(`/loading/${generation_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Dish Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          What do you want to cook?{" "}
          <span className="text-orange-500">*</span>
        </label>
        <input
          type="text"
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
          placeholder="e.g. Chicken Tikka Masala, Banana Bread, Pad Thai..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-lg transition"
          required
        />
      </div>

      {/* Skill Level */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Your cooking skill level
        </label>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
          {SKILL_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSkillLevel(level)}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                skillLevel === level
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ingredients you already have
        </label>
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="chicken, garlic, olive oil, onion, tomatoes..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none transition"
        />
        <p className="mt-1 text-xs text-gray-400">
          Separate with commas. The AI will adapt the recipe to what you have.
        </p>
      </div>

      {/* Dietary Restrictions */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Dietary restrictions
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleDietary(option)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                dietary.includes(option)
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Serving size + Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Servings
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={servingSize}
            onChange={(e) => setServingSize(parseInt(e.target.value, 10) || 1)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Time available{" "}
            <span className="text-gray-400 font-normal">(minutes, optional)</span>
          </label>
          <input
            type="number"
            min={5}
            max={480}
            value={timeAvailable}
            onChange={(e) => setTimeAvailable(e.target.value)}
            placeholder="e.g. 30"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold text-lg transition-all shadow-lg shadow-orange-200 hover:shadow-orange-300 disabled:cursor-not-allowed"
      >
        {loading ? "Starting..." : "Generate Recipe Video ✨"}
      </button>
    </form>
  );
}
