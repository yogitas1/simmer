import RecipeForm from "@/components/RecipeForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      {/* Header */}
      <div className="pt-16 pb-10 text-center px-4">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-medium">
          <span>✨</span> AI-Powered Recipe Videos
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Simmer
        </h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
          Turn any dish into a step-by-step cooking video, tailored to your
          skill level and what&apos;s in your kitchen.
        </p>
      </div>

      {/* Form card */}
      <div className="max-w-xl mx-auto px-4 pb-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <RecipeForm />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by OpenAI · Seedance · ffmpeg
        </p>
      </div>
    </main>
  );
}
