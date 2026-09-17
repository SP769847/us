import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { categoryMeta, subcategoryMeta, intimacyLevelMeta } from '../../utils/questionCategories.js';
import AnswerInput from '../questions/AnswerInput.jsx';

const isAnswerGiven = (v) => v !== null && v !== undefined && v !== '';

export default function SurpriseQuestionCard({ sentQuestion, isMine, myId, peer, onAnswer, onReveal, onSkip }) {
  const [answering, setAnswering] = useState(false);
  const [answerValue, setAnswerValue] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!sentQuestion) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/30 italic">
        This question is no longer available.
      </div>
    );
  }

  const meta = categoryMeta(sentQuestion.category);
  const subMeta = sentQuestion.subcategory ? subcategoryMeta(sentQuestion.subcategory) : null;
  const levelMeta = sentQuestion.intimacyLevel ? intimacyLevelMeta(sentQuestion.intimacyLevel) : null;
  const isNaughty = sentQuestion.ageRestricted;
  const isTogether = sentQuestion.mode === 'ANSWER_TOGETHER';

  const submitAnswer = async () => {
    if (!isAnswerGiven(answerValue)) return;
    setBusy(true);
    try {
      await onAnswer(sentQuestion.id, answerValue);
      setAnswering(false);
      setAnswerValue(null);
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

  const skip = async () => {
    setBusy(true);
    try {
      await onSkip(sentQuestion.id);
    } finally {
      setBusy(false);
    }
  };

  const answererName = sentQuestion.answeredById === myId ? 'You' : peer?.fullName || 'They';

  // This state only ever exists on the recipient's own device (the server
  // never discloses a skip to the sender) — a quiet collapsed placeholder
  // rather than the full question card.
  if (sentQuestion.skipped) {
    return (
      <div className="w-full max-w-full sm:max-w-md rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
        <p className="text-xs text-white/35 italic">You skipped this question ❤️</p>
      </div>
    );
  }

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
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base leading-none">{isNaughty ? '🔥' : isTogether ? '✨' : '✨'}</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50 truncate">
                {isTogether
                  ? 'Answer Together'
                  : sentQuestion.answer
                  ? 'Question Answered'
                  : subMeta
                  ? subMeta.label
                  : isNaughty
                  ? 'Private Question'
                  : 'Surprise Question'}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {levelMeta && (
                <span className="text-[9px] font-medium text-white/45 bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5">
                  {levelMeta.emoji} {levelMeta.label}
                </span>
              )}
              {isNaughty && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-plum-300 bg-plum-500/15 border border-plum-400/30 rounded-full px-1.5 py-0.5">
                  18+
                </span>
              )}
            </div>
          </div>

          <p className="font-display text-base sm:text-lg leading-snug text-white break-words mb-3">
            {sentQuestion.questionText}
          </p>

          {isTogether ? (
            sentQuestion.bothAnswered ? (
              <div className="space-y-2">
                <div className="bg-white/5 rounded-xl px-3.5 py-3">
                  <p className="text-[11px] text-white/40 mb-1">You answered</p>
                  <p className="text-sm text-white/85 leading-relaxed break-words">{sentQuestion.myAnswer}</p>
                </div>
                <div className="bg-white/5 rounded-xl px-3.5 py-3">
                  <p className="text-[11px] text-white/40 mb-1">{peer?.fullName || 'They'} answered</p>
                  <p className="text-sm text-white/85 leading-relaxed break-words">{sentQuestion.partnerAnswer}</p>
                </div>
              </div>
            ) : sentQuestion.myAnswer ? (
              <p className="text-xs text-white/35 italic">
                You answered ❤️ — waiting for {isMine ? peer?.fullName || 'them' : peer?.fullName || 'them'} to answer too…
              </p>
            ) : sentQuestion.canAnswer ? (
              <AnimatePresence initial={false} mode="wait">
                {answering ? (
                  <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mb-2.5">
                      <AnswerInput responseType={sentQuestion.responseType} options={sentQuestion.options} value={answerValue} onChange={setAnswerValue} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={submitAnswer}
                        disabled={busy || !isAnswerGiven(answerValue)}
                        className="flex-1 min-h-[42px] rounded-xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 disabled:opacity-50 transition-all"
                      >
                        Submit & Reveal Both
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
                    Answer Together ✨
                  </motion.button>
                )}
              </AnimatePresence>
            ) : (
              <p className="text-xs text-white/35 italic">Waiting for {peer?.fullName || 'them'} to answer…</p>
            )
          ) : sentQuestion.answer ? (
            <div className="bg-white/5 rounded-xl px-3.5 py-3 mt-1">
              <p className="text-[11px] text-white/40 mb-1">{answererName} answered</p>
              <p className="text-sm text-white/85 leading-relaxed break-words">{sentQuestion.answer}</p>
            </div>
          ) : sentQuestion.canAnswer ? (
            <AnimatePresence initial={false} mode="wait">
              {answering ? (
                <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mb-2.5">
                    <AnswerInput responseType={sentQuestion.responseType} options={sentQuestion.options} value={answerValue} onChange={setAnswerValue} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={submitAnswer}
                      disabled={busy || !isAnswerGiven(answerValue)}
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
              ) : isNaughty ? (
                <motion.div key="cta-naughty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAnswering(true)}
                      className="flex-1 min-h-[44px] rounded-xl text-sm font-medium bg-gradient-to-r from-blush-500 to-plum-500 text-white shadow-glow hover:brightness-110 transition-all"
                    >
                      Answer ❤️
                    </button>
                    <button
                      onClick={skip}
                      disabled={busy}
                      className="min-h-[44px] px-5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                  <p className="text-center text-[11px] text-white/30">Not comfortable? Skip it ❤️ — they won't be notified.</p>
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
