import { NAUGHTY_SUBCATEGORY_ORDER, subcategoryMeta } from '../../utils/questionCategories.js';

export default function NaughtySubcategoryPicker({ onSelect, onAny, onBack }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs text-white/40 hover:text-white/70 transition-colors">
          ← Categories
        </button>
        <span className="text-[11px] uppercase tracking-wider text-white/40">🔥 Naughty 18+</span>
      </div>

      <button
        onClick={onAny}
        className="w-full min-h-[46px] rounded-2xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 transition-all"
      >
        Any Naughty Question
      </button>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none sm:grid sm:grid-cols-4 sm:overflow-visible">
        {NAUGHTY_SUBCATEGORY_ORDER.map((key) => {
          const meta = subcategoryMeta(key);
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="shrink-0 sm:shrink w-[112px] sm:w-auto min-h-[68px] rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors flex flex-col items-center justify-center gap-1 px-2 py-3 text-center"
            >
              <span className="text-xl leading-none">{meta.emoji}</span>
              <span className="text-[10px] font-medium text-white/70 leading-tight">{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
