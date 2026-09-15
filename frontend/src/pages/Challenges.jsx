import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import { useConnections } from '../hooks/useConnections.js';
import ConnectionPicker from '../components/ConnectionPicker.jsx';
import { Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function Challenges() {
  const connections = useConnections();
  const [challenges, setChallenges] = useState(null);
  const [randomPrompt, setRandomPrompt] = useState('');
  const [sendOpen, setSendOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [error, setError] = useState('');
  const [responseDrafts, setResponseDrafts] = useState({});

  const load = () => api.get('/challenges').then((res) => setChallenges(res.data.challenges));

  const rollRandom = () => api.get('/challenges/random').then((res) => setRandomPrompt(res.data.prompt));

  useEffect(() => {
    load();
    rollRandom();
  }, []);

  const send = async () => {
    setError('');
    try {
      await api.post('/challenges', { recipientUsername: recipient, prompt: randomPrompt });
      setSendOpen(false);
      setRecipient('');
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const respond = async (id) => {
    const response = responseDrafts[id];
    if (!response?.trim()) return;
    await api.post(`/challenges/${id}/respond`, { response, status: 'COMPLETED' });
    setResponseDrafts((d) => ({ ...d, [id]: '' }));
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl mb-1">Challenges 🔥</h1>
      <p className="text-white/40 text-sm mb-6">Playful prompts to keep things fun between you two.</p>

      <div className="glass rounded-2xl p-6 mb-8 text-center">
        <p className="text-xs uppercase tracking-wider text-blush-300/70 mb-3">Random Challenge</p>
        <motion.p key={randomPrompt} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-display text-lg mb-5">
          {randomPrompt}
        </motion.p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={rollRandom}>
            🎲 Reroll
          </Button>
          <Button onClick={() => setSendOpen(true)}>Send This</Button>
        </div>
      </div>

      <h3 className="text-sm font-medium text-white/70 mb-3">Challenge History</h3>
      {challenges === null ? null : challenges.length === 0 ? (
        <EmptyState icon="🔥" title="No challenges yet" />
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <div key={c.id} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{c.prompt}</p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    c.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/8 text-white/50'
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <p className="text-xs text-white/35 mb-3">
                {c.sender.username === c.recipient.username ? '' : `${c.sender.fullName} → ${c.recipient.fullName}`}
              </p>
              {c.responses.map((r) => (
                <div key={r.id} className="bg-white/5 rounded-lg p-2.5 text-xs text-white/70 mb-2">
                  <span className="text-white/40">{r.user.fullName}:</span> {r.response}
                </div>
              ))}
              {c.status !== 'COMPLETED' && (
                <div className="flex gap-2 mt-2">
                  <Textarea
                    rows={1}
                    placeholder="Write your response…"
                    value={responseDrafts[c.id] || ''}
                    onChange={(e) => setResponseDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                  />
                  <Button size="sm" onClick={() => respond(c.id)}>
                    Reply
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={sendOpen} onClose={() => setSendOpen(false)} title="Send Challenge">
        <div className="space-y-4">
          {error && <p className="text-xs text-red-300">{error}</p>}
          <p className="text-sm text-white/60 italic">"{randomPrompt}"</p>
          <ConnectionPicker connections={connections} value={recipient} onChange={setRecipient} />
          <Button className="w-full" onClick={send} disabled={!recipient}>
            Send Challenge
          </Button>
        </div>
      </Modal>
    </div>
  );
}
