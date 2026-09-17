import { useCallback, useState } from 'react';
import api, { extractErrorMessage } from '../services/api.js';
import { isAgeConfirmed } from '../utils/questionCategories.js';

// Shared engine behind the Questions page and the mobile Surprise bottom
// sheet: category selection, random fetch with "don't repeat" exclusion, and
// the 18+ age gate handshake.
export function useSurpriseQuestion() {
  const [category, setCategory] = useState(null); // null = "Surprise Me" (any category)
  const [question, setQuestion] = useState(null);
  const [seen, setSeen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingCategory, setPendingCategory] = useState(null);

  const fetchQuestion = useCallback(async (cat, excludeList) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/questions/random', {
        params: { category: cat || undefined, exclude: excludeList.length ? excludeList.join(',') : undefined },
      });
      setQuestion(data.question);
      setSeen((prev) => [...prev, data.question.id]);
    } catch (err) {
      setQuestion(null);
      setError(extractErrorMessage(err, 'Could not load a question right now'));
    } finally {
      setLoading(false);
    }
  }, []);

  const selectCategory = useCallback(
    (cat) => {
      if (cat === 'NAUGHTY_18' && !isAgeConfirmed()) {
        setPendingCategory(cat);
        return;
      }
      setCategory(cat);
      setSeen([]);
      fetchQuestion(cat, []);
    },
    [fetchQuestion]
  );

  const surpriseMe = useCallback(() => {
    setCategory(null);
    setSeen([]);
    fetchQuestion(null, []);
  }, [fetchQuestion]);

  const next = useCallback(() => {
    fetchQuestion(category, seen);
  }, [category, seen, fetchQuestion]);

  const confirmAgeGate = useCallback(() => {
    const cat = pendingCategory;
    setPendingCategory(null);
    if (cat) selectCategory(cat);
  }, [pendingCategory, selectCategory]);

  const cancelAgeGate = useCallback(() => setPendingCategory(null), []);

  const reset = useCallback(() => {
    setQuestion(null);
    setCategory(null);
    setSeen([]);
    setError('');
  }, []);

  return {
    category,
    question,
    loading,
    error,
    selectCategory,
    surpriseMe,
    next,
    reset,
    ageGateOpen: Boolean(pendingCategory),
    confirmAgeGate,
    cancelAgeGate,
  };
}
