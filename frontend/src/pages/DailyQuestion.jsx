import { useEffect, useState } from 'react';
import api, { extractErrorMessage } from '../services/api.js';
import { useConnections } from '../hooks/useConnections.js';
import { Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function DailyQuestion() {
  const connections = useConnections();
  const [question, setQuestion] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [shareWith, setShareWith] = useState('');
  const [history, setHistory] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: today }, { data: hist }, { data: shared }] = await Promise.all([
      api.get('/daily-questions/today'),
      api.get('/daily-questions/history/mine'),
      api.get('/daily-questions/shared/with-me'),
    ]);
    setQuestion(today.question);
    setMyAnswer(today.myAnswer);
    setHistory(hist.answers);
    setSharedWithMe(shared.answers);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/daily-questions/${question.id}/answer`, { answer: answerText, shareWithUsername: shareWith || undefined });
      setAnswerText('');
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!question) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl mb-1">Daily Question 🥰</h1>
      <p className="text-white/40 text-sm mb-6">A little reflection to share, one day at a time.</p>

      <div className="glass rounded-2xl p-6 mb-8">
        <p className="text-xs uppercase tracking-wider text-blush-300/70 mb-2">Today's Question</p>
        <h2 className="font-display text-xl mb-4">{question.prompt}</h2>

        {myAnswer ? (
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">Your answer</p>
            <p className="text-sm text-white/80">{myAnswer.answer}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {error && <p className="text-xs text-red-300">{error}</p>}
            <Textarea rows={3} value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Type your answer…" required />
            {connections?.length > 0 && (
              <select
                value={shareWith}
                onChange={(e) => setShareWith(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
              >
                <option value="">Keep private</option>
                {connections.map((c) => (
                  <option key={c.user.username} value={c.user.username} className="bg-ink-900">
                    Share with {c.user.fullName}
                  </option>
                ))}
              </select>
            )}
            <Button type="submit" loading={saving}>
              Submit Answer
            </Button>
          </form>
        )}
      </div>

      {sharedWithMe.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-white/70 mb-3">Shared with you</h3>
          <div className="space-y-2">
            {sharedWithMe.map((a) => (
              <div key={a.id} className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-1">{a.from.fullName} · {a.question.prompt}</p>
                <p className="text-sm text-white/80">{a.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-white/70 mb-3">Your Answer History</h3>
        {history.length === 0 ? (
          <EmptyState icon="🥰" title="No answers yet" />
        ) : (
          <div className="space-y-2">
            {history.map((a) => (
              <div key={a.id} className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-1">{a.question.prompt}</p>
                <p className="text-sm text-white/70">{a.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
