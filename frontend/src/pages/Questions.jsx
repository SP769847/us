import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import { useConnections } from '../hooks/useConnections.js';
import { useSurpriseQuestion } from '../hooks/useSurpriseQuestion.js';
import QuestionCard from '../components/questions/QuestionCard.jsx';
import CategoryGrid from '../components/questions/CategoryGrid.jsx';
import NaughtySubcategoryPicker from '../components/questions/NaughtySubcategoryPicker.jsx';
import IntimacyLevelPicker from '../components/questions/IntimacyLevelPicker.jsx';
import AgeGateModal from '../components/questions/AgeGateModal.jsx';
import { Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { CONTENT_LEVEL_ORDER, CONTENT_LEVEL_META, AGE_GATED_LEVELS, categoryMeta, subcategoryMeta, isAgeConfirmed } from '../utils/questionCategories.js';

export default function Questions() {
  const connections = useConnections();
  const [conversationId, setConversationId] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sentToast, setSentToast] = useState('');
  const [askText, setAskText] = useState('');
  const [askSending, setAskSending] = useState(false);
  const [askError, setAskError] = useState('');

  const [level, setLevel] = useState('ROMANTIC');
  const [pendingLevel, setPendingLevel] = useState(null);

  const [savedQuestions, setSavedQuestions] = useState(null);
  const [savedCurrentId, setSavedCurrentId] = useState(null);

  const [customText, setCustomText] = useState('');
  const [customCategory, setCustomCategory] = useState('ROMANTIC');
  const [customAgeRestricted, setCustomAgeRestricted] = useState(false);
  const [customVisibility, setCustomVisibility] = useState('PRIVATE');
  const [customScheduledFor, setCustomScheduledFor] = useState('');
  const [customSaving, setCustomSaving] = useState(false);
  const [customError, setCustomError] = useState('');
  const [myCustomQuestions, setMyCustomQuestions] = useState(null);

  const {
    category, subcategory, question, loading, error, naughtyPickerOpen, levelPickerOpen,
    selectCategory, selectIntimacyLevel, browseByTheme, selectSubcategory, selectAnyNaughty, surpriseMe, next, reset, backToCategories,
    ageGateOpen, confirmAgeGate, cancelAgeGate,
  } = useSurpriseQuestion();

  const activeConversationId = conversationId || connections?.[0]?.conversationId || '';

  useEffect(() => {
    api.get('/questions/preferences').then(({ data }) => setLevel(data.level)).catch(() => {});
    loadSaved();
    loadCustomQuestions();
  }, []);

  const loadSaved = () => {
    api.get('/questions/saved').then(({ data }) => setSavedQuestions(data.saved)).catch(() => setSavedQuestions([]));
  };

  const loadCustomQuestions = () => {
    api.get('/questions/custom').then(({ data }) => setMyCustomQuestions(data.customQuestions)).catch(() => setMyCustomQuestions([]));
  };

  const chooseLevel = async (key) => {
    if (AGE_GATED_LEVELS.has(key) && !isAgeConfirmed()) {
      setPendingLevel(key);
      return;
    }
    setLevel(key);
    api.patch('/questions/preferences', { level: key }).catch(() => {});
  };

  const confirmLevelAgeGate = () => {
    const key = pendingLevel;
    setPendingLevel(null);
    if (key) chooseLevel(key);
  };

  const send = async ({ answer, mode = 'SURPRISE' }) => {
    if (!activeConversationId) {
      setSendError('Connect with someone first to send a question.');
      return;
    }
    setSending(true);
    setSendError('');
    try {
      await api.post('/questions/send', {
        conversationId: activeConversationId,
        questionId: question.id,
        mode,
        answer: answer === undefined || answer === '' ? undefined : answer,
      });
      setSentToast(mode === 'ANSWER_TOGETHER' ? "Sent — you'll both see the answers once they respond ✨" : answer ? 'Your answer was shared 💕' : 'Question sent 💌');
      setTimeout(() => setSentToast(''), 3500);
      next();
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
      loadSaved();
    } catch {
      // non-critical — leave the button enabled so they can retry
    }
  };

  const unsave = async (id) => {
    await api.delete(`/questions/saved/${id}`);
    setSavedQuestions((prev) => prev.filter((s) => s.id !== id));
  };

  const sendAskMeAnything = async (e) => {
    e.preventDefault();
    if (!askText.trim() || !activeConversationId) return;
    setAskSending(true);
    setAskError('');
    try {
      await api.post('/questions/send', {
        conversationId: activeConversationId,
        mode: 'ASK_ME_ANYTHING',
        customText: askText.trim(),
      });
      setAskText('');
      setSentToast('Sent — they will see "Someone has a question for you" 👀');
      setTimeout(() => setSentToast(''), 3500);
    } catch (err) {
      setAskError(extractErrorMessage(err, 'Could not send your question'));
    } finally {
      setAskSending(false);
    }
  };

  const createCustomQuestion = async (e) => {
    e.preventDefault();
    if (!customText.trim()) return;
    if (customAgeRestricted && !isAgeConfirmed()) {
      setCustomError('Please confirm you are 18+ first (open the Naughty 18+ category above).');
      return;
    }
    if (customVisibility === 'PARTNER' && !activeConversationId) {
      setCustomError('Connect with someone first to send to your partner.');
      return;
    }
    setCustomSaving(true);
    setCustomError('');
    try {
      await api.post('/questions/custom', {
        questionText: customText.trim(),
        category: customCategory,
        ageRestricted: customAgeRestricted,
        visibility: customVisibility,
        conversationId: customVisibility === 'PARTNER' ? activeConversationId : undefined,
        scheduledFor: customScheduledFor || undefined,
      });
      setCustomText('');
      setCustomScheduledFor('');
      loadCustomQuestions();
      setSentToast(
        customVisibility === 'PRIVATE'
          ? 'Saved to your private questions ✨'
          : customScheduledFor
          ? 'Scheduled — it will arrive at the chosen time 💌'
          : 'Sent to your partner 💌'
      );
      setTimeout(() => setSentToast(''), 3000);
    } catch (err) {
      setCustomError(extractErrorMessage(err, 'Could not save this question'));
    } finally {
      setCustomSaving(false);
    }
  };

  const cancelCustomQuestion = async (id) => {
    await api.delete(`/questions/custom/${id}`);
    setMyCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  if (connections === null) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl sm:text-3xl mb-1">
        Surprise Questions ✨
      </motion.h1>
      <p className="text-white/40 text-sm mb-5">Romantic, cute, funny, deep — or something a little naughty. Pick a mood.</p>

      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-wider text-white/35 mb-2">Surprise Me content level</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CONTENT_LEVEL_ORDER.map((key) => {
            const meta = CONTENT_LEVEL_META[key];
            return (
              <button
                key={key}
                onClick={() => chooseLevel(key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  level === key ? 'bg-gradient-to-r from-blush-500 to-plum-500 text-white border-transparent' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                }`}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {connections.length === 0 ? (
        <EmptyState icon="💫" title="Connect first" subtitle="You'll need a connection before you can send questions to someone." />
      ) : (
        <>
          {connections.length > 1 && (
            <select
              value={activeConversationId}
              onChange={(e) => setConversationId(e.target.value)}
              className="w-full mb-6 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
            >
              {connections.map((c) => (
                <option key={c.id} value={c.conversationId} className="bg-ink-900">
                  Send to {c.user.fullName}
                </option>
              ))}
            </select>
          )}

          {sentToast && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-4 text-sm text-blush-200 bg-blush-500/10 border border-blush-400/20 rounded-xl px-4 py-2.5">
              {sentToast}
            </motion.div>
          )}

          {levelPickerOpen ? (
            <IntimacyLevelPicker onSelect={selectIntimacyLevel} onBrowseByTheme={browseByTheme} onBack={backToCategories} />
          ) : naughtyPickerOpen ? (
            <NaughtySubcategoryPicker onSelect={selectSubcategory} onAny={selectAnyNaughty} onBack={backToCategories} />
          ) : !question && !loading ? (
            <CategoryGrid onSelect={selectCategory} onSurpriseMe={surpriseMe} />
          ) : (
            <div className="space-y-3">
              {error ? (
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-sm text-white/50 mb-4">{error}</p>
                  <Button variant="secondary" size="sm" onClick={reset}>
                    ← Choose a category
                  </Button>
                </div>
              ) : (
                <>
                  <QuestionCard
                    question={question}
                    loading={loading}
                    sending={sending}
                    saved={savedCurrentId === question?.id}
                    onNext={next}
                    onSend={send}
                    onSave={saveCurrent}
                    canSend={Boolean(activeConversationId)}
                  />
                  {sendError && <p className="text-xs text-red-300 px-1">{sendError}</p>}
                  <button onClick={reset} className="text-xs text-white/40 hover:text-white/70 transition-colors px-1">
                    ← Choose a different category
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-10 glass rounded-2xl p-6">
            <h3 className="font-display text-lg text-white mb-1">Ask Me Something ❤️</h3>
            <p className="text-xs text-white/40 mb-4">
              Write your own question. They'll see "Someone has a question for you… 👀" until they reveal it.
            </p>
            <form onSubmit={sendAskMeAnything} className="space-y-3">
              {askError && <p className="text-xs text-red-300">{askError}</p>}
              <Textarea
                rows={2}
                maxLength={300}
                value={askText}
                onChange={(e) => setAskText(e.target.value)}
                placeholder="What do you want to ask?"
                required
              />
              <Button type="submit" loading={askSending} disabled={!askText.trim() || !activeConversationId}>
                Send Mystery Question
              </Button>
            </form>
          </div>

          <div className="mt-6 glass rounded-2xl p-6">
            <h3 className="font-display text-lg text-white mb-1">Create Your Own Question</h3>
            <p className="text-xs text-white/40 mb-4">
              Keep it private just for you, send it now, or schedule it for later. Only your intended recipient will ever see it.
            </p>
            <form onSubmit={createCustomQuestion} className="space-y-3">
              {customError && <p className="text-xs text-red-300">{customError}</p>}
              <Textarea rows={2} maxLength={500} value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="Write your question…" required />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
                >
                  {['ROMANTIC', 'CUTE', 'FUNNY', 'DEEP', 'NAUGHTY_18', 'RANDOM'].map((c) => (
                    <option key={c} value={c} className="bg-ink-900">
                      {categoryMeta(c).emoji} {categoryMeta(c).label}
                    </option>
                  ))}
                </select>
                <select
                  value={customVisibility}
                  onChange={(e) => setCustomVisibility(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
                >
                  <option value="PRIVATE" className="bg-ink-900">
                    🔒 Private (just for me)
                  </option>
                  <option value="PARTNER" className="bg-ink-900">
                    ❤️ Send to partner
                  </option>
                </select>
              </div>

              {customVisibility === 'PARTNER' && (
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Optional scheduled delivery</label>
                  <input
                    type="datetime-local"
                    value={customScheduledFor}
                    onChange={(e) => setCustomScheduledFor(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
                <input type="checkbox" checked={customAgeRestricted} onChange={(e) => setCustomAgeRestricted(e.target.checked)} className="accent-blush-500" />
                Mark as 18+
              </label>

              <Button type="submit" loading={customSaving} disabled={!customText.trim()}>
                {customVisibility === 'PRIVATE' ? 'Save Privately' : customScheduledFor ? 'Schedule It' : 'Send Now'}
              </Button>
            </form>

            {myCustomQuestions?.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/5 space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-white/35 mb-1">Your questions</p>
                {myCustomQuestions.map((q) => (
                  <div key={q.id} className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs text-white/70 truncate">{q.questionText}</p>
                      <p className="text-[10px] text-white/35 mt-0.5">
                        {q.status === 'PRIVATE' ? '🔒 Private' : q.status === 'DELIVERED' ? '✓ Delivered' : `⏳ Scheduled for ${new Date(q.scheduledFor).toLocaleString()}`}
                      </p>
                    </div>
                    {q.status !== 'DELIVERED' && (
                      <button onClick={() => cancelCustomQuestion(q.id)} className="shrink-0 text-xs text-white/30 hover:text-red-300 transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {savedQuestions?.length > 0 && (
            <div className="mt-6 glass rounded-2xl p-6">
              <h3 className="font-display text-lg text-white mb-4">🔖 Saved Questions</h3>
              <div className="space-y-2">
                {savedQuestions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[10px] text-white/35 mb-0.5">
                        {categoryMeta(s.category).emoji} {s.subcategory ? subcategoryMeta(s.subcategory).label : categoryMeta(s.category).label}
                      </p>
                      <p className="text-xs text-white/75 truncate">{s.questionText}</p>
                    </div>
                    <button onClick={() => unsave(s.id)} className="shrink-0 text-xs text-white/30 hover:text-red-300 transition-colors">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AgeGateModal open={ageGateOpen} onConfirm={confirmAgeGate} onCancel={cancelAgeGate} />
      <AgeGateModal open={Boolean(pendingLevel)} onConfirm={confirmLevelAgeGate} onCancel={() => setPendingLevel(null)} />
    </div>
  );
}
