import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { setAgeConfirmed } from '../../utils/questionCategories.js';

export default function AgeGateModal({ open, onConfirm, onCancel }) {
  if (typeof document === 'undefined') return null;

  const confirm = () => {
    setAgeConfirmed();
    onConfirm();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl p-7 text-center bg-gradient-to-b from-ink-900 to-ink-950 border border-white/10 shadow-soft"
          >
            <div className="text-4xl mb-3">🔥</div>
            <h3 className="font-display text-xl text-white mb-2">18+ Adults Only</h3>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              These questions are intended for adults and may contain intimate or suggestive topics. They stay private between you and your partner.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={confirm}
                className="w-full py-3 rounded-2xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 transition-all min-h-[44px]"
              >
                I'm 18+ — Continue
              </button>
              <button
                onClick={onCancel}
                className="w-full py-3 rounded-2xl text-sm font-medium bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors min-h-[44px]"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
