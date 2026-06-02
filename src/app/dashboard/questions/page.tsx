"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api, { getMediaURL } from '@/lib/api';
import { Plus, Edit2, Trash2, Filter, Loader2, Save, X, AlertTriangle, CopyPlus, Image as ImageIcon, RotateCcw, Tag } from 'lucide-react';
import BulkAddQuestionsModal from '@/components/BulkAddQuestionsModal';
import Pagination from '@/components/Pagination';
import toast, { Toaster } from 'react-hot-toast';
import { Skeleton, QuestionSkeleton } from '@/components/Skeleton';
import DynamicText from '@/components/DynamicText';


const ITEMS_PER_PAGE = 9;

interface Category {
  _id: string;
  name: string;
}

interface Question {
  _id: string;
  categoryId: string | { _id: string, name: string };
  type: 'mcq' | 'boolean' | 'image' | 'multiple_correct' | 'matching';
  text: string;
  imageUrl?: string;
  options: string[];
  correctAnswerIndex?: number;
  correctAnswerIndices?: number[];
  matchingPairs?: { left: string, right: string }[];
  playCount?: number;
  correctAnswerCount?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  weightage: number;
  timeLimit: number;
  optionImages?: string[];
  isAlternative: boolean;
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#0F172A]"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>}>
      <QuestionsList />
    </Suspense>
  );
}

import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedType, setSelectedType] = useState('all');
  const [selectedIsAlternative, setSelectedIsAlternative] = useState('all');
  const [isFiltersLoaded, setIsFiltersLoaded] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedQuestions, setArchivedQuestions] = useState<Question[]>([]);

  const searchParams = useSearchParams();
  const categoryIdParam = searchParams.get('categoryId');

  const [formData, setFormData] = useState({
    categoryId: '',
    type: 'mcq' as 'mcq' | 'boolean' | 'image' | 'multiple_correct' | 'matching',
    text: '',
    imageUrl: '',
    options: ['', '', '', ''],
    optionImages: ['', '', '', ''],
    correctAnswerIndex: 0,
    correctAnswerIndices: [] as number[],
    matchingPairs: [{ left: '', right: '' }],
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    weightage: 10,
    timeLimit: 30,
    isAlternative: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('questionFilters');
    if (saved) {
      try {
        const filters = JSON.parse(saved);
        setSelectedCategory(filters.categoryId || 'all');
        setSelectedDifficulty(filters.difficulty || 'all');
        setSelectedType(filters.type || 'all');
        setSelectedIsAlternative(filters.isAlternative || 'all');
      } catch (e) {
        console.error('Failed to parse filters', e);
      }
    }
    setIsFiltersLoaded(true);
  }, []);

  useEffect(() => {
    if (categoryIdParam) {
      setSelectedCategory(categoryIdParam);
    }
  }, [categoryIdParam]);

  const fetchData = async (showLoading = true) => {
    if (!isFiltersLoaded) return;
    if (showLoading) setPageLoading(true);
    try {
      if (showArchived) {
        const archivedRes = await api.get('/questions/archived');
        setArchivedQuestions(archivedRes.data);
      } else {
        const [qRes, cRes] = await Promise.all([
          api.get(`/questions?paginated=true&page=${currentPage}&limit=${ITEMS_PER_PAGE}&categoryId=${selectedCategory}&difficulty=${selectedDifficulty}&type=${selectedType}&isAlternative=${selectedIsAlternative}`),
          api.get('/categories')
        ]);
        setQuestions(qRes.data.questions);
        setTotalCount(qRes.data.totalCount);
        setCategories(cRes.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (isFiltersLoaded) {
      fetchData();
      if (!showArchived) {
        localStorage.setItem('questionFilters', JSON.stringify({
          categoryId: selectedCategory,
          difficulty: selectedDifficulty,
          type: selectedType,
          isAlternative: selectedIsAlternative
        }));
      }
    }
  }, [currentPage, selectedCategory, selectedDifficulty, selectedType, selectedIsAlternative, isFiltersLoaded, showArchived]);

  const handleOpenModal = (question: Question | null = null) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        categoryId: typeof question.categoryId === 'string' ? question.categoryId : question.categoryId._id,
        type: question.type || 'mcq',
        text: question.text,
        imageUrl: question.imageUrl || '',
        options: [...question.options],
        optionImages: question.optionImages || ['', '', '', ''],
        correctAnswerIndex: question.correctAnswerIndex ?? 0,
        correctAnswerIndices: question.correctAnswerIndices || [],
        matchingPairs: question.matchingPairs || [{ left: '', right: '' }],
        difficulty: question.difficulty || 'easy',
        weightage: question.weightage ?? 10,
        timeLimit: question.timeLimit ?? 30,
        isAlternative: question.isAlternative || false,
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        categoryId: categories.length > 0 ? categories[0]._id : '',
        type: 'mcq',
        text: '',
        imageUrl: '',
        options: ['', '', '', ''],
        optionImages: ['', '', '', ''],
        correctAnswerIndex: 0,
        correctAnswerIndices: [],
        matchingPairs: [{ left: '', right: '' }],
        difficulty: 'easy',
        weightage: 10,
        timeLimit: 30,
        isAlternative: false,
      });
    }
    setModalOpen(true);
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
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

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    setSubmitting(true);
    try {
      const { data } = await api.post('/upload', formDataUpload, {
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

  const uploadOptionImage = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
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

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    setSubmitting(true);
    try {
      const { data } = await api.post('/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const newOptionImages = [...formData.optionImages];
      newOptionImages[index] = data.image;
      setFormData(prev => ({ ...prev, optionImages: newOptionImages }));
      toast.success(`Option ${String.fromCharCode(65 + index)} image uploaded`);
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
    if (formData.type === 'image' && !formData.imageUrl) {
      toast.error('Please upload a question image for Image Question type');
      return;
    }
    if (!formData.text.trim() && !formData.imageUrl) {
      toast.error('Please enter question text or upload an image');
      return;
    }
    if (formData.text.trim() && formData.text.trim().length < 5) {
      toast.error('Question text must be at least 5 characters');
      return;
    }
    if (formData.text.trim().length > 500) {
      toast.error('Question text must be less than 500 characters');
      return;
    }
    if (['mcq', 'image', 'boolean', 'multiple_correct'].includes(formData.type)) {
      const filledOptions = formData.options.map((opt, idx) => ({
        text: opt.trim(),
        image: formData.optionImages?.[idx]?.trim() || '',
        index: idx
      })).filter(o => o.text || o.image);

      if (formData.type === 'boolean') {
        if (filledOptions.length < 2) {
          toast.error('Boolean questions must have both True and False options');
          return;
        }
      } else if (filledOptions.length < 2) {
        toast.error('Please fill in at least 2 options');
        return;
      }

      // Check if correct answer points to a filled option
      if (formData.type === 'multiple_correct') {
        const invalidIndices = formData.correctAnswerIndices.filter(idx =>
          !filledOptions.some(o => o.index === idx)
        );
        if (invalidIndices.length > 0) {
          toast.error('One or more selected correct answers point to an empty option');
          return;
        }
      } else {
        if (!filledOptions.some(o => o.index === formData.correctAnswerIndex)) {
          toast.error('The selected correct answer points to an empty option');
          return;
        }
      }
    }

    if (formData.type === 'multiple_correct') {
      if (formData.correctAnswerIndices.length < 2) {
        toast.error('Please select at least 2 correct answers for multiple correct type');
        return;
      }
    }

    if (formData.type === 'matching') {
      const emptyPair = formData.matchingPairs.some(p => !p.left.trim() || !p.right.trim());
      if (emptyPair) {
        toast.error('Please fill in all matching pairs');
        return;
      }
    }

    if (!formData.text.trim() && !formData.imageUrl) {
      toast.error('Question must have text or image');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...formData,
      text: formData.text.trim()
    };
    try {
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion._id}`, payload);
        toast.success('Question updated');
      } else {
        await api.post('/questions', payload);
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
      if (showArchived) {
        await api.delete(`/questions/${questionToDelete._id}/permanent`);
        toast.success('Question permanently deleted');
      } else {
        await api.delete(`/questions/${questionToDelete._id}`);
        toast.success('Question moved to archive');
      }
      fetchData();
      setDeleteModalOpen(false);
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.put(`/questions/${id}/restore`);
      toast.success('Question restored');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore question');
    }
  };

  const filteredQuestions = questions; // Filtering is now handled by backend

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedQuestions = questions;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedDifficulty, selectedType, selectedIsAlternative]);

  return (
    <DashboardLayout>

      <div className="p-8">
        <Toaster position="top-right" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              <DynamicText>Questions Bank</DynamicText>
            </h1>
            <p className="text-text-muted mt-1">
              <DynamicText>Manage and organize your MCQ library</DynamicText>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-5 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all active:scale-95 border ${showArchived
                  ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                  : "bg-surface border-border text-text-muted hover:border-primary/50"
                }`}
            >
              <Tag className="w-5 h-5" />
              <DynamicText>{showArchived ? "View Active" : "View Archive"}</DynamicText>
            </button>
            <button
              onClick={() => setBulkModalOpen(true)}
              className="bg-surface hover:bg-primary/10 text-primary border border-primary/30 px-5 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all active:scale-95 whitespace-nowrap"
            >
              <CopyPlus className="w-5 h-5" />
              <DynamicText>Bulk Add</DynamicText>
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="bg-primary hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <DynamicText>Add Question</DynamicText>
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

          <div className="flex items-center gap-2 text-text-muted ml-4">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Type:</span>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="mcq">MCQ</option>
            <option value="boolean">Boolean</option>
            <option value="image">Image</option>
            <option value="multiple_correct">Multiple Correct</option>
            <option value="matching">Matching</option>
          </select>

          <div className="flex items-center gap-2 text-text-muted ml-4">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Alternative:</span>
          </div>
          <select
            value={selectedIsAlternative}
            onChange={(e) => setSelectedIsAlternative(e.target.value)}
            className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Any Status</option>
            <option value="false">Standard Only</option>
            <option value="true">Alternative Only</option>
          </select>

          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedDifficulty('all');
              setSelectedType('all');
              setSelectedIsAlternative('all');
              localStorage.removeItem('questionFilters');
              setCurrentPage(1);
            }}
            className="ml-2 p-2 text-text-muted hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium border border-transparent hover:border-primary/20 rounded-lg"
            title="Reset all filters"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <div className="flex-1"></div>

          <div className="text-text-muted text-sm font-bold">
            Total: {totalCount}
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
              {(showArchived ? archivedQuestions : questions).map((q) => {
                const categoryData = (typeof q.categoryId === 'object' && q.categoryId !== null) ? q.categoryId as any : null;
                const catName = categoryData ? categoryData.name : categories.find(c => c._id === q.categoryId)?.name || 'Unknown';
                const isCatArchived = categoryData?.isArchived;

                return (
                  <motion.div
                    key={q._id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-surface border rounded-2xl p-6 group transition-all shadow-sm ${showArchived ? "border-amber-500/20 grayscale-[0.5]" : "border-border hover:border-primary/30"
                      }`}
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
                              : q.type === 'multiple_correct'
                                ? 'bg-purple-600/10 text-purple-500 border-purple-600/20'
                                : q.type === 'matching'
                                  ? 'bg-yellow-600/10 text-yellow-500 border-yellow-600/20'
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
                          {q.isAlternative && (
                            <span className="bg-amber-600/10 text-amber-500 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-amber-600/20 flex items-center gap-1">
                              <CopyPlus className="w-3 h-3" />
                              Alternative
                            </span>
                          )}
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
                        {q.type === 'matching' ? (
                          <div className="space-y-2">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">Matching Pairs</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.matchingPairs?.map((pair, idx) => (
                                <div key={idx} className="flex items-center gap-3 px-4 py-2 bg-background border border-border rounded-xl text-sm">
                                  <span className="flex-1 text-foreground font-medium">{pair.left}</span>
                                  <span className="text-primary font-bold">↔</span>
                                  <span className="flex-1 text-foreground font-medium">{pair.right}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, idx) => {
                              const isCorrect = q.type === 'multiple_correct'
                                ? q.correctAnswerIndices?.includes(idx)
                                : idx === q.correctAnswerIndex;

                              return (
                                <div
                                  key={idx}
                                  className={`px-4 py-2 rounded-xl text-sm border transition-colors flex items-center gap-3 ${isCorrect
                                    ? 'bg-green-500/10 border-green-600/30 text-green-700 dark:text-green-400 shadow-sm shadow-green-500/10'
                                    : 'bg-background border-border text-text-muted'
                                    }`}
                                >
                                  <div className="flex-1 py-1 flex items-center">
                                    <span className="font-bold mr-2 whitespace-nowrap">{String.fromCharCode(65 + idx)}.</span>
                                    {q.optionImages?.[idx] && !opt.trim() && (
                                      <img
                                        src={getMediaURL(q.optionImages[idx])}
                                        alt={`Option ${String.fromCharCode(65 + idx)}`}
                                        className="w-10 h-10 rounded-lg object-cover border border-border mr-3"
                                      />
                                    )}
                                    <span className="flex-1">{opt}</span>
                                  </div>
                                  {q.optionImages?.[idx] && opt.trim() && (
                                    <img
                                      src={getMediaURL(q.optionImages[idx])}
                                      alt={`Option ${String.fromCharCode(65 + idx)}`}
                                      className="w-10 h-10 rounded-lg object-cover border border-border ml-3"
                                    />
                                  )}
                                  {isCorrect && <span className="ml-2 text-[10px] font-bold uppercase whitespace-nowrap text-green-600 dark:text-green-400">(Correct)</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {showArchived ? (
                          <>
                            <button
                              onClick={() => handleRestore(q._id)}
                              className={`p-2 rounded-lg transition-colors border flex items-center justify-center ${isCatArchived
                                  ? "text-gray-500 border-gray-500/20 cursor-not-allowed opacity-50"
                                  : "text-green-500 border-green-500/20 hover:bg-green-500/10"
                                }`}
                              title={isCatArchived ? "Restore Category First" : "Restore Question"}
                              disabled={isCatArchived}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setQuestionToDelete(q);
                                setDeleteModalOpen(true);
                              }}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
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
                              className="p-2 text-text-muted hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/20"
                              title="Move to Archive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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

              {!showArchived && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                  totalItems={totalCount}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                  itemLabel="questions"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-8 border-b border-border">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {editingQuestion ? <Edit2 className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-text-muted hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
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
                          const newType = e.target.value as 'mcq' | 'boolean' | 'image' | 'multiple_correct' | 'matching';
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
                        <option value="multiple_correct">Multiple Correct</option>
                        <option value="matching">Matching Type</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-2">
                        Question Image {formData.type === 'image' ? '(Compulsory)' : '(Optional)'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={uploadImage}
                          className="hidden"
                          id="question-image"
                        />
                        <label
                          htmlFor="question-image"
                          className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-text-muted cursor-pointer hover:bg-surface transition-colors flex items-center gap-2 overflow-hidden"
                        >
                          <ImageIcon className="w-5 h-5 shrink-0" />
                          <span className="truncate">{formData.imageUrl ? 'Change Image' : 'Upload Image'}</span>
                        </label>
                        {formData.imageUrl && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-border shrink-0">
                            <img
                              src={getMediaURL(formData.imageUrl)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <input
                      type="checkbox"
                      id="isAlternative"
                      checked={formData.isAlternative}
                      onChange={(e) => setFormData({ ...formData, isAlternative: e.target.checked })}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="isAlternative" className="flex-1 cursor-pointer">
                      <div className="text-sm font-bold text-foreground">Mark as Alternative Question</div>
                      <div className="text-xs text-text-muted">This question will be used for the "Swap" lifeline pool.</div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Question Text</label>
                    <textarea
                      value={formData.text}
                      onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                      placeholder="Enter question text..."
                    />
                  </div>

                  {formData.type !== 'matching' && (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-text-muted">Options {formData.type === 'multiple_correct' ? '(Select all correct answers)' : '(Select the correct answer)'}</label>
                      <div className="grid grid-cols-1 gap-3">
                        {formData.options.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-4 group">
                            {formData.type === 'multiple_correct' ? (
                              <input
                                type="checkbox"
                                checked={formData.correctAnswerIndices.includes(idx)}
                                onChange={() => {
                                  const newIndices = formData.correctAnswerIndices.includes(idx)
                                    ? formData.correctAnswerIndices.filter(i => i !== idx)
                                    : [...formData.correctAnswerIndices, idx];
                                  setFormData({ ...formData, correctAnswerIndices: newIndices });
                                }}
                                className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-background"
                              />
                            ) : (
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={formData.correctAnswerIndex === idx}
                                onChange={() => setFormData({ ...formData, correctAnswerIndex: idx })}
                                className="w-5 h-5 border-border text-primary focus:ring-primary bg-background"
                              />
                            )}
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...formData.options];
                                  newOptions[idx] = e.target.value;
                                  setFormData({ ...formData, options: newOptions });
                                }}
                                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                              />
                              <div className="flex gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => uploadOptionImage(e, idx)}
                                  className="hidden"
                                  id={`option-image-${idx}`}
                                />
                                <label
                                  htmlFor={`option-image-${idx}`}
                                  className="p-3 bg-background border border-border rounded-xl text-text-muted cursor-pointer hover:bg-surface transition-colors flex items-center justify-center shrink-0"
                                  title="Upload Option Image"
                                >
                                  <ImageIcon className="w-5 h-5" />
                                </label>
                                {formData.optionImages[idx] && (
                                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-border shrink-0">
                                    <img
                                      src={getMediaURL(formData.optionImages[idx])}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.type === 'matching' && (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-text-muted">Matching Pairs</label>
                      {formData.matchingPairs.map((pair, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={pair.left}
                            onChange={(e) => {
                              const newPairs = formData.matchingPairs.map((p, i) =>
                                i === idx ? { ...p, left: e.target.value } : p
                              );
                              setFormData({ ...formData, matchingPairs: newPairs });
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Match A"
                          />
                          <span className="text-text-muted">↔</span>
                          <input
                            type="text"
                            value={pair.right}
                            onChange={(e) => {
                              const newPairs = formData.matchingPairs.map((p, i) =>
                                i === idx ? { ...p, right: e.target.value } : p
                              );
                              setFormData({ ...formData, matchingPairs: newPairs });
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Match B"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPairs = formData.matchingPairs.filter((_, i) => i !== idx);
                              setFormData({ ...formData, matchingPairs: newPairs });
                            }}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, matchingPairs: [...formData.matchingPairs, { left: '', right: '' }] })}
                        className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl py-3 flex items-center justify-center gap-2 text-text-muted hover:text-primary transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add Pair
                      </button>
                    </div>
                  )}

                  {/* Translations removed - will be handled by AI dynamically */}
                </div>

                <div className="flex gap-4 p-8 border-t border-border bg-surface rounded-b-2xl">
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
