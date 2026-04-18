"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StepCard from "@/components/StepCard";
import MissingIngredients from "@/components/MissingIngredients";
import { GenerationJob } from "@/types/recipe";

export default function ResultPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/job/${params.id}`);
        if (!res.ok) {
          setError("Recipe not found. It may have expired.");
          return;
        }
        const data: GenerationJob = await res.json();
        if (data.status !== "complete") {
          // Not done yet — redirect to loading
          router.replace(`/loading/${params.id}`);
          return;
        }
        setJob(data);
      } catch {
        setError("Failed to load recipe data.");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !job || !job.recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-gray-600 mb-6">{error || "Something went wrong."}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
        >
          Start over
        </button>
      </div>
    );
  }

  const { recipe, video_urls } = job;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 transition"
          >
            ← Generate another
          </button>
          <button
            onClick={() => window.print()}
            className="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
          >
            Download recipe card
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Recipe header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            {recipe.dish_name}
          </h1>
          <p className="text-gray-500 text-sm">
            {recipe.servings} servings · {recipe.total_time_minutes} min total
          </p>
        </div>

        {/* Adapted for banner */}
        {recipe.adapted_for && (
          <div className="flex gap-3 p-4 rounded-2xl bg-green-50 border border-green-200">
            <span className="text-xl">🌿</span>
            <div>
              <p className="text-green-800 text-sm font-medium">
                Dietary adaptations made
              </p>
              <p className="text-green-700 text-sm mt-0.5">{recipe.adapted_for}</p>
            </div>
          </div>
        )}

        {/* Missing ingredients */}
        <MissingIngredients missing={recipe.missing_ingredients} />

        {/* Step timeline with per-step videos */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recipe Steps
          </h2>
          <div className="space-y-4">
            {recipe.steps.map((step, i) => (
              <StepCard
                key={step.step_number}
                step={step}
                videoUrl={video_urls?.[i]}
              />
            ))}
          </div>
        </div>

        {/* Prompt Inspector */}
        <details className="no-print group rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <summary className="cursor-pointer px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition select-none list-none">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span>🔍</span> Prompt Inspector
            </span>
            <span className="text-xs text-gray-400 group-open:hidden">Show prompts sent to OpenAI &amp; Seedance</span>
            <span className="text-xs text-gray-400 hidden group-open:inline">Hide</span>
          </summary>

          <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-4">
            {/* OpenAI — user message */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                OpenAI — User Message
              </p>
              <pre className="text-xs text-gray-700 font-mono bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(job.user_input, null, 2)}
              </pre>
            </div>

            {/* OpenAI — system prompt note */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                OpenAI — System Prompt
              </p>
              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
                Defined in <code className="font-mono text-orange-600">lib/openai.ts → SYSTEM_PROMPT</code>. Instructs GPT-4o to return structured JSON with granular one-action steps and cumulative &ldquo;Previously:&rdquo; context in each video_prompt.
              </p>
            </div>

            {/* Seedance prompts — all steps */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Seedance — Video Prompts ({recipe.steps.length} clips)
              </p>
              <div className="space-y-3">
                {recipe.steps.map((step) => (
                  <div key={step.step_number} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      Step {step.step_number}: {step.title}
                    </p>
                    <p className="text-xs text-gray-500 font-mono leading-relaxed whitespace-pre-wrap">
                      {step.video_prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>

        {/* Bottom CTA */}
        <div className="no-print text-center pt-4">
          <button
            onClick={() => router.push("/")}
            className="px-8 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg transition shadow-lg shadow-orange-200"
          >
            Generate another recipe ✨
          </button>
        </div>
      </main>
    </div>
  );
}
