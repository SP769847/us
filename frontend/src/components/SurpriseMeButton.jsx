import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api.js';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';

const TYPE_META = {
  QUESTION: { icon: '🥰', label: 'A little question' },
  CHALLENGE: { icon: '🔥', label: 'A little challenge' },
  COMPLIMENT: { icon: '💕', label: 'Just because' },
  GAME_SUGGESTION: { icon: '🎲', label: 'Play something' },
  MEMORY: { icon: '📸', label: 'A memory' },
  LOVE_NOTE: { icon: '💌', label: 'A love note' },
};

export default function SurpriseMeButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [surprise, setSurprise] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const trigger = async () => {
    setOpen(true);
    setRevealed(false);
    setLoading(true);
    try {
      const { data } = await api.get('/surprise-me');
      setSurprise(data.surprise);
    } finally {
      setLoading(false);
    }
  };

  const meta = surprise ? TYPE_META[surprise.type] || { icon: '✨', label: 'Surprise' } : null;

  return (
    <>
      <button
        onClick={trigger}
        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-white/6 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      >
        ✨ Surprise Me
      </button>
      <button
        onClick={trigger}
        className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5"
        aria-label="Surprise Me"
      >
        ✨
      </button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col items-center text-center py-4 min-h-[200px] justify-center">
          {loading ? (
            <div className="w-8 h-8 rounded-full border-2 border-blush-300/30 border-t-blush-400 animate-spin" />
          ) : (
            <AnimatePresence mode="wait">
              {!revealed ? (
                <motion.button
                  key="closed"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setRevealed(true)}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blush-500/30 to-plum-500/30 border border-white/10 flex items-center justify-center text-4xl"
                >
                  🎁
                </motion.button>
              ) : (
                <motion.div
                  key="open"
                  initial={{ scale: 0.7, opacity: 0, rotate: -4 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                  className="space-y-3"
                >
                  <div className="text-4xl">{meta.icon}</div>
                  <p className="text-xs uppercase tracking-wider text-white/40">{meta.label}</p>
                  <p className="font-display text-lg text-white max-w-xs">{surprise.text}</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          {!loading && (
            <div className="mt-6">
              <Button variant="ghost" size="sm" onClick={trigger}>
                {revealed ? 'Surprise me again' : 'Cancel'}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
