export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-white/8 rounded-lg ${className}`} />;
}

export function SkeletonList({ count = 4, className = 'h-16' }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`w-full ${className}`} />
      ))}
    </div>
  );
}
