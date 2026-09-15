import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api, { extractErrorMessage } from '../services/api.js';
import { Input } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function SpecialDates() {
  const [dates, setDates] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', isRecurringYearly: true });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/special-dates').then((res) => setDates(res.data.specialDates));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/special-dates', form);
      setComposeOpen(false);
      setForm({ title: '', date: '', isRecurringYearly: true });
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await api.delete(`/special-dates/${id}`);
    load();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Special Dates 📅</h1>
          <p className="text-white/40 text-sm">Never miss what matters.</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>Add Date</Button>
      </div>

      {dates === null ? null : dates.length === 0 ? (
        <EmptyState icon="📅" title="No special dates yet" />
      ) : (
        <div className="space-y-3">
          {dates.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium text-sm">{d.title}</h3>
                <p className="text-xs text-white/40 mt-1">
                  {new Date(d.nextOccurrence).toLocaleDateString()} {d.isRecurringYearly && '· yearly'}
                </p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-display text-xl text-blush-300">{d.daysUntil}</p>
                  <p className="text-[10px] text-white/30">days</p>
                </div>
                <button onClick={() => remove(d.id)} className="text-white/25 hover:text-red-300 text-xs">
                  delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Add a Special Date">
        <form onSubmit={submit} className="space-y-4">
          {error && <p className="text-xs text-red-300">{error}</p>}
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input
              type="checkbox"
              checked={form.isRecurringYearly}
              onChange={(e) => setForm((f) => ({ ...f, isRecurringYearly: e.target.checked }))}
              className="rounded"
            />
            Repeats every year
          </label>
          <Button type="submit" className="w-full" loading={saving}>
            Save Date
          </Button>
        </form>
      </Modal>
    </div>
  );
}
