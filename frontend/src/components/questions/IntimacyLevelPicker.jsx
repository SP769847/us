import { INTIMACY_LEVEL_ORDER, INTIMACY_LEVEL_META } from '../../utils/questionCategories.js';

export default function IntimacyLevelPicker({ onSelect, onBrowseByTheme, onBack }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs text-white/40 hover:text-white/70 transition-colors">
          ← Categories
        </button>
        <span className="text-[11px] uppercase tracking-wider text-white/40">🔥 Naughty 18+</span>
      </div>

      <div className="text-center">
        <p className="font-display text-lg text-white mb-1">How personal do you want to get?</p>
        <p className="text-xs text-white/40">Pick a depth — you can always go further (or back) later.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {INTIMACY_LEVEL_ORDER.map((key) => {
          const meta = INTIMACY_LEVEL_META[key];
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="min-h-[72px] rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors flex flex-col items-center justify-center gap-1.5 px-3 py-4 text-center"
            >
              <span className="text-2xl leading-none">{meta.emoji}</span>
              <span className="text-xs font-medium text-white/80">{meta.label}</span>
            </button>
          );
        })}
      </div>

      <button onClick={onBrowseByTheme} className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors pt-1">
        Or browse by theme instead →
      </button>
    </div>
  );
}
