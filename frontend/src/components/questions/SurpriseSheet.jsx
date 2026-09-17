import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import api, { extractErrorMessage } from '../../services/api.js';
import { useSurpriseQuestion } from '../../hooks/useSurpriseQuestion.js';
import CategoryGrid from './CategoryGrid.jsx';
import NaughtySubcategoryPicker from './NaughtySubcategoryPicker.jsx';
import IntimacyLevelPicker from './IntimacyLevelPicker.jsx';
import QuestionCard from './QuestionCard.jsx';
import AgeGateModal from './AgeGateModal.jsx';

// Mobile: true bottom sheet (slides up, rounded top corners, drag handle).
// Desktop (sm:): the same component becomes a centered modal card — no
// separate desktop component to keep in sync.
export default function SurpriseSheet({ open, onClose, conversationId }) {
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [savedCurrentId, setSavedCurrentId] = useState(null);
  const {
    question, loading, error, naughtyPickerOpen, levelPickerOpen,
    selectCategory, selectIntimacyLevel, browseByTheme, selectSubcategory, selectAnyNaughty, surpriseMe, next, reset, backToCategories,
    ageGateOpen, confirmAgeGate, cancelAgeGate,
  } = useSurpriseQuestion();

  if (typeof document === 'undefined') return null;

  const close = () => {
    reset();
    setSendError('');
    onClose();
  };

  const send = async ({ answer, mode = 'SURPRISE' }) => {
    setSending(true);
    setSendError('');
    try {
      await api.post('/questions/send', {
        conversationId,
        questionId: question.id,
        mode,
        answer: answer === undefined || answer === '' ? undefined : answer,
      });
      close();
    } catch (err) {
      setSendError(extractErrorMessage(err, 'Could not send this question'));
    } finally {
      setSending(false);
    }
  };

  const saveCurrent = async (q) => {
    try {
      await api.post('/questions/saved', { questionId: q.id });
      setSavedCurrentId(q.id);
    } catch {
      // non-critical
    }
  };

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              className="relative w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-3xl bg-ink-950 border-t sm:border border-white/10 max-h-[88vh] overflow-y-auto"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-2.5 w-10 h-1 rounded-full bg-white/15" />
              <div className="sticky top-0 bg-ink-950/95 backdrop-blur-xl flex items-center justify-between px-5 pt-5 sm:pt-4 pb-3 border-b border-white/5 z-10">
                <h3 className="font-display text-lg text-white">✨ Surprise Me</h3>
                <button
                  onClick={close}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 text-xl leading-none transition-colors"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <div className="p-5">
                {levelPickerOpen ? (
                  <IntimacyLevelPicker onSelect={selectIntimacyLevel} onBrowseByTheme={browseByTheme} onBack={backToCategories} />
                ) : naughtyPickerOpen ? (
                  <NaughtySubcategoryPicker onSelect={selectSubcategory} onAny={selectAnyNaughty} onBack={backToCategories} />
                ) : !question && !loading ? (
                  <CategoryGrid onSelect={selectCategory} onSurpriseMe={surpriseMe} compact />
                ) : error ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-white/50 mb-4">{error}</p>
                    <button onClick={reset} className="text-sm text-blush-300 hover:text-blush-200">
                      ← Choose a category
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <QuestionCard
                      question={question}
                      loading={loading}
                      sending={sending}
                      saved={savedCurrentId === question?.id}
                      onNext={next}
                      onSend={send}
                      onSave={saveCurrent}
                    />
                    {sendError && <p className="text-xs text-red-300">{sendError}</p>}
                    <button onClick={reset} className="text-xs text-white/40 hover:text-white/70 transition-colors">
                      ← Choose a different category
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AgeGateModal open={ageGateOpen} onConfirm={confirmAgeGate} onCancel={cancelAgeGate} />
    </>,
    document.body
  );
}
