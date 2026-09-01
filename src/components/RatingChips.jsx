// Band semantics:
//  kind="skill"      1-4 = Weak (red), 5-6 = Average (amber), 7-10 = Strong (green)
//  kind="difficulty" 1-4 = Easy (green), 5-6 = Moderate (amber), 7-10 = Difficult (red)
function bandOf(n, kind) {
  const g = kind === 'difficulty' ? 11 - n : n;
  return g <= 4 ? 'weak' : g <= 6 ? 'avg' : 'strong';
}

const FILL = {
  weak:   'bg-red-600 border-red-600 text-white shadow-red-200',
  avg:    'bg-amber-500 border-amber-500 text-white shadow-amber-200',
  strong: 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200',
};
const TINT = {
  weak:   'bg-red-50 border-red-200 text-red-400 hover:border-red-400',
  avg:    'bg-amber-50 border-amber-200 text-amber-500 hover:border-amber-400',
  strong: 'bg-emerald-50 border-emerald-200 text-emerald-500 hover:border-emerald-400',
};
const TAG = {
  skill:      { weak: ['Weak', 'bg-red-100 text-red-700'], avg: ['Average', 'bg-amber-100 text-amber-700'], strong: ['Strong', 'bg-emerald-100 text-emerald-700'] },
  difficulty: { weak: ['Difficult', 'bg-red-100 text-red-700'], avg: ['Moderate', 'bg-amber-100 text-amber-700'], strong: ['Easy', 'bg-emerald-100 text-emerald-700'] },
};

export default function RatingChips({ label, value, onChange, required, invalid, kind = 'skill', highlight }) {
  const selBand = value ? bandOf(value, kind) : null;
  const tagKind = kind === 'difficulty' ? 'difficulty' : 'skill';
  // for difficulty, band key of tag = bandOf gives weak for high difficulty; map: use selBand directly
  const tag = selBand ? TAG[tagKind][kind === 'difficulty' ? (value <= 4 ? 'strong' : value <= 6 ? 'avg' : 'weak') : selBand] : null;

  return (
    <div className={`py-3 border-b border-dashed border-stone-200 last:border-b-0 ${highlight ? 'bg-red-50/60 rounded-xl p-3 border-b-0' : ''}`}>
      <div className={`text-[13.5px] font-semibold mb-2 flex items-center flex-wrap gap-2 ${invalid ? 'text-red-600' : 'text-neutral-800'}`}>
        <span>{label} {required && <em className="not-italic text-klred">*</em>}</span>
        {tag && (
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${tag[1]}`}>{tag[0]}</span>
        )}
        {invalid && <span className="text-[11px] font-bold text-red-500">— please select</span>}
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const filled = value && n <= value;
          const b = bandOf(n, kind);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`h-11 sm:h-10 w-full rounded-lg border-[1.5px] text-sm font-bold transition-all duration-150
                ${filled ? `${FILL[b]} shadow-md ${n === value ? 'scale-110 ring-2 ring-offset-1 ring-neutral-300' : ''}` : `${invalid ? 'border-red-300 ' : ''}${TINT[b]}`}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-neutral-400 mt-1 px-0.5 font-semibold uppercase tracking-wide">
        <span>{kind === 'difficulty' ? 'Easy' : 'Weak'}</span>
        <span>{kind === 'difficulty' ? 'Moderate' : 'Average'}</span>
        <span>{kind === 'difficulty' ? 'Very difficult' : 'Strong'}</span>
      </div>
    </div>
  );
}
