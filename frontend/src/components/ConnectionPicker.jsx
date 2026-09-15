export default function ConnectionPicker({ connections, value, onChange, label = 'Send to' }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-white/50 mb-1.5">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
      >
        <option value="" disabled>
          Choose a connection…
        </option>
        {(connections || []).map((c) => (
          <option key={c.user.username} value={c.user.username} className="bg-ink-900">
            {c.user.fullName}
          </option>
        ))}
      </select>
    </label>
  );
}
