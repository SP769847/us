import { useEffect, useState } from 'react';
import api, { extractErrorMessage } from '../../services/api.js';
import Button from '../../components/ui/Button.jsx';
import { Input, Textarea } from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import {
  CATEGORY_ORDER,
  categoryMeta,
  NAUGHTY_SUBCATEGORY_ORDER,
  subcategoryMeta,
  INTIMACY_LEVEL_ORDER,
  intimacyLevelMeta,
} from '../../utils/questionCategories.js';

const RESPONSE_TYPES = ['TEXT', 'MULTIPLE_CHOICE', 'YES_NO', 'SCALE_1_10'];

const emptyForm = {
  category: 'ROMANTIC',
  subcategory: '',
  intimacyLevel: '',
  questionText: '',
  responseType: 'TEXT',
  optionsText: '',
  ageRestricted: false,
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState(null);
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    const { data } = await api.get('/admin/questions', {
      params: { q: q || undefined, category: categoryFilter || undefined, active: activeFilter || undefined, limit: 200 },
    });
    setQuestions(data.questions);
  };

  useEffect(() => {
    load();
  }, [categoryFilter, activeFilter]);

  const search = (e) => {
    e.preventDefault();
    load();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (question) => {
    setEditingId(question.id);
    setForm({
      category: question.category,
      subcategory: question.subcategory || '',
      intimacyLevel: question.intimacyLevel || '',
      questionText: question.questionText,
      responseType: question.responseType,
      optionsText: question.options ? question.options.join(', ') : '',
      ageRestricted: question.ageRestricted,
    });
    setFormError('');
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        category: form.category,
        subcategory: form.category === 'NAUGHTY_18' ? form.subcategory || null : null,
        intimacyLevel: form.category === 'NAUGHTY_18' ? form.intimacyLevel || null : null,
        questionText: form.questionText,
        responseType: form.responseType,
        options: form.responseType === 'MULTIPLE_CHOICE' ? form.optionsText.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        ageRestricted: form.category === 'NAUGHTY_18' ? true : form.ageRestricted,
      };
      if (editingId) {
        await api.patch(`/admin/questions/${editingId}`, payload);
      } else {
        await api.post('/admin/questions', payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not save this question'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (question) => {
    if (question.active) {
      await api.delete(`/admin/questions/${question.id}`);
    } else {
      await api.patch(`/admin/questions/${question.id}`, { active: true });
    }
    load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl">Question Bank</h1>
        <Button size="sm" onClick={openCreate}>
          + Add Question
        </Button>
      </div>

      <form onSubmit={search} className="flex flex-col sm:flex-row gap-2.5 mb-6">
        <Input placeholder="Search question text…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
        >
          <option value="" className="bg-ink-900">
            All categories
          </option>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c} className="bg-ink-900">
              {categoryMeta(c).emoji} {categoryMeta(c).label}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
        >
          <option value="true" className="bg-ink-900">
            Active only
          </option>
          <option value="false" className="bg-ink-900">
            Inactive only
          </option>
          <option value="" className="bg-ink-900">
            All
          </option>
        </select>
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
      </form>

      {questions === null ? null : questions.length === 0 ? (
        <EmptyState icon="❓" title="No questions found" />
      ) : (
        <div className="space-y-2">
          {questions.map((question) => (
            <div key={question.id} className={`glass rounded-2xl p-4 ${!question.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/60">
                      {categoryMeta(question.category).emoji} {categoryMeta(question.category).label}
                    </span>
                    {question.subcategory && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/60">{subcategoryMeta(question.subcategory).label}</span>
                    )}
                    {question.intimacyLevel && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/60">{intimacyLevelMeta(question.intimacyLevel)?.label}</span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/60">{question.responseType}</span>
                    {question.ageRestricted && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-plum-500/15 text-plum-300 border border-plum-400/30">18+</span>
                    )}
                    {!question.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-300">Inactive</span>}
                  </div>
                  <p className="text-sm text-white/85">{question.questionText}</p>
                  {question.options && <p className="text-xs text-white/35 mt-1">Options: {question.options.join(' / ')}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => openEdit(question)} className="text-xs text-blush-300 hover:text-blush-200 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => toggleActive(question)} className="text-xs text-white/40 hover:text-white/70 transition-colors">
                    {question.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Question' : 'Add Question'} maxWidth="max-w-lg">
        <form onSubmit={submit} className="space-y-3">
          {formError && <p className="text-xs text-red-300">{formError}</p>}
          <Textarea
            label="Question text"
            rows={2}
            maxLength={500}
            value={form.questionText}
            onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-white/50 mb-1.5">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: '', intimacyLevel: '' }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c} className="bg-ink-900">
                    {categoryMeta(c).emoji} {categoryMeta(c).label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-white/50 mb-1.5">Response type</span>
              <select
                value={form.responseType}
                onChange={(e) => setForm((f) => ({ ...f, responseType: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
              >
                {RESPONSE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-ink-900">
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {form.category === 'NAUGHTY_18' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-medium text-white/50 mb-1.5">Subcategory</span>
                <select
                  value={form.subcategory}
                  onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
                >
                  <option value="" className="bg-ink-900">
                    None
                  </option>
                  {NAUGHTY_SUBCATEGORY_ORDER.map((s) => (
                    <option key={s} value={s} className="bg-ink-900">
                      {subcategoryMeta(s).label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-white/50 mb-1.5">Intimacy level</span>
                <select
                  value={form.intimacyLevel}
                  onChange={(e) => setForm((f) => ({ ...f, intimacyLevel: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blush-400/60"
                >
                  <option value="" className="bg-ink-900">
                    None
                  </option>
                  {INTIMACY_LEVEL_ORDER.map((l) => (
                    <option key={l} value={l} className="bg-ink-900">
                      {intimacyLevelMeta(l).label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {form.responseType === 'MULTIPLE_CHOICE' && (
            <Input
              label="Options (comma-separated)"
              value={form.optionsText}
              onChange={(e) => setForm((f) => ({ ...f, optionsText: e.target.value }))}
              placeholder="Option A, Option B, Option C"
              required
            />
          )}

          {form.category !== 'NAUGHTY_18' && (
            <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ageRestricted}
                onChange={(e) => setForm((f) => ({ ...f, ageRestricted: e.target.checked }))}
                className="accent-blush-500"
              />
              Mark as 18+
            </label>
          )}

          <Button type="submit" loading={saving}>
            {editingId ? 'Save Changes' : 'Add Question'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
