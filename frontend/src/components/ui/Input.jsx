export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-white/50 mb-1.5">{label}</span>}
      <input
        className={`w-full bg-white/5 border ${
          error ? 'border-red-500/50' : 'border-white/10'
        } rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-blush-400/60 focus:bg-white/[0.07] transition-colors ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-red-400 mt-1">{error}</span>}
    </label>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-white/50 mb-1.5">{label}</span>}
      <textarea
        className={`w-full bg-white/5 border ${
          error ? 'border-red-500/50' : 'border-white/10'
        } rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-blush-400/60 focus:bg-white/[0.07] transition-colors resize-none ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-red-400 mt-1">{error}</span>}
    </label>
  );
}
