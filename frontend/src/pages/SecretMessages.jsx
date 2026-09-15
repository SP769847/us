import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import { useConnections } from '../hooks/useConnections.js';
import ConnectionPicker from '../components/ConnectionPicker.jsx';
import { Input, Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { SkeletonList } from '../components/ui/Skeleton.jsx';

export default function SecretMessages() {
  const connections = useConnections();
  const [secrets, setSecrets] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [activeSecret, setActiveSecret] = useState(null);
  const [passcode, setPasscode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [revealed, setRevealed] = useState(null);
  const [form, setForm] = useState({ recipientUsername: '', content: '', unlockAt: '', passcode: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/secret-messages').then((res) => setSecrets(res.data.secrets));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/secret-messages', { ...form, unlockAt: form.unlockAt || undefined, passcode: form.passcode || undefined });
      setComposeOpen(false);
      setForm({ recipientUsername: '', content: '', unlockAt: '', passcode: '' });
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openSecret = (secret) => {
    setActiveSecret(secret);
    setPasscode('');
    setUnlockError('');
    setRevealed(null);
  };

  const attemptUnlock = async () => {
    setUnlockError('');
    try {
      const { data } = await api.post(`/secret-messages/${activeSecret.id}/unlock`, { passcode: passcode || undefined });
      setRevealed(data.secret);
      load();
    } catch (err) {
      setUnlockError(extractErrorMessage(err, 'Incorrect passcode'));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Secret Messages 🔐</h1>
          <p className="text-white/40 text-sm">Something written just for them, locked until it's time.</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>Write One</Button>
      </div>

      {secrets === null ? (
        <SkeletonList count={3} className="h-20" />
      ) : secrets.length === 0 ? (
        <EmptyState icon="🔐" title="No secret messages yet" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {secrets.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => openSecret(s)}
              className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06] transition-colors"
            >
              <div className="text-2xl mb-2">{s.direction === 'RECEIVED' && !s.opened ? '✉️' : '🔓'}</div>
              <p className="text-sm font-medium">
                {s.direction === 'RECEIVED' ? `From ${s.sender.fullName}` : `To ${s.recipient.fullName}`}
              </p>
              <p className="text-xs text-white/40 mt-1">
                {s.isTimeLocked
                  ? `Unlocks ${new Date(s.unlockAt).toLocaleString()}`
                  : s.requiresPasscode && !s.opened && s.direction === 'RECEIVED'
                  ? 'Passcode required'
                  : s.opened || s.direction === 'SENT'
                  ? 'Opened'
                  : 'Tap to open'}
              </p>
            </motion.button>
          ))}
        </div>
      )}

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Write a Secret Message">
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-xs text-red-300">{error}</p>}
          <ConnectionPicker connections={connections} value={form.recipientUsername} onChange={(v) => setForm((f) => ({ ...f, recipientUsername: v }))} />
          <Textarea label="Your secret message" rows={4} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} required />
          <Input label="Unlock date (optional)" type="datetime-local" value={form.unlockAt} onChange={(e) => setForm((f) => ({ ...f, unlockAt: e.target.value }))} />
          <Input label="Passcode (optional)" value={form.passcode} onChange={(e) => setForm((f) => ({ ...f, passcode: e.target.value }))} placeholder="A word only they'd know" />
          <Button type="submit" className="w-full" loading={saving} disabled={!form.recipientUsername}>
            Send Secretly
          </Button>
        </form>
      </Modal>

      <Modal open={Boolean(activeSecret)} onClose={() => setActiveSecret(null)}>
        {activeSecret && (
          <div className="text-center py-2 min-h-[160px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {revealed ? (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.8, rotateX: -30 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  transition={{ type: 'spring', bounce: 0.35, duration: 0.6 }}
                >
                  <div className="text-3xl mb-3">💗</div>
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-w-sm">{revealed.content}</p>
                </motion.div>
              ) : activeSecret.direction === 'SENT' ? (
                <p className="text-sm text-white/50">Waiting for {activeSecret.recipient.fullName} to open this.</p>
              ) : activeSecret.isTimeLocked ? (
                <>
                  <div className="text-4xl mb-3">⏳</div>
                  <p className="text-sm text-white/50">Unlocks on {new Date(activeSecret.unlockAt).toLocaleString()}</p>
                </>
              ) : (
                <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 w-full">
                  <div className="text-4xl">🔐</div>
                  <p className="text-sm text-white/50">There's something written just for you...</p>
                  {activeSecret.requiresPasscode && (
                    <Input
                      placeholder="Enter passcode"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="text-center"
                    />
                  )}
                  {unlockError && <p className="text-xs text-red-300">{unlockError}</p>}
                  <Button onClick={attemptUnlock} className="w-full">
                    Open Message
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </Modal>
    </div>
  );
}
