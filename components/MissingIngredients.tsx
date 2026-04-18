interface Props {
  missing: string[];
}

export default function MissingIngredients({ missing }: Props) {
  if (!missing || missing.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
      <div className="flex gap-3">
        <span className="text-xl flex-shrink-0">🛒</span>
        <div>
          <h3 className="font-semibold text-amber-800 text-sm mb-1">
            You&apos;ll need to pick these up
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {missing.map((item) => (
              <span
                key={item}
                className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-sm font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
