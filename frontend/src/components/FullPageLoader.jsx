export default function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-blush-300/30 border-t-blush-400 animate-spin" />
        <p className="text-sm text-white/40">Loading your world…</p>
      </div>
    </div>
  );
}
