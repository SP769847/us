import { motion } from 'framer-motion';

export default function EmptyState({ icon = '💌', title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="text-4xl mb-4 opacity-80">{icon}</div>
      <h3 className="font-display text-lg text-white/80 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-white/40 max-w-sm">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
