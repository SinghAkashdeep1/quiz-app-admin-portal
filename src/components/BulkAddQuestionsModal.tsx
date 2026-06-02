"use client";

import { useState } from 'react';
import { Plus, Trash2, Loader2, Save, X, CopyPlus, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
}

interface BulkQuestion {
  id: string;
  categoryId: string;
  type: 'mcq' | 'boolean' | 'image' | 'multiple_correct' | 'matching';
  text: string;
  imageUrl?: string;
  options: string[];
  optionImages: string[];
  correctAnswerIndex?: number;
  correctAnswerIndices?: number[];
  matchingPairs?: { left: string, right: string }[];
  difficulty: 'easy' | 'medium' | 'hard';
  isAlternative: boolean;
  collapsed: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
}

const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const emptyQuestion = (
  categoryId: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'easy',
  isAlternative: boolean = false
): BulkQuestion => ({
  id: generateId(),
  categoryId,
  type: 'mcq',
  text: '',
  imageUrl: '',
  options: ['', '', '', ''],
  optionImages: ['', '', '', ''],
  correctAnswerIndex: 0,
  correctAnswerIndices: [],
  matchingPairs: [{ left: '', right: '' }],
  difficulty,
  isAlternative,
  collapsed: false,
});

export default function BulkAddQuestionsModal({ open, onClose, categories, onSuccess }: Props) {
  const defaultCat = categories.length > 0 ? categories[0]._id : '';
  const [questions, setQuestions] = useState<BulkQuestion[]>([
    emptyQuestion(defaultCat),
    emptyQuestion(defaultCat),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [globalCategory, setGlobalCategory] = useState(defaultCat);
  const [useGlobalCategory, setUseGlobalCategory] = useState(true);
  const [globalDifficulty, setGlobalDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [useGlobalDifficulty, setUseGlobalDifficulty] = useState(true);
  const [globalIsAlternative, setGlobalIsAlternative] = useState(false);

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      emptyQuestion(
        useGlobalCategory ? globalCategory : defaultCat,
        useGlobalDifficulty ? globalDifficulty : 'easy',
        globalIsAlternative
      )
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) {
      toast.error('You need at least one question');
      return;
    }
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateOption = (id: string, optIdx: number, value: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      const newOptions = [...q.options];
      newOptions[optIdx] = value;
      return { ...q, options: newOptions };
    }));
  };

  const toggleCollapse = (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, collapsed: !q.collapsed } : q));
  };

  const uploadBulkImage = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(file.type) && fileExt !== 'svg') {
      toast.error('Only JPG, PNG and SVG are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setSubmitting(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      updateQuestion(id, 'imageUrl', data.image);
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadBulkOptionImage = async (id: string, optIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(file.type) && fileExt !== 'svg') {
      toast.error('Only JPG, PNG and SVG are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setSubmitting(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setQuestions(prev => prev.map(q => {
        if (q.id !== id) return q;
        const newOptionImages = [...q.optionImages];
        newOptionImages[optIdx] = data.image;
        return { ...q, optionImages: newOptionImages };
      }));

      toast.success('Option image uploaded');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGlobalCategoryChange = (catId: string) => {
    setGlobalCategory(catId);
    if (useGlobalCategory) {
      setQuestions(prev => prev.map(q => ({ ...q, categoryId: catId })));
    }
  };

  const handleGlobalDifficultyChange = (diff: 'easy' | 'medium' | 'hard') => {
    setGlobalDifficulty(diff);
    if (useGlobalDifficulty) {
      setQuestions(prev => prev.map(q => ({ ...q, difficulty: diff })));
    }
  };

  const handleGlobalIsAlternativeChange = (val: boolean) => {
    setGlobalIsAlternative(val);
    setQuestions(prev => prev.map(q => ({ ...q, isAlternative: val })));
  };

  const handleSubmit = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.categoryId) {
        toast.error(`Question ${i + 1}: Please select a category`);
        return;
      }
      if (q.type === 'image' && !q.imageUrl?.trim()) {
        toast.error(`Question ${i + 1}: Please upload a question image for Image Question type`);
        return;
      }
      if (!q.text.trim() && !q.imageUrl?.trim()) {
        toast.error(`Question ${i + 1}: Please enter text or upload an image`);
        return;
      }
      if (q.type === 'multiple_correct' && (!q.correctAnswerIndices || q.correctAnswerIndices.length < 2)) {
        toast.error(`Question ${i + 1}: Please select at least 2 correct answers`);
        return;
      }
      if (q.type === 'matching' && (!q.matchingPairs || q.matchingPairs.some(p => !p.left.trim() || !p.right.trim()))) {
        toast.error(`Question ${i + 1}: Please fill in all matching pairs`);
        return;
      }
      if (q.type !== 'matching') {
        const emptyOpt = q.options.findIndex((o, optIdx) => {
          const hasText = o.trim().length > 0;
          const hasImage = q.optionImages?.[optIdx]?.trim()?.length > 0;
          const isRequired = q.type !== 'boolean' || optIdx < 2;
          return isRequired && !hasText && !hasImage;
        });

        if (emptyOpt !== -1) {
          toast.error(`Question ${i + 1}: Please fill text or upload an image for Option ${String.fromCharCode(65 + emptyOpt)}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = questions.map(q => ({
        categoryId: q.categoryId,
        type: q.type,
        text: q.text,
        imageUrl: q.imageUrl,
        options: q.type === 'boolean' ? q.options.slice(0, 2) : q.options,
        optionImages: q.optionImages,
        correctAnswerIndex: q.correctAnswerIndex,
        correctAnswerIndices: q.correctAnswerIndices,
        matchingPairs: q.matchingPairs,
        difficulty: q.difficulty,
        isAlternative: q.isAlternative,
      }));
      const res = await api.post('/questions/bulk', { questions: payload });
      toast.success(`${res.data.count} questions added successfully!`);
      onSuccess();
      onClose();
      // Reset
      setQuestions([
        emptyQuestion(defaultCat, globalDifficulty),
        emptyQuestion(defaultCat, globalDifficulty)
      ]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk add failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-surface border border-border rounded-2xl shadow-2xl relative my-8"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface border-b border-border rounded-t-2xl px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CopyPlus className="w-6 h-6 text-primary" />
              Bulk Add Questions
            </h2>
            <p className="text-text-muted text-sm mt-1">Add {questions.length} question{questions.length !== 1 ? 's' : ''} at once</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-foreground transition-colors p-2 rounded-lg hover:bg-background"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Global category toggle */}
        <div className="px-8 py-4 bg-primary/5 border-b border-border">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useGlobalCategory}
                onChange={(e) => {
                  setUseGlobalCategory(e.target.checked);
                  if (e.target.checked) {
                    setQuestions(prev => prev.map(q => ({ ...q, categoryId: globalCategory })));
                  }
                }}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
              />
              <span className="text-sm font-medium text-foreground">Same category for all</span>
            </label>
            {useGlobalCategory && (
              <select
                value={globalCategory}
                onChange={(e) => handleGlobalCategoryChange(e.target.value)}
                className="bg-background border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            )}

            <div className="w-px h-6 bg-border mx-2 hidden md:block"></div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useGlobalDifficulty}
                onChange={(e) => {
                  setUseGlobalDifficulty(e.target.checked);
                  if (e.target.checked) {
                    setQuestions(prev => prev.map(q => ({ ...q, difficulty: globalDifficulty })));
                  }
                }}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
              />
              <span className="text-sm font-medium text-foreground">Same difficulty for all</span>
            </label>
            {useGlobalDifficulty && (
              <select
                value={globalDifficulty}
                onChange={(e) => handleGlobalDifficultyChange(e.target.value as any)}
                className="bg-background border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            )}

            <div className="w-px h-6 bg-border mx-2 hidden md:block"></div>

            <label className="flex items-center gap-2 cursor-pointer bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
              <input
                type="checkbox"
                checked={globalIsAlternative}
                onChange={(e) => handleGlobalIsAlternativeChange(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
              />
              <span className="text-sm font-bold text-primary">Set all as Alternative</span>
            </label>
          </div>
        </div>

        {/* Questions list */}
        <div className="px-8 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <AnimatePresence>
            {questions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-background border border-border rounded-xl overflow-hidden"
              >
                {/* Question header row */}
                <div className="flex items-center justify-between px-5 py-3 bg-background border-b border-border">
                  <button
                    onClick={() => toggleCollapse(q.id)}
                    className="flex items-center gap-2 text-foreground font-semibold text-sm hover:text-primary transition-colors"
                  >
                    {q.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">
                      Q{idx + 1}
                    </span>
                    <span className="text-text-muted font-normal truncate max-w-[300px]">
                      {q.text || 'Untitled question'}
                    </span>
                  </button>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Remove question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Collapsible body */}
                {!q.collapsed && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {!useGlobalCategory && (
                        <div>
                          <label className="block text-xs font-medium text-text-muted mb-1">Category</label>
                          <select
                            value={q.categoryId}
                            onChange={(e) => updateQuestion(q.id, 'categoryId', e.target.value)}
                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="" disabled>Select category</option>
                            {categories.map(cat => (
                              <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {!useGlobalDifficulty && (
                        <div>
                          <label className="block text-xs font-medium text-text-muted mb-1">Difficulty</label>
                          <select
                            value={q.difficulty}
                            onChange={(e) => updateQuestion(q.id, 'difficulty', e.target.value)}
                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id={`alt-${q.id}`}
                          checked={q.isAlternative}
                          onChange={(e) => updateQuestion(q.id, 'isAlternative', e.target.checked)}
                          className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary"
                        />
                        <label htmlFor={`alt-${q.id}`} className="text-xs font-medium text-foreground cursor-pointer">
                          Alternative Question
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Type</label>
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const newType = e.target.value as 'mcq' | 'boolean' | 'image' | 'multiple_correct' | 'matching';
                            let newOptions = [...q.options];
                            let newCorrectIndex = q.correctAnswerIndex;
                            if (newType === 'boolean') {
                              newOptions = ['True', 'False', '', ''];
                              if (newCorrectIndex > 1) newCorrectIndex = 0;
                            }
                            updateQuestion(q.id, 'type', newType);
                            updateQuestion(q.id, 'options', newOptions);
                            updateQuestion(q.id, 'correctAnswerIndex', newCorrectIndex);
                          }}
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="mcq">MCQ</option>
                          <option value="boolean">Boolean</option>
                          <option value="image">Image</option>
                          <option value="multiple_correct">Multiple Correct</option>
                          <option value="matching">Matching</option>
                        </select>
                      </div>

                      {q.type === 'image' && (
                        <div>
                          <label className="block text-xs font-medium text-text-muted mb-1">Question Image</label>
                          <div className="flex items-center gap-3">
                            {q.imageUrl && (
                              <img
                                src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}${q.imageUrl}`}
                                alt="Preview"
                                className="w-9 h-9 rounded-lg object-cover border border-border"
                              />
                            )}
                            <label className="flex-1 cursor-pointer bg-surface border border-border border-dashed hover:border-primary/50 rounded-lg px-3 py-2 text-center transition-colors">
                              <span className="text-xs text-text-muted">
                                {submitting ? '...' : q.imageUrl ? 'Change' : 'Upload'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => uploadBulkImage(q.id, e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Question text */}
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Question Text</label>
                      <textarea
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[70px] resize-none"
                        placeholder="Enter your question..."
                      />
                    </div>

                    {q.type !== 'matching' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, optIdx) => (
                          q.type === 'boolean' && optIdx > 1 ? null : (
                            <div key={optIdx} className="flex gap-2 items-center">
                              {q.type === 'multiple_correct' ? (
                                <input
                                  type="checkbox"
                                  checked={q.correctAnswerIndices?.includes(optIdx)}
                                  onChange={(e) => {
                                    const currentIndices = q.correctAnswerIndices || [];
                                    const newIndices = e.target.checked
                                      ? [...currentIndices, optIdx]
                                      : currentIndices.filter(i => i !== optIdx);
                                    updateQuestion(q.id, 'correctAnswerIndices', newIndices);
                                  }}
                                  className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary flex-shrink-0"
                                />
                              ) : (
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correctAnswerIndex === optIdx}
                                  onChange={() => updateQuestion(q.id, 'correctAnswerIndex', optIdx)}
                                  className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary flex-shrink-0"
                                />
                              )}
                              <input
                                type="text"
                                value={opt}
                                readOnly={q.type === 'boolean'}
                                onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                className={`flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary ${q.type === 'boolean' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              />
                              {q.type === 'image' && (
                                <div className="flex items-center gap-2">
                                  {q.optionImages[optIdx] && (
                                    <img
                                      src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}${q.optionImages[optIdx]}`}
                                      alt={`Option ${optIdx} Preview`}
                                      className="w-8 h-8 rounded-lg object-cover border border-border"
                                    />
                                  )}
                                  <label className="cursor-pointer bg-surface border border-border border-dashed hover:border-primary/50 rounded-lg p-1.5 text-center transition-colors">
                                    <ImageIcon className="w-4 h-4 text-text-muted" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => uploadBulkOptionImage(q.id, optIdx, e)}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    {q.type === 'matching' && (
                      <div className="space-y-3">
                        {q.matchingPairs?.map((pair, pIdx) => (
                          <div key={pIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={pair.left}
                              onChange={(e) => {
                                const newPairs = (q.matchingPairs || []).map((p, i) =>
                                  i === pIdx ? { ...p, left: e.target.value } : p
                                );
                                updateQuestion(q.id, 'matchingPairs', newPairs);
                              }}
                              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Item A"
                            />
                            <span className="text-text-muted">↔</span>
                            <input
                              type="text"
                              value={pair.right}
                              onChange={(e) => {
                                const newPairs = (q.matchingPairs || []).map((p, i) =>
                                  i === pIdx ? { ...p, right: e.target.value } : p
                                );
                                updateQuestion(q.id, 'matchingPairs', newPairs);
                              }}
                              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Match B"
                            />
                            <button
                              onClick={() => {
                                const newPairs = (q.matchingPairs || []).filter((_, i) => i !== pIdx);
                                updateQuestion(q.id, 'matchingPairs', newPairs);
                              }}
                              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => updateQuestion(q.id, 'matchingPairs', [...(q.matchingPairs || []), { left: '', right: '' }])}
                          className="w-full border border-dashed border-border hover:border-primary/40 rounded-lg py-2 flex items-center justify-center gap-2 text-text-muted hover:text-primary transition-all text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Pair
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add more button */}
          <button
            onClick={addQuestion}
            className="w-full border-2 border-dashed border-border hover:border-primary/40 rounded-xl py-4 flex items-center justify-center gap-2 text-text-muted hover:text-primary transition-all group"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Add Another Question</span>
          </button>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface border-t border-border rounded-b-2xl px-8 py-5 flex items-center justify-between">
          <p className="text-text-muted text-sm">
            {questions.length} question{questions.length !== 1 ? 's' : ''} ready
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="bg-background hover:bg-surface text-text-muted font-semibold px-6 py-2.5 rounded-xl transition-all border border-border"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary hover:opacity-90 text-white font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save All Questions
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
