import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={`glass w-full ${maxWidth} rounded-2xl p-6 shadow-soft max-h-[85vh] overflow-y-auto`}
          >
            {title && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-white">{title}</h3>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">
                  &times;
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
