import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import { mediaUrl } from '../utils/media.js';
import { Input, Textarea } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { SkeletonList } from '../components/ui/Skeleton.jsx';

export default function Memories() {
  const [memories, setMemories] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [viewMemory, setViewMemory] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', location: '', eventDate: '' });
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/memories').then((res) => setMemories(res.data.memories));

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
      photos.forEach((p) => data.append('photos', p));
      await api.post('/memories', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setComposeOpen(false);
      setForm({ title: '', description: '', location: '', eventDate: '' });
      setPhotos([]);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this memory?')) return;
    await api.delete(`/memories/${id}`);
    setViewMemory(null);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Memories 📸</h1>
          <p className="text-white/40 text-sm">The moments worth keeping.</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>Add Memory</Button>
      </div>

      {memories === null ? (
        <SkeletonList count={4} className="h-40" />
      ) : memories.length === 0 ? (
        <EmptyState icon="📸" title="No memories yet" subtitle="Save the moments that matter." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setViewMemory(m)}
              className="glass rounded-2xl overflow-hidden text-left hover:bg-white/[0.06] transition-colors"
            >
              {m.photos[0] ? (
                <img src={mediaUrl(m.photos[0])} alt="" className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-blush-500/15 to-plum-500/15 flex items-center justify-center text-3xl">
                  📸
                </div>
              )}
              <div className="p-4">
                <h3 className="text-sm font-medium truncate">{m.title}</h3>
                <p className="text-xs text-white/40 mt-1">{new Date(m.eventDate).toLocaleDateString()}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Add a Memory">
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-xs text-red-300">{error}</p>}
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Location (optional)" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <Input label="Date" type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} required />
          <label className="block">
            <span className="block text-xs font-medium text-white/50 mb-1.5">Photos (optional)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files || []))}
              className="block w-full text-xs text-white/50 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/8 file:text-white/70 file:text-xs hover:file:bg-white/14"
            />
          </label>
          <Button type="submit" className="w-full" loading={saving}>
            Save Memory
          </Button>
        </form>
      </Modal>

      <Modal open={Boolean(viewMemory)} onClose={() => setViewMemory(null)}>
        {viewMemory && (
          <div>
            {viewMemory.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mb-4 -mx-1 px-1 scrollbar-none">
                {viewMemory.photos.map((p, i) => (
                  <img key={i} src={mediaUrl(p)} alt="" className="h-40 rounded-xl object-cover shrink-0" />
                ))}
              </div>
            )}
            <h3 className="font-display text-xl mb-1">{viewMemory.title}</h3>
            <p className="text-xs text-white/40 mb-3">
              {new Date(viewMemory.eventDate).toLocaleDateString()} {viewMemory.location && `· ${viewMemory.location}`}
            </p>
            {viewMemory.description && <p className="text-sm text-white/70 leading-relaxed mb-5">{viewMemory.description}</p>}
            <Button variant="danger" size="sm" onClick={() => remove(viewMemory.id)}>
              Delete Memory
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
