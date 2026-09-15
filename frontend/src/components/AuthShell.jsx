import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-ink-950 bg-romantic-radial text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center font-display text-xl text-gradient font-semibold mb-8">
          Us
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass rounded-3xl p-7 sm:p-8 shadow-soft"
        >
          <h1 className="font-display text-2xl mb-1.5">{title}</h1>
          {subtitle && <p className="text-sm text-white/45 mb-6">{subtitle}</p>}
          {children}
        </motion.div>
        {footer && <div className="text-center mt-6 text-sm text-white/40">{footer}</div>}
      </div>
    </div>
  );
}
