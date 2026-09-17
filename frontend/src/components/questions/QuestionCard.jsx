import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AnswerInput from './AnswerInput.jsx';
import { categoryMeta, subcategoryMeta, intimacyLevelMeta } from '../../utils/questionCategories.js';

const isAnswerGiven = (v) => v !== null && v !== undefined && v !== '';

export default function QuestionCard({ question, loading, sending, saved, onNext, onSend, onSave, onSkip, canSend = true }) {
  const [mode, setMode] = useState(null); // null | 'answer' | 'together'
  const [answerValue, setAnswerValue] = useState(null);
  const meta = question ? categoryMeta(question.category) : null;
  const subMeta = question?.subcategory ? subcategoryMeta(question.subcategory) : null;
  const levelMeta = question?.intimacyLevel ? intimacyLevelMeta(question.intimacyLevel) : null;
  const isNaughty = question?.category === 'NAUGHTY_18';

  const reset = () => {
    setMode(null);
    setAnswerValue(null);
  };

  const shareAnswer = () => {
    if (!isAnswerGiven(answerValue)) return;
    onSend({ answer: answerValue });
    reset();
  };

  const answerTogether = () => {
    if (!isAnswerGiven(answerValue)) return;
    onSend({ answer: answerValue, mode: 'ANSWER_TOGETHER' });
    reset();
  };

  const sendBare = () => {
    onSend({});
    reset();
  };

  const skip = () => {
    reset();
    onSkip ? onSkip() : onNext();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${
        isNaughty ? 'border-plum-400/25' : 'border-white/10'
      } bg-gradient-to-br ${meta?.accent || 'from-white/10 to-white/0'} bg-ink-900/60 backdrop-blur-xl shadow-soft p-6 sm:p-7`}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none">{meta?.emoji}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50 truncate">
            {subMeta ? subMeta.label : isNaughty ? 'Naughty Question' : `${meta?.label || 'Surprise'} Question`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {levelMeta && (
            <span className="text-[10px] font-medium text-white/50 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
              {levelMeta.emoji} {levelMeta.label}
            </span>
          )}
          {isNaughty && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-plum-300 bg-plum-500/15 border border-plum-400/30 rounded-full px-2 py-0.5">
              18+
            </span>
          )}
        </div>
      </div>

      {loading || !question ? (
        <div className="py-6 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-blush-300/30 border-t-blush-400 animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.p
            key={question.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="font-display text-xl sm:text-2xl leading-snug text-white mb-6 break-words"
          >
            "{question.questionText}"
          </motion.p>
        </AnimatePresence>
      )}

      {!loading && question && (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {(mode === 'answer' || mode === 'together') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mb-2">
                  <AnswerInput responseType={question.responseType} options={question.options} value={answerValue} onChange={setAnswerValue} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'answer' ? (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={shareAnswer}
                disabled={!isAnswerGiven(answerValue) || sending}
                className="flex-1 min-h-[46px] rounded-2xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 disabled:opacity-40 transition-all"
              >
                Share Answer ❤️
              </button>
              <button
                onClick={reset}
                className="min-h-[46px] px-4 rounded-2xl text-sm font-medium bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : mode === 'together' ? (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={answerTogether}
                disabled={!isAnswerGiven(answerValue) || sending}
                className="flex-1 min-h-[46px] rounded-2xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 disabled:opacity-40 transition-all"
              >
                Send & Wait for Theirs ✨
              </button>
              <button
                onClick={reset}
                className="min-h-[46px] px-4 rounded-2xl text-sm font-medium bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => setMode('answer')}
                  disabled={!canSend}
                  className="flex-1 min-h-[46px] rounded-2xl text-sm font-medium bg-white/8 border border-white/10 text-white hover:bg-white/14 transition-colors disabled:opacity-40"
                >
                  Answer
                </button>
                <button
                  onClick={sendBare}
                  disabled={sending || !canSend}
                  className="flex-1 min-h-[46px] rounded-2xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 disabled:opacity-40 transition-all"
                >
                  Send to Partner ❤️
                </button>
              </div>
              <button
                onClick={() => setMode('together')}
                disabled={!canSend}
                className="w-full min-h-[42px] rounded-2xl text-xs font-medium bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors disabled:opacity-40"
              >
                ✨ Answer Together (blind reveal, both answers at once)
              </button>
            </>
          )}

          {!mode && (
            <div className="flex items-center gap-1 pt-0.5">
              <button
                onClick={() => onSave?.(question)}
                disabled={saved}
                className="flex-1 min-h-[38px] rounded-xl text-xs font-medium text-white/45 hover:text-white/80 hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                {saved ? '✓ Saved' : '🔖 Save Question'}
              </button>
              <button
                onClick={skip}
                className="flex-1 min-h-[38px] rounded-xl text-xs font-medium text-white/45 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  reset();
                  onNext();
                }}
                className="flex-1 min-h-[38px] rounded-xl text-xs font-medium text-white/45 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
