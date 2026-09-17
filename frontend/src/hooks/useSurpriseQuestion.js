import { useCallback, useState } from 'react';
import api, { extractErrorMessage } from '../services/api.js';
import { isAgeConfirmed } from '../utils/questionCategories.js';

// Shared engine behind the Questions page and the mobile Surprise bottom
// sheet: category selection, random fetch with "don't repeat" exclusion
// (also tracked server-side per user), and the 18+ age gate handshake.
//
// Naughty 18+ opens the "how personal do you want to get?" intimacy-level
// picker by default (the primary spec'd flow); from there users can opt into
// browsing by theme (subcategory) instead.
export function useSurpriseQuestion() {
  const [category, setCategory] = useState(null); // null = "Surprise Me" (any category, preference-driven)
  const [subcategory, setSubcategory] = useState(null);
  const [intimacyLevel, setIntimacyLevel] = useState(null);
  const [question, setQuestion] = useState(null);
  const [seen, setSeen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingCategory, setPendingCategory] = useState(null);
  const [levelPickerOpen, setLevelPickerOpen] = useState(false);
  const [naughtyPickerOpen, setNaughtyPickerOpen] = useState(false);

  const fetchQuestion = useCallback(async (cat, subcat, level, excludeList) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/questions/random', {
        params: {
          category: cat || undefined,
          subcategory: subcat || undefined,
          intimacyLevel: level || undefined,
          exclude: excludeList.length ? excludeList.join(',') : undefined,
        },
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

  const openNaughty = useCallback(() => {
    setCategory('NAUGHTY_18');
    setSubcategory(null);
    setIntimacyLevel(null);
    setQuestion(null);
    setLevelPickerOpen(true);
    setNaughtyPickerOpen(false);
  }, []);

  const selectCategory = useCallback(
    (cat) => {
      if (cat === 'NAUGHTY_18') {
        if (!isAgeConfirmed()) {
          setPendingCategory(cat);
          return;
        }
        openNaughty();
        return;
      }
      setCategory(cat);
      setSubcategory(null);
      setIntimacyLevel(null);
      setLevelPickerOpen(false);
      setNaughtyPickerOpen(false);
      setSeen([]);
      fetchQuestion(cat, null, null, []);
    },
    [fetchQuestion, openNaughty]
  );

  const selectIntimacyLevel = useCallback(
    (level) => {
      setIntimacyLevel(level);
      setSubcategory(null);
      setLevelPickerOpen(false);
      setSeen([]);
      fetchQuestion('NAUGHTY_18', null, level, []);
    },
    [fetchQuestion]
  );

  const browseByTheme = useCallback(() => {
    setLevelPickerOpen(false);
    setNaughtyPickerOpen(true);
  }, []);

  const selectSubcategory = useCallback(
    (subcat) => {
      setSubcategory(subcat);
      setIntimacyLevel(null);
      setNaughtyPickerOpen(false);
      setSeen([]);
      fetchQuestion('NAUGHTY_18', subcat, null, []);
    },
    [fetchQuestion]
  );

  const selectAnyNaughty = useCallback(() => {
    setSubcategory(null);
    setIntimacyLevel(null);
    setNaughtyPickerOpen(false);
    setLevelPickerOpen(false);
    setSeen([]);
    fetchQuestion('NAUGHTY_18', null, null, []);
  }, [fetchQuestion]);

  const surpriseMe = useCallback(() => {
    setCategory(null);
    setSubcategory(null);
    setIntimacyLevel(null);
    setLevelPickerOpen(false);
    setNaughtyPickerOpen(false);
    setSeen([]);
    fetchQuestion(null, null, null, []);
  }, [fetchQuestion]);

  const next = useCallback(() => {
    fetchQuestion(category, subcategory, intimacyLevel, seen);
  }, [category, subcategory, intimacyLevel, seen, fetchQuestion]);

  const confirmAgeGate = useCallback(() => {
    const cat = pendingCategory;
    setPendingCategory(null);
    if (cat) openNaughty();
  }, [pendingCategory, openNaughty]);

  const cancelAgeGate = useCallback(() => setPendingCategory(null), []);

  const backToCategories = useCallback(() => {
    setLevelPickerOpen(false);
    setNaughtyPickerOpen(false);
    setCategory(null);
    setSubcategory(null);
    setIntimacyLevel(null);
    setQuestion(null);
  }, []);

  const reset = useCallback(() => {
    setQuestion(null);
    setCategory(null);
    setSubcategory(null);
    setIntimacyLevel(null);
    setLevelPickerOpen(false);
    setNaughtyPickerOpen(false);
    setSeen([]);
    setError('');
  }, []);

  return {
    category,
    subcategory,
    intimacyLevel,
    question,
    loading,
    error,
    levelPickerOpen,
    naughtyPickerOpen,
    selectCategory,
    selectIntimacyLevel,
    browseByTheme,
    selectSubcategory,
    selectAnyNaughty,
    surpriseMe,
    next,
    reset,
    backToCategories,
    ageGateOpen: Boolean(pendingCategory),
    confirmAgeGate,
    cancelAgeGate,
  };
}
