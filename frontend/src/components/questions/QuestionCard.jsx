import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Textarea } from '../ui/Input.jsx';
import { categoryMeta } from '../../utils/questionCategories.js';

export default function QuestionCard({ question, loading, sending, onNext, onSend, canSend = true }) {
  const [answering, setAnswering] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const meta = question ? categoryMeta(question.category) : null;
  const isNaughty = question?.category === 'NAUGHTY_18';

  const reset = () => {
    setAnswering(false);
    setAnswerText('');
  };

  const shareAnswer = () => {
    if (!answerText.trim()) return;
    onSend({ answer: answerText.trim() });
    reset();
  };

  const sendBare = () => {
    onSend({});
    reset();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${
        isNaughty ? 'border-plum-400/25' : 'border-white/10'
      } bg-gradient-to-br ${meta?.accent || 'from-white/10 to-white/0'} bg-ink-900/60 backdrop-blur-xl shadow-soft p-6 sm:p-7`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg leading-none">{meta?.emoji}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
          {isNaughty ? 'Naughty Question' : `${meta?.label || 'Surprise'} Question`}
        </span>
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
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {answering && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Textarea
                  autoFocus
                  rows={3}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type your answer…"
                  className="mb-2"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {answering ? (
              <>
                <button
                  onClick={shareAnswer}
                  disabled={!answerText.trim() || sending}
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
              </>
            ) : (
              <>
                <button
                  onClick={() => setAnswering(true)}
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
              </>
            )}
          </div>

          <button
            onClick={() => {
              reset();
              onNext();
            }}
            className="w-full min-h-[44px] rounded-2xl text-xs font-medium uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
          >
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
}
