import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { categoryMeta } from '../../utils/questionCategories.js';

export default function SurpriseQuestionCard({ sentQuestion, isMine, myId, peer, onAnswer, onReveal }) {
  const [answering, setAnswering] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [busy, setBusy] = useState(false);

  if (!sentQuestion) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/30 italic">
        This question is no longer available.
      </div>
    );
  }

  const meta = categoryMeta(sentQuestion.category);
  const isNaughty = sentQuestion.ageRestricted;

  const submitAnswer = async () => {
    if (!answerText.trim()) return;
    setBusy(true);
    try {
      await onAnswer(sentQuestion.id, answerText.trim());
      setAnswering(false);
      setAnswerText('');
    } finally {
      setBusy(false);
    }
  };

  const reveal = async () => {
    setBusy(true);
    try {
      await onReveal(sentQuestion.id);
    } finally {
      setBusy(false);
    }
  };

  const answererName = sentQuestion.answeredById === myId ? 'You' : peer?.fullName || 'They';

  return (
    <div
      className={`w-full max-w-full sm:max-w-md rounded-2xl border ${
        isNaughty ? 'border-plum-400/25' : 'border-white/10'
      } bg-gradient-to-br ${meta.accent} bg-ink-900/70 backdrop-blur-xl px-4 py-4 sm:px-5 sm:py-4.5 shadow-soft`}
    >
      {sentQuestion.needsReveal ? (
        <div className="text-center py-2">
          <p className="text-2xl mb-2">👀</p>
          <p className="text-sm text-white/70 mb-4">Someone has a question for you…</p>
          <button
            onClick={reveal}
            disabled={busy}
            className="w-full sm:w-auto min-h-[44px] px-6 rounded-xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 disabled:opacity-50 transition-all"
          >
            Reveal Question ❤️
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-base leading-none">{isNaughty ? '🔥' : '✨'}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
              {sentQuestion.answer ? 'Question Answered' : isNaughty ? 'Naughty Question' : 'Surprise Question'}
            </span>
          </div>

          <p className="font-display text-base sm:text-lg leading-snug text-white break-words mb-3">
            {sentQuestion.questionText}
          </p>

          {sentQuestion.answer ? (
            <div className="bg-white/5 rounded-xl px-3.5 py-3 mt-1">
              <p className="text-[11px] text-white/40 mb-1">{answererName} answered</p>
              <p className="text-sm text-white/85 leading-relaxed break-words">{sentQuestion.answer}</p>
            </div>
          ) : sentQuestion.canAnswer ? (
            <AnimatePresence initial={false} mode="wait">
              {answering ? (
                <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <textarea
                    autoFocus
                    rows={2}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Type your answer…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-blush-400/60 resize-none mb-2.5"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={submitAnswer}
                      disabled={busy || !answerText.trim()}
                      className="flex-1 min-h-[42px] rounded-xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      Submit Answer
                    </button>
                    <button
                      onClick={() => setAnswering(false)}
                      className="min-h-[42px] px-4 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setAnswering(true)}
                  className="w-full min-h-[44px] rounded-xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 transition-all"
                >
                  Answer Question ❤️
                </motion.button>
              )}
            </AnimatePresence>
          ) : (
            <p className="text-xs text-white/35 italic">Waiting for {isMine ? peer?.fullName || 'them' : 'you'} to answer…</p>
          )}
        </>
      )}
    </div>
  );
}
