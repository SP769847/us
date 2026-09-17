import { useState } from 'react';
import { motion } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import { useConnections } from '../hooks/useConnections.js';
import { useSurpriseQuestion } from '../hooks/useSurpriseQuestion.js';
import QuestionCard from '../components/questions/QuestionCard.jsx';
import CategoryGrid from '../components/questions/CategoryGrid.jsx';
import AgeGateModal from '../components/questions/AgeGateModal.jsx';
import { Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function Questions() {
  const connections = useConnections();
  const [conversationId, setConversationId] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sentToast, setSentToast] = useState('');
  const [askText, setAskText] = useState('');
  const [askSending, setAskSending] = useState(false);
  const [askError, setAskError] = useState('');

  const {
    category, question, loading, error,
    selectCategory, surpriseMe, next, reset,
    ageGateOpen, confirmAgeGate, cancelAgeGate,
  } = useSurpriseQuestion();

  const activeConversationId = conversationId || connections?.[0]?.conversationId || '';

  const send = async ({ answer }) => {
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
        mode: 'SURPRISE',
        answer: answer || undefined,
      });
      setSentToast(answer ? 'Your answer was shared 💕' : 'Question sent 💌');
      setTimeout(() => setSentToast(''), 3000);
      next();
    } catch (err) {
      setSendError(extractErrorMessage(err, 'Could not send this question'));
    } finally {
      setSending(false);
    }
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

  if (connections === null) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl sm:text-3xl mb-1">
        Surprise Questions ✨
      </motion.h1>
      <p className="text-white/40 text-sm mb-6">Romantic, cute, funny, deep — or something a little naughty. Pick a mood.</p>

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

          {!question && !loading ? (
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
                  <QuestionCard question={question} loading={loading} sending={sending} onNext={next} onSend={send} canSend={Boolean(activeConversationId)} />
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
        </>
      )}

      <AgeGateModal open={ageGateOpen} onConfirm={confirmAgeGate} onCancel={cancelAgeGate} />
    </div>
  );
}
