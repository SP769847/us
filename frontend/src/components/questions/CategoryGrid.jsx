import { CATEGORY_ORDER, categoryMeta } from '../../utils/questionCategories.js';

export default function CategoryGrid({ onSelect, onSurpriseMe, compact = false }) {
  return (
    <div className="space-y-3">
      <button
        onClick={onSurpriseMe}
        className="w-full min-h-[52px] rounded-2xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 transition-all flex items-center justify-center gap-2"
      >
        ✨ Surprise Me
      </button>
      <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'} gap-2.5`}>
        {CATEGORY_ORDER.map((key) => {
          const meta = categoryMeta(key);
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="min-h-[68px] rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors flex flex-col items-center justify-center gap-1 px-2 py-3 text-center"
            >
              <span className="text-xl leading-none">{meta.emoji}</span>
              <span className="text-[11px] font-medium text-white/70 leading-tight">{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
