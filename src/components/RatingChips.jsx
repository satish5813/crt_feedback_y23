export function strengthOf(v) {
  if (!v) return null;
  return v <= 4 ? 'Weak' : v <= 6 ? 'Average' : 'Strong';
}

export default function RatingChips({ label, value, onChange, required, invalid, showTag, highlight }) {
  const tag = showTag ? strengthOf(value) : null;
  return (
    <div className={`py-2.5 border-b border-dashed border-stone-200 last:border-b-0 ${highlight ? 'bg-red-50 rounded-xl p-3 border-b-0' : ''}`}>
      <div className={`text-[13.5px] font-semibold mb-2 ${invalid ? 'text-klred' : ''}`}>
        {label} {required && <em className="not-italic text-klred">*</em>}
        {tag && (
          <span
            className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold align-middle ${
              tag === 'Weak' ? 'bg-red-100 text-red-700'
              : tag === 'Average' ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {tag}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 min-w-9 flex-1 basis-[8%] rounded-lg border text-sm font-semibold transition-all
              ${value && n <= value
                ? 'bg-klred border-klred text-white shadow-md shadow-red-200 scale-[1.04]'
                : invalid
                  ? 'bg-white border-red-200 text-neutral-400'
                  : 'bg-stone-50 border-stone-200 text-neutral-500 hover:border-klred/50'}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
