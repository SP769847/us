const SCALE = Array.from({ length: 10 }, (_, i) => i + 1);

export default function ScaleAnswerInput({ value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-white/35 mb-1.5 px-0.5">
        <span>1 · Very shy</span>
        <span>5 · Playful</span>
        <span>10 · Very adventurous</span>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {SCALE.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`min-h-[40px] rounded-xl text-sm font-medium transition-colors border ${
              value === n
                ? 'bg-gradient-to-br from-blush-500 to-plum-500 text-white border-transparent'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
