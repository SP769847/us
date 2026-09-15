import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import { Input, Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const MILESTONES = [
  { value: 'FIRST_CONVERSATION', label: 'First conversation', icon: '💬' },
  { value: 'FIRST_MEETING', label: 'First meeting', icon: '👋' },
  { value: 'FIRST_DATE', label: 'First date', icon: '🌹' },
  { value: 'ANNIVERSARY', label: 'Anniversary', icon: '💍' },
  { value: 'BIRTHDAY', label: 'Birthday', icon: '🎂' },
  { value: 'SPECIAL_DAY', label: 'Special day', icon: '✨' },
  { value: 'FAVOURITE_MEMORY', label: 'Favourite memory', icon: '💖' },
  { value: 'CUSTOM', label: 'Custom', icon: '📌' },
];

function iconFor(type) {
  return MILESTONES.find((m) => m.value === type)?.icon || '📌';
}

export default function Timeline() {
  const [events, setEvents] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', eventDate: '', milestoneType: 'CUSTOM' });
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/timeline').then((res) => setEvents(res.data.events));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (image) data.append('image', image);
      await api.post('/timeline', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setComposeOpen(false);
      setForm({ title: '', description: '', eventDate: '', milestoneType: 'CUSTOM' });
      setImage(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this milestone?')) return;
    await api.delete(`/timeline/${id}`);
    load();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl">Our Timeline ❤️</h1>
          <p className="text-white/40 text-sm">Every milestone, in order.</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>Add Milestone</Button>
      </div>

      {events === null ? null : events.length === 0 ? (
        <EmptyState icon="⏳" title="Your timeline is empty" subtitle="Add your first milestone together." />
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-blush-400/40 via-plum-400/30 to-transparent" />
          {events.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative mb-8"
            >
              <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-ink-950 border-2 border-blush-400/60 flex items-center justify-center text-xs">
                {iconFor(ev.milestoneType)}
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/35 mb-1">{new Date(ev.eventDate).toLocaleDateString()}</p>
                    <h3 className="font-medium text-sm">{ev.title}</h3>
                  </div>
                  <button onClick={() => remove(ev.id)} className="text-white/25 hover:text-red-300 text-xs shrink-0">
                    delete
                  </button>
                </div>
                {ev.imageUrl && <img src={ev.imageUrl} alt="" className="rounded-xl mt-3 max-h-48 w-full object-cover" />}
                {ev.description && <p className="text-xs text-white/50 mt-2 leading-relaxed">{ev.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Add a Milestone">
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-xs text-red-300">{error}</p>}
          <label className="block">
            <span className="block text-xs font-medium text-white/50 mb-1.5">Type</span>
            <div className="flex flex-wrap gap-2">
              {MILESTONES.map((m) => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setForm((f) => ({ ...f, milestoneType: m.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    form.milestoneType === m.value ? 'bg-blush-500/20 border-blush-400/40 text-blush-200' : 'bg-white/5 border-white/10 text-white/50'
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </label>
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <Input label="Date" type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} required />
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <label className="block">
            <span className="block text-xs font-medium text-white/50 mb-1.5">Image (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="block w-full text-xs text-white/50 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/8 file:text-white/70 file:text-xs hover:file:bg-white/14"
            />
          </label>
          <Button type="submit" className="w-full" loading={saving}>
            Add to Timeline
          </Button>
        </form>
      </Modal>
    </div>
  );
}
