function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-24 h-24 text-2xl',
};

export default function Avatar({ user, size = 'md', online, className = '' }) {
  const sizeClass = SIZES[size] || SIZES.md;
  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.fullName}
          className={`${sizeClass} rounded-full object-cover border border-white/10`}
        />
      ) : (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blush-400/70 to-plum-500/70 flex items-center justify-center font-semibold text-white border border-white/10`}>
          {initials(user?.fullName || '?')}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-ink-950 ${
            online ? 'bg-emerald-400' : 'bg-white/20'
          }`}
        />
      )}
    </div>
  );
}
