import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import { mediaUrl } from '../utils/media.js';
import { useConnections } from '../hooks/useConnections.js';
import ConnectionPicker from '../components/ConnectionPicker.jsx';
import { Input, Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { SkeletonList } from '../components/ui/Skeleton.jsx';

export default function LoveNotes() {
  const connections = useConnections();
  const [notes, setNotes] = useState(null);
  const [tab, setTab] = useState('RECEIVED');
  const [composeOpen, setComposeOpen] = useState(false);
  const [viewNote, setViewNote] = useState(null);
  const [form, setForm] = useState({ recipientUsername: '', title: '', message: '', unlockAt: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/love-notes').then((res) => setNotes(res.data.notes));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/love-notes', { ...form, unlockAt: form.unlockAt || undefined });
      setComposeOpen(false);
      setForm({ recipientUsername: '', title: '', message: '', unlockAt: '' });
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const filtered = (notes || []).filter((n) => n.direction === tab);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Love Notes 💌</h1>
          <p className="text-white/40 text-sm">Little written moments, just for them.</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>Write a Note</Button>
      </div>

      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
        {['RECEIVED', 'SENT'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${tab === t ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'}`}
          >
            {t === 'RECEIVED' ? 'Received' : 'Sent'}
          </button>
        ))}
      </div>

      {notes === null ? (
        <SkeletonList count={3} className="h-24" />
      ) : filtered.length === 0 ? (
        <EmptyState icon="💌" title="Nothing here yet" subtitle="Write someone a little note they'll treasure." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((n, i) => (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setViewNote(n)}
              className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06] transition-colors"
            >
              <div className="text-xl mb-2">{n.locked ? '🔒' : '💌'}</div>
              <h3 className="font-medium text-sm mb-1">{n.title}</h3>
              <p className="text-xs text-white/40">
                {n.direction === 'RECEIVED' ? `From ${n.sender.fullName}` : `To ${n.recipient.fullName}`}
              </p>
              {n.locked && <p className="text-[11px] text-blush-300 mt-2">Unlocks {new Date(n.unlockAt).toLocaleString()}</p>}
            </motion.button>
          ))}
        </div>
      )}

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Write a Love Note">
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-xs text-red-300">{error}</p>}
          <ConnectionPicker connections={connections} value={form.recipientUsername} onChange={(v) => setForm((f) => ({ ...f, recipientUsername: v }))} />
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <Textarea label="Message" rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
          <Input
            label="Unlock date (optional)"
            type="datetime-local"
            value={form.unlockAt}
            onChange={(e) => setForm((f) => ({ ...f, unlockAt: e.target.value }))}
          />
          <Button type="submit" className="w-full" loading={saving} disabled={!form.recipientUsername}>
            Send Note
          </Button>
        </form>
      </Modal>

      <Modal open={Boolean(viewNote)} onClose={() => setViewNote(null)}>
        {viewNote && (
          <div className="text-center py-2">
            {viewNote.locked ? (
              <>
                <div className="text-4xl mb-3">🔒</div>
                <p className="text-sm text-white/50">
                  This note unlocks on {new Date(viewNote.unlockAt).toLocaleString()}
                </p>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-3xl mb-3">💌</div>
                <h3 className="font-display text-xl mb-3">{viewNote.title}</h3>
                {viewNote.imageUrl && <img src={mediaUrl(viewNote.imageUrl)} className="rounded-xl mb-3 max-h-56 mx-auto" alt="" />}
                <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{viewNote.message}</p>
              </motion.div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
