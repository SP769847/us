import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import api, { extractErrorMessage } from '../../services/api.js';

const DEFAULT_TEXT = 'Missing you ❤️';

export default function MissYouModal({ open, onClose, conversationId, peerName }) {
  const [alsoSendMessage, setAlsoSendMessage] = useState(false);
  const [messageText, setMessageText] = useState(DEFAULT_TEXT);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (typeof document === 'undefined') return null;

  const reset = () => {
    setAlsoSendMessage(false);
    setMessageText(DEFAULT_TEXT);
    setSending(false);
    setSent(false);
    setError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const send = async () => {
    setSending(true);
    setError('');
    try {
      await api.post('/miss-you', {
        conversationId,
        sendChatMessage: alsoSendMessage,
        chatMessageText: alsoSendMessage ? messageText.trim() : undefined,
      });
      setSent(true);
      setTimeout(close, 2200);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not send this right now'));
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl p-7 text-center bg-gradient-to-b from-ink-900 to-ink-950 border border-white/10 shadow-soft"
          >
            {sent ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2">
                <motion.div
                  className="flex items-center justify-center gap-2 text-3xl mb-4"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  <span>❤️</span>
                  <span>🥺</span>
                  <span>✨</span>
                </motion.div>
                <p className="font-display text-lg text-white mb-1">Sent!</p>
                <p className="text-sm text-white/50">They'll know you're thinking about them.</p>
              </motion.div>
            ) : (
              <>
                <div className="text-4xl mb-3">🥺</div>
                <h3 className="font-display text-xl text-white mb-2">Missing them?</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-5">
                  Let {peerName || 'them'} know you're thinking about them.
                </p>

                <label className="flex items-center justify-center gap-2 text-xs text-white/60 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoSendMessage}
                    onChange={(e) => setAlsoSendMessage(e.target.checked)}
                    className="accent-blush-500"
                  />
                  Also send a chat message
                </label>

                <AnimatePresence initial={false}>
                  {alsoSendMessage && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                      <input
                        type="text"
                        maxLength={200}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white text-center outline-none focus:border-blush-400/60"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && <p className="text-xs text-red-300 mb-3">{error}</p>}

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={send}
                    disabled={sending || (alsoSendMessage && !messageText.trim())}
                    className="w-full py-3 rounded-2xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 disabled:opacity-50 transition-all min-h-[44px]"
                  >
                    {sending ? 'Sending…' : 'Send ❤️'}
                  </button>
                  <button
                    onClick={close}
                    className="w-full py-3 rounded-2xl text-sm font-medium bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
