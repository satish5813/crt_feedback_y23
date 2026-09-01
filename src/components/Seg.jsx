export default function Seg({ label, options, value, onChange, required }) {
  return (
    <div className="mb-3.5">
      <div className="text-[13.5px] font-semibold mb-1.5">
        {label} {required && <em className="not-italic text-klred">*</em>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`flex-1 min-w-20 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all
              ${value === o
                ? 'bg-kldark border-kldark text-white shadow-md shadow-klred/25'
                : 'bg-stone-50 border-stone-200 text-neutral-500 hover:border-klred/50'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
