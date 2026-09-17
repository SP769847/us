// Handles both MULTIPLE_CHOICE (options come from the question) and YES_NO
// (fixed Yes/No options) — same interaction, just a different option list.
export default function ChoiceAnswerInput({ options, value, onChange }) {
  const opts = options && options.length ? options : ['Yes', 'No'];
  return (
    <div className="flex flex-col gap-2">
      {opts.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`min-h-[44px] rounded-xl text-sm font-medium text-left px-4 transition-colors border ${
            value === opt
              ? 'bg-gradient-to-r from-blush-500 to-plum-500 text-white border-transparent'
              : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
