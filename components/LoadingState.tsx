"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JobStatus } from "@/types/recipe";

interface Props {
  jobId: string;
}

const STEPS: { status: JobStatus; label: string }[] = [
  { status: "generating_recipe", label: "Crafting your recipe..." },
  { status: "generating_videos", label: "Generating step videos..." },
];

function getStepIndex(status: JobStatus): number {
  if (status === "generating_recipe") return 0;
  if (status === "generating_videos") return 1;
  if (status === "complete") return 2;
  return 0;
}

export default function LoadingState({ jobId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>("generating_recipe");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      while (!stopped) {
        try {
          const res = await fetch(`/api/status/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            setStatus(data.status);

            if (data.status === "complete") {
              router.push(`/result/${jobId}`);
              return;
            }

            if (data.status === "error") {
              setError(data.error || "An error occurred during generation.");
              return;
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }

        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    poll();
    return () => {
      stopped = true;
    };
  }, [jobId, router]);

  const stepIndex = getStepIndex(status);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-orange-50 to-white px-4">
      {/* Animated simmering pot */}
      <div className="relative mb-12">
        <div className="text-8xl select-none">🍲</div>
        {/* Steam bubbles */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-orange-300 opacity-0"
              style={{
                animation: `steam 2s ease-in-out ${i * 0.4}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Simmering your recipe...
      </h1>
      <p className="text-gray-500 mb-10 text-center max-w-xs">
        This takes a minute. We&apos;re crafting a custom recipe and generating
        real cooking videos for each step.
      </p>

      {/* Progress steps */}
      <div className="w-full max-w-sm space-y-4">
        {STEPS.map((step, i) => {
          const isDone = stepIndex > i;
          const isActive = stepIndex === i;
          return (
            <div
              key={step.status}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                isDone
                  ? "bg-green-50 border-green-200"
                  : isActive
                  ? "bg-orange-50 border-orange-300 shadow-sm"
                  : "bg-white border-gray-100 opacity-40"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  isDone
                    ? "text-green-700"
                    : isActive
                    ? "text-orange-700"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
              {isActive && (
                <div className="ml-auto">
                  <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-8 w-full max-w-sm">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-red-700 text-sm font-medium mb-3">
              Something went wrong: {error}
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium transition"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes steam {
          0% { opacity: 0; transform: translateY(0) scale(1); }
          30% { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-20px) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
