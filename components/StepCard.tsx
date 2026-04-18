import { RecipeStep } from "@/types/recipe";

interface Props {
  step: RecipeStep;
  videoUrl?: string | null;
  isActive?: boolean;
}

export default function StepCard({ step, videoUrl, isActive = false }: Props) {
  return (
    <div
      className={`rounded-2xl border p-6 transition-all print:break-inside-avoid ${
        isActive
          ? "border-orange-300 bg-orange-50 shadow-md"
          : "border-gray-100 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
            isActive
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {step.step_number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base leading-snug">
            {step.title}
          </h3>
          <span className="text-xs text-gray-400 mt-0.5 block">
            {step.duration_minutes} min
          </span>
        </div>
      </div>

      {/* Step video clip */}
      {videoUrl && videoUrl !== "FALLBACK" && (
        <div className="mb-4 rounded-xl overflow-hidden bg-black">
          <video
            src={videoUrl}
            controls
            className="w-full aspect-video"
            style={{ display: "block" }}
          />
        </div>
      )}

      {/* Instruction */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {step.instruction}
      </p>

      {/* Ingredients used */}
      {step.ingredients_used.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {step.ingredients_used.map((ing) => (
            <span
              key={ing}
              className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium"
            >
              {ing}
            </span>
          ))}
        </div>
      )}

      {/* Technique note */}
      {step.technique_note && (
        <div className="flex gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <span className="text-base flex-shrink-0">💡</span>
          <p className="text-blue-700 text-xs leading-relaxed">
            {step.technique_note}
          </p>
        </div>
      )}

      {/* Seedance video prompt — collapsible */}
      {step.video_prompt && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 select-none list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Seedance prompt
          </summary>
          <p className="mt-2 text-xs text-gray-500 font-mono leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap">
            {step.video_prompt}
          </p>
        </details>
      )}
    </div>
  );
}
