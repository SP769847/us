import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import { useConnections } from '../hooks/useConnections.js';
import ConnectionPicker from '../components/ConnectionPicker.jsx';
import { Input, Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const CATEGORIES = [
  { value: 'SAD', label: "When you're sad", icon: '😔' },
  { value: 'MISS_ME', label: 'When you miss me', icon: '🥺' },
  { value: 'ANGRY', label: "When you're angry", icon: '😤' },
  { value: 'CANT_SLEEP', label: "When you can't sleep", icon: '🌙' },
  { value: 'NEED_LOVE', label: 'When you need a little love', icon: '🥰' },
  { value: 'MOTIVATION', label: 'When you need motivation', icon: '💪' },
];

export default function ReadThisWhen() {
  const connections = useConnections();
  const [notes, setNotes] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [viewNote, setViewNote] = useState(null);
  const [form, setForm] = useState({ recipientUsername: '', title: '', message: '', category: 'SAD' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/love-notes', { params: { kind: 'READ_THIS_WHEN' } }).then((res) => setNotes(res.data.notes));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/love-notes', { ...form, kind: 'READ_THIS_WHEN' });
      setComposeOpen(false);
      setForm({ recipientUsername: '', title: '', message: '', category: 'SAD' });
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const receivedByCategory = (cat) => (notes || []).filter((n) => n.direction === 'RECEIVED' && n.category === cat);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Read This When… 📖</h1>
          <p className="text-white/40 text-sm">Words waiting for the exact moment you need them.</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>Write One</Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {CATEGORIES.map((c) => {
          const count = receivedByCategory(c.value).length;
          return (
            <button
              key={c.value}
              onClick={() => setSelectedCategory(c.value)}
              className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06] transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-sm font-medium">{c.label}</span>
              </div>
              <span className="text-xs text-white/30">{count}</span>
            </button>
          );
        })}
      </div>

      <Modal open={Boolean(selectedCategory)} onClose={() => setSelectedCategory(null)} title={CATEGORIES.find((c) => c.value === selectedCategory)?.label}>
        <div className="space-y-2">
          {receivedByCategory(selectedCategory).length === 0 ? (
            <EmptyState icon="📖" title="Nothing here yet" />
          ) : (
            receivedByCategory(selectedCategory).map((n) => (
              <button
                key={n.id}
                onClick={() => setViewNote(n)}
                className="w-full text-left bg-white/5 rounded-xl p-3 hover:bg-white/8 transition-colors"
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-white/40">From {n.sender.fullName}</p>
              </button>
            ))
          )}
        </div>
      </Modal>

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Write a Read This When note">
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-xs text-red-300">{error}</p>}
          <ConnectionPicker connections={connections} value={form.recipientUsername} onChange={(v) => setForm((f) => ({ ...f, recipientUsername: v }))} />
          <label className="block">
            <span className="block text-xs font-medium text-white/50 mb-1.5">Category</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setForm((f) => ({ ...f, category: c.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    form.category === c.value ? 'bg-blush-500/20 border-blush-400/40 text-blush-200' : 'bg-white/5 border-white/10 text-white/50'
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </label>
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <Textarea label="Message" rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
          <Button type="submit" className="w-full" loading={saving} disabled={!form.recipientUsername}>
            Save Note
          </Button>
        </form>
      </Modal>

      <Modal open={Boolean(viewNote)} onClose={() => setViewNote(null)}>
        <AnimatePresence>
          {viewNote && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-2">
              <div className="text-3xl mb-3">💕</div>
              <h3 className="font-display text-xl mb-3">{viewNote.title}</h3>
              <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{viewNote.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </div>
  );
}
