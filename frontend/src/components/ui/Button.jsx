import { motion } from 'framer-motion';

const VARIANTS = {
  primary: 'bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110',
  secondary: 'bg-white/8 text-white hover:bg-white/14 border border-white/10',
  ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/20',
};

const SIZES = {
  sm: 'text-xs px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 rounded-xl',
  lg: 'text-base px-6 py-3 rounded-2xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  as: Component = 'button',
  ...props
}) {
  return (
    <motion.div whileTap={{ scale: disabled || loading ? 1 : 0.97 }} className="inline-block">
      <Component
        disabled={disabled || loading}
        className={`font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      >
        {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
        {children}
      </Component>
    </motion.div>
  );
}
