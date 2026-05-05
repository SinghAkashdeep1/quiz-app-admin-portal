"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api, { getMediaURL } from '@/lib/api';
import { Plus, Edit2, Trash2, Filter, Loader2, Save, X, AlertTriangle, CopyPlus } from 'lucide-react';
import BulkAddQuestionsModal from '@/components/BulkAddQuestionsModal';
import Pagination from '@/components/Pagination';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton, QuestionSkeleton } from '@/components/Skeleton';

const ITEMS_PER_PAGE = 9;

interface Category {
  _id: string;
  name: string;
}

interface Question {
  _id: string;
  categoryId: string | { _id: string, name: string };
  type: 'mcq' | 'boolean' | 'image';
  text: string;
  imageUrl?: string;
  options: string[];
  correctAnswerIndex: number;
  playCount?: number;
  correctAnswerCount?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  weightage: number;
  timeLimit: number;
  translations?: {
    [key: string]: {
      text: string;
      options: string[];
    };
  };
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#0F172A]"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>}>
      <QuestionsList />
    </Suspense>
  );
}

function QuestionsList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const searchParams = useSearchParams();
  const categoryIdParam = searchParams.get('categoryId');

  const [formData, setFormData] = useState({
    categoryId: '',
    type: 'mcq' as 'mcq' | 'boolean' | 'image',
    text: '',
    imageUrl: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    weightage: 10,
    timeLimit: 30,
    translations: {
      hi: { text: '', options: ['', '', '', ''] },
      es: { text: '', options: ['', '', '', ''] },
      fr: { text: '', options: ['', '', '', ''] }
    }
  });

  useEffect(() => {
    if (categoryIdParam) {
      setSelectedCategory(categoryIdParam);
    }
    fetchData();
  }, [categoryIdParam]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setPageLoading(true);
    try {
      const [qRes, cRes] = await Promise.all([
        api.get(`/questions?paginated=true&page=${currentPage}&limit=${ITEMS_PER_PAGE}&categoryId=${selectedCategory}&difficulty=${selectedDifficulty}`),
        api.get('/categories')
      ]);
      setQuestions(qRes.data.questions);
      setTotalCount(qRes.data.totalCount);
      setCategories(cRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, selectedCategory, selectedDifficulty]);

  const handleOpenModal = (question: Question | null = null) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        categoryId: typeof question.categoryId === 'string' ? question.categoryId : question.categoryId._id,
        type: question.type || 'mcq',
        text: question.text,
        imageUrl: question.imageUrl || '',
        options: [...question.options],
        correctAnswerIndex: question.correctAnswerIndex,
        difficulty: question.difficulty || 'easy',
        weightage: question.weightage ?? 10,
        timeLimit: question.timeLimit ?? 30,
        translations: question.translations || {
          hi: { text: '', options: ['', '', '', ''] },
          es: { text: '', options: ['', '', '', ''] },
          fr: { text: '', options: ['', '', '', ''] }
        }
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        categoryId: categories.length > 0 ? categories[0]._id : '',
        type: 'mcq',
        text: '',
        imageUrl: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        difficulty: 'easy',
        weightage: 10,
        timeLimit: 30,
        translations: {
          hi: { text: '', options: ['', '', '', ''] },
          es: { text: '', options: ['', '', '', ''] },
          fr: { text: '', options: ['', '', '', ''] }
        }
      });
    }
    setModalOpen(true);
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setSubmitting(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData(prev => ({ ...prev, imageUrl: data.image }));
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.text.trim()) {
      toast.error('Please enter the question text');
      return;
    }
    if (formData.text.trim().length < 5 || formData.text.trim().length > 500) {
      toast.error('Question text must be between 5 and 500 characters');
      return;
    }
    if (formData.type === 'image' && !formData.imageUrl) {
      toast.error('Please upload an image');
      return;
    }
    const emptyOption = formData.options.findIndex(opt => !opt.trim());
    if (emptyOption !== -1) {
      toast.error(`Please fill in Option ${String.fromCharCode(65 + emptyOption)}`);
      return;
    }
    setSubmitting(true);
    try {
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion._id}`, formData);
        toast.success('Question updated');
      } else {
        await api.post('/questions', formData);
        toast.success('Question created');
      }
      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    try {
      await api.delete(`/questions/${questionToDelete._id}`);
      toast.success('Question deleted');
      setQuestions(questions.filter(q => q._id !== questionToDelete._id));
      setDeleteModalOpen(false);
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  const filteredQuestions = questions.filter(q => {
    const categoryMatch = selectedCategory === 'all' ||
      (typeof q.categoryId === 'string' ? q.categoryId : q.categoryId._id) === selectedCategory;

    const difficultyMatch = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;

    return categoryMatch && difficultyMatch;
  });

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedDifficulty]);

  return (
    <DashboardLayout>
      <div className="p-8">
        <Toaster position="top-right" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Questions Bank</h1>
            <p className="text-text-muted mt-1">Manage and organize your MCQ library</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setBulkModalOpen(true)}
              className="bg-surface hover:bg-primary/10 text-primary border border-primary/30 px-5 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all active:scale-95 whitespace-nowrap"
            >
              <CopyPlus className="w-5 h-5" />
              Bulk Add
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="bg-primary hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-text-muted">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Filter by Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-text-muted ml-4">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Difficulty:</span>
          </div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <div className="flex-1"></div>

          <div className="text-text-muted text-sm">
            Showing {filteredQuestions.length} questions
          </div>
        </div>

        {loading ? (
          <QuestionSkeleton />
        ) : (
          <div className="relative">
            {pageLoading && (
              <div className="absolute inset-0 z-20 bg-background/20 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <div className="space-y-4">
              {questions.map((q) => {
                const catName = (typeof q.categoryId === 'object' && q.categoryId !== null)
                  ? (q.categoryId as any).name
                  : categories.find(c => c._id === q.categoryId)?.name || 'Unknown';
                return (
                  <motion.div
                    key={q._id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-surface border border-border rounded-2xl p-6 group hover:border-primary/30 transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-primary/20">
                            {catName}
                          </span>
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${q.difficulty === 'hard'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : q.difficulty === 'medium'
                              ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                              : 'bg-green-500/10 text-green-500 border-green-500/20'
                            }`}>
                            {q.difficulty || 'easy'}
                          </span>
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${q.type === 'boolean'
                            ? 'bg-orange-600/10 text-orange-500 border-orange-600/20'
                            : q.type === 'image'
                              ? 'bg-blue-600/10 text-blue-500 border-blue-600/20'
                              : 'bg-green-600/10 text-green-500 border-green-600/20'
                            }`}>
                            {q.type || 'mcq'}
                          </span>
                          <span className="bg-purple-600/10 text-purple-500 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-purple-600/20">
                            Plays: {q.playCount || 0}
                          </span>
                          <span className="bg-green-600/10 text-green-500 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-green-600/20">
                            Correct: {q.correctAnswerCount || 0}
                          </span>
                        </div>
                        <div className="flex items-start gap-4 mb-4">
                          {q.imageUrl && (
                            <img
                              src={getMediaURL(q.imageUrl)}
                              alt="Question"
                              className="w-16 h-16 rounded-xl object-cover border border-border shadow-sm"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-foreground leading-tight">{q.text}</h3>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt, idx) => (
                            <div
                              key={idx}
                              className={`px-4 py-3 rounded-xl text-sm border transition-colors ${idx === q.correctAnswerIndex
                                ? 'bg-green-500/10 border-green-600/30 text-green-700 dark:text-green-400 shadow-sm shadow-green-500/10'
                                : 'bg-background border-border text-text-muted'
                                }`}
                            >
                              <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                              {idx === q.correctAnswerIndex && <span className="ml-2 text-[10px] font-bold uppercase">(Correct)</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleOpenModal(q)}
                          className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setQuestionToDelete(q);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {questions.length === 0 && (
                <div className="bg-surface border border-dashed border-border rounded-3xl p-12 text-center">
                  <p className="text-text-muted italic">No questions found.</p>
                </div>
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                totalItems={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemLabel="questions"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-8 shadow-2xl relative my-8"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute right-6 top-6 text-text-muted hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                {editingQuestion ? <Edit2 className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Category</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Difficulty Level</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Question Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value as 'mcq' | 'boolean' | 'image';
                        let newOptions = [...formData.options];
                        let newCorrectIndex = formData.correctAnswerIndex;

                        if (newType === 'boolean') {
                          newOptions = ['True', 'False'];
                          if (newCorrectIndex > 1) newCorrectIndex = 0;
                        } else if (formData.type === 'boolean') {
                          newOptions = ['', '', '', ''];
                        }

                        setFormData({
                          ...formData,
                          type: newType,
                          options: newOptions,
                          correctAnswerIndex: newCorrectIndex
                        });
                      }}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="boolean">Boolean</option>
                      <option value="image">Image Question</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    {formData.type === 'image' && (
                      <>
                        <label className="block text-sm font-medium text-text-muted mb-2">Question Image</label>
                        <div className="flex items-center gap-4">
                          {formData.imageUrl && (
                            <img
                              src={getMediaURL(formData.imageUrl)}
                              alt="Preview"
                              className="w-12 h-12 rounded-lg object-cover border border-border"
                            />
                          )}
                          <label className="flex-1 cursor-pointer bg-background border border-border border-dashed hover:border-primary/50 rounded-xl px-4 py-2.5 text-center transition-colors">
                            <span className="text-sm text-text-muted">
                              {submitting ? 'Uploading...' : formData.imageUrl ? 'Change Image' : 'Upload Image'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={uploadImage}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Weightage (Points)</label>
                    <input
                      type="number"
                      value={formData.weightage}
                      onChange={(e) => setFormData({ ...formData, weightage: parseInt(e.target.value) || 0 })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Time Limit (Seconds)</label>
                    <input
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Question Text</label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                    placeholder="Enter your question here..."
                    minLength={5}
                    maxLength={500}
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-text-muted">Options (Select the radio button for correct answer)</label>
                  {formData.options.map((opt, idx) => (
                    formData.type === 'boolean' && idx > 1 ? null : (
                      <div key={idx} className="flex gap-4 items-center">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={formData.correctAnswerIndex === idx}
                          onChange={() => setFormData({ ...formData, correctAnswerIndex: idx })}
                          className="w-5 h-5 text-primary bg-background border-border focus:ring-primary"
                        />
                        <input
                          type="text"
                          value={opt}
                          readOnly={formData.type === 'boolean'}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[idx] = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                          className={`flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary ${formData.type === 'boolean' ? 'opacity-70 cursor-not-allowed' : ''}`}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        />
                      </div>
                    )
                  ))}
                </div>

                <div className="space-y-6 border-t border-border pt-6">
                  <h4 className="text-lg font-bold text-foreground">Translations</h4>
                  {['hi', 'es', 'fr'].map((lang) => (
                    <div key={lang} className="bg-background/50 p-4 rounded-xl border border-border space-y-4">
                      <h5 className="text-sm font-bold text-primary uppercase tracking-wider">
                        {lang === 'hi' ? 'Hindi' : lang === 'es' ? 'Spanish' : 'French'} Translation
                      </h5>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Question Text ({lang.toUpperCase()})</label>
                        <textarea
                          value={(formData.translations as any)[lang]?.text || ''}
                          onChange={(e) => {
                            const newTranslations = { ...formData.translations };
                            (newTranslations as any)[lang].text = e.target.value;
                            setFormData({ ...formData, translations: newTranslations });
                          }}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[60px]"
                          placeholder={`Question in ${lang.toUpperCase()}`}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(formData.translations as any)[lang]?.options?.map((opt: string, idx: number) => (
                           formData.type === 'boolean' && idx > 1 ? null : (
                            <div key={idx}>
                              <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Option {String.fromCharCode(65 + idx)} ({lang.toUpperCase()})</label>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newTranslations = { ...formData.translations };
                                  (newTranslations as any)[lang].options[idx] = e.target.value;
                                  setFormData({ ...formData, translations: newTranslations });
                                }}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder={`Option ${String.fromCharCode(65 + idx)} in ${lang.toUpperCase()}`}
                              />
                            </div>
                           )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-background hover:bg-surface text-text-muted font-semibold py-3 rounded-xl transition-all border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary hover:opacity-90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {editingQuestion ? 'Update Question' : 'Save Question'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-surface border border-border rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Are you sure?</h2>
              <p className="text-text-muted mb-8 truncate px-2">
                Delete: <span className="text-foreground font-bold">"{questionToDelete?.text}"</span>?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 bg-background hover:bg-surface text-text-muted font-semibold py-3 rounded-xl transition-all border border-border"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Add Modal */}
      <BulkAddQuestionsModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        categories={categories}
        onSuccess={fetchData}
      />
    </DashboardLayout>
  );
}
