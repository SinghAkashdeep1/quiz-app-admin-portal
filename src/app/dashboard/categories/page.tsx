"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Plus, Edit2, Trash2, Tag, Loader2, AlertTriangle, X } from 'lucide-react';
import Pagination from '@/components/Pagination';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton, CategorySkeleton } from '@/components/Skeleton';
import DynamicText from '@/components/DynamicText';


const ITEMS_PER_PAGE = 9;

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  isGuestAllowed: boolean;
  maxGuestAttempts: number;
  guestAccess?: {
    easy: boolean;
    medium: boolean;
    hard: boolean;
  };
  guestCreditLimit?: number;
  rewards?: {
    easy: number;
    medium: number;
    hard: number;
  };
  guestHeartsConfig?: {
    maxHearts: number;
    refillCount: number;
    refillCooldownHours: number;
    dailyRefillLimit?: number;
    rewards: {
      easy: number;
      medium: number;
      hard: number;
    };
  };

  lifelines?: {
    aiHints: {
      freePerLevel: number;
      coinCost: number;
    };
    fiftyFifty: {
      freePerLevel: number;
      coinCost: number;
    };
    changeQuestion: {
      freePerLevel: number;
      coinCost: number;
    };
    stopTimer: {
      freePerLevel: number;
      coinCost: number;
    };
  };
}

interface Icon {
  _id: string;
  name: string;
  label: string;
}

export default function CategoriesPage() {

  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [icons, setIcons] = useState<Icon[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedCategories, setArchivedCategories] = useState<Category[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '#3B82F6',
    isGuestAllowed: true,
    maxGuestAttempts: 3,
    guestAccess: {
      easy: true,
      medium: false,
      hard: false,
    },
    guestCreditLimit: 3,
    rewards: {
      easy: 10,
      medium: 20,
      hard: 50
    },
    guestHeartsConfig: {
      maxHearts: 3,
      refillCount: 3,
      refillCooldownHours: 14,
      dailyRefillLimit: 3,
      rewards: {
        easy: 1,
        medium: 2,
        hard: 3
      }
    },

    lifelines: {
      aiHints: { freePerLevel: 1, coinCost: 10 },
      fiftyFifty: { freePerLevel: 1, coinCost: 10 },
      changeQuestion: { freePerLevel: 1, coinCost: 10 },
      stopTimer: { freePerLevel: 1, coinCost: 10 }
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchIcons();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchIcons = async () => {
    try {
      const response = await api.get('/categories/icons');
      setIcons(response.data);
    } catch (error: any) {
      console.error('Failed to fetch icons', error);
      toast.error(error.response?.data?.message || 'Failed to load icons');
    }
  };

  const fetchCategories = async (showLoading = true) => {
    if (showLoading) setPageLoading(true);
    try {
      const response = await api.get(`/categories?paginated=true&page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      setCategories(response.data.categories);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (showArchived) {
      fetchArchivedCategories();
    } else {
      fetchCategories();
    }
  }, [currentPage, showArchived]);

  const fetchArchivedCategories = async () => {
    setPageLoading(true);
    try {
      const response = await api.get('/categories/archived');
      setArchivedCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch archived categories');
    } finally {
      setPageLoading(false);
      setLoading(false);
    }
  };

  const handleOpenModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
        isGuestAllowed: category.isGuestAllowed ?? true,
        maxGuestAttempts: category.maxGuestAttempts ?? 3,
        guestAccess: category.guestAccess || {
          easy: true,
          medium: false,
          hard: false,
        },
        guestCreditLimit: (category as any).guestCreditLimit ?? 3,
        rewards: (category as any).rewards || {
          easy: 10,
          medium: 20,
          hard: 50
        },
        guestHeartsConfig: category.guestHeartsConfig || {
          maxHearts: 3,
          refillCount: 3,
          refillCooldownHours: 14,
          dailyRefillLimit: 3,
          rewards: {
            easy: 1,
            medium: 2,
            hard: 3
          }
        },

        lifelines: category.lifelines || {
          aiHints: { freePerLevel: 1, coinCost: 10 },
          fiftyFifty: { freePerLevel: 1, coinCost: 10 },
          changeQuestion: { freePerLevel: 1, coinCost: 10 },
          stopTimer: { freePerLevel: 1, coinCost: 10 }
        }
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        icon: icons[0]?.name || '',
        color: '#3B82F6',
        isGuestAllowed: true,
        maxGuestAttempts: 3,
        guestAccess: {
          easy: true,
          medium: false,
          hard: false,
        },
        guestCreditLimit: 3,
        rewards: {
          easy: 10,
          medium: 20,
          hard: 50
        },
        guestHeartsConfig: {
          maxHearts: 3,
          refillCount: 3,
          refillCooldownHours: 14,
          dailyRefillLimit: 3,
          rewards: {
            easy: 1,
            medium: 2,
            hard: 3
          }
        },

        lifelines: {
          aiHints: { freePerLevel: 1, coinCost: 10 },
          fiftyFifty: { freePerLevel: 1, coinCost: 10 },
          changeQuestion: { freePerLevel: 1, coinCost: 10 },
          stopTimer: { freePerLevel: 1, coinCost: 10 }
        }
      });
    }
    setDropdownOpen(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    if (formData.name.trim().length < 3 || formData.name.trim().length > 50) {
      toast.error('Category name must be between 3 and 50 characters');
      return;
    }
    if (!formData.icon) {
      toast.error('Please select an icon');
      return;
    }

    // Strict Validation for rewards
    if (Object.values(formData.rewards).some(v => v === null || v === undefined || v === 0)) {
      toast.error('User Coin Rewards cannot be 0 or empty');
      return;
    }

    if (formData.isGuestAllowed) {
      if (formData.guestHeartsConfig.maxHearts <= 0) {
        toast.error('Max Hearts must be greater than 0');
        return;
      }
      if (formData.guestHeartsConfig.refillCount <= 0) {
        toast.error('Refill Count must be greater than 0');
        return;
      }
      if (Object.values(formData.guestHeartsConfig.rewards).some(v => v === null || v === undefined || v === 0)) {
        toast.error('Guest Level Rewards cannot be 0 or empty');
        return;
      }
    }
    setSubmitting(true);
    const payload = {
      ...formData,
      name: formData.name.trim()
    };
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      if (showArchived) {
        await api.delete(`/categories/${categoryToDelete._id}/permanent`);
        toast.success('Category permanently deleted');
        fetchArchivedCategories();
      } else {
        await api.delete(`/categories/${categoryToDelete._id}`);
        toast.success('Category moved to archive');
        fetchCategories();
      }
      setDeleteModalOpen(false);
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.put(`/categories/${id}/restore`);
      toast.success('Category restored');
      fetchArchivedCategories();
    } catch (error) {
      toast.error('Failed to restore category');
    }
  };

  return (
    <DashboardLayout>

      <div className="p-8">
        <Toaster position="top-right" />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              <DynamicText>Quiz Categories</DynamicText>
            </h1>
            <p className="text-text-muted mt-1">
              <DynamicText>Manage themes and categories for your quiz app</DynamicText>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all active:scale-95 border ${
                showArchived 
                ? "bg-amber-500/10 border-amber-500/50 text-amber-500" 
                : "bg-surface border-border text-text-muted hover:border-primary/50"
              }`}
            >
              <Tag className="w-5 h-5" />
              <DynamicText>{showArchived ? "View Active" : "View Archive"}</DynamicText>
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="bg-primary hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <DynamicText>Add Category</DynamicText>
            </button>
          </div>
        </div>

        {loading ? (
          <CategorySkeleton />
        ) : (
          <div className="relative">
            {pageLoading && (
              <div className="absolute inset-0 z-20 bg-background/20 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showArchived ? archivedCategories : categories).map((category) => (
                <motion.div
                  key={category._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-surface border rounded-2xl p-6 group transition-all duration-300 relative overflow-hidden shadow-sm h-48 ${
                    showArchived ? "border-amber-500/20 grayscale-[0.5]" : "border-border hover:border-primary/30"
                  }`}
                >
                  {!showArchived && (
                    <Link
                      href={`/dashboard/questions?categoryId=${category._id}`}
                      className="absolute inset-0 z-0 cursor-pointer"
                    />
                  )}

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner border border-white/5"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      <span className="material-icons text-2xl">{category.icon}</span>
                    </div>
                    <div className="flex gap-2">
                      {showArchived ? (
                        <>
                          <button
                            onClick={() => handleRestore(category._id)}
                            className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors bg-background/50 flex items-center gap-1 text-xs font-bold"
                            title="Restore"
                          >
                            <Plus className="w-4 h-4 rotate-45" /> Restore
                          </button>
                          <button
                            onClick={() => {
                              setCategoryToDelete(category);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors bg-background/50"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenModal(category);
                            }}
                            className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors bg-background/50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCategoryToDelete(category);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 text-text-muted hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors bg-background/50"
                            title="Move to Archive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 pointer-events-none">
                    <h3 className="text-xl font-bold text-foreground mb-1">{category.name}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }}></div>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Theme: {category.color}</span>
                      </div>
                      {showArchived && (
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Archived</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="bg-surface border border-dashed border-border rounded-3xl p-12 text-center">
                <p className="text-text-muted italic">No categories found.</p>
              </div>
            )}

            {!showArchived && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                totalItems={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemLabel="categories"
              />
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-6 top-6 text-text-muted hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h2>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., General Knowledge"
                    minLength={3}
                    maxLength={50}
                  />
                </div>
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-text-muted mb-2">Select Icon</label>
                  <div
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-icons text-primary text-xl">{formData.icon}</span>
                      <span className="capitalize">{icons.find(i => i.name === formData.icon)?.label || 'Select Icon'}</span>
                    </div>
                    <motion.span
                      animate={{ rotate: dropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="material-icons text-text-muted"
                    >
                      expand_more
                    </motion.span>
                  </div>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border rounded-xl shadow-2xl z-[60] py-2 max-h-80 overflow-y-auto custom-scrollbar"
                      >
                        {icons.map((icon) => (
                          <div
                            key={icon._id}
                            onClick={() => {
                              setFormData({ ...formData, icon: icon.name });
                              setDropdownOpen(false);
                            }}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-background cursor-pointer transition-colors ${formData.icon === icon.name ? 'bg-primary/20 text-primary' : 'text-text-muted'}`}
                          >
                            <span className="material-icons text-xl">{icon.name}</span>
                            <span className="font-medium">{icon.label}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Theme Color</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-12 bg-transparent border-none cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-background/50 p-4 rounded-xl border border-border h-[68px] mt-7">
                  <input
                    type="checkbox"
                    id="isGuestAllowed"
                    checked={formData.isGuestAllowed}
                    onChange={(e) => setFormData({ ...formData, isGuestAllowed: e.target.checked })}
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                  <label htmlFor="isGuestAllowed" className="text-sm font-medium text-foreground cursor-pointer">
                    Allow Guest Users
                  </label>
                </div>
              </div>

              {formData.isGuestAllowed && (
                <>
                  <div className="space-y-4 bg-background/50 p-4 rounded-xl border border-border">
                    <h4 className="text-sm font-bold text-foreground">Guest Access Levels</h4>
                    <div className="flex gap-4">
                      {['easy', 'medium', 'hard'].map((level) => (
                        <label key={level} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={(formData.guestAccess as any)[level]}
                            onChange={(e) => setFormData({
                              ...formData,
                              guestAccess: { ...formData.guestAccess, [level]: e.target.checked }
                            })}
                            className="w-4 h-4 accent-primary cursor-pointer"
                          />
                          <span className="text-xs font-medium text-text-muted group-hover:text-foreground capitalize">{level}</span>
                        </label>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Attempts Limit</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.maxGuestAttempts}
                          onChange={(e) => setFormData({ ...formData, maxGuestAttempts: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Incorrect Limit (Hearts)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.guestCreditLimit}
                          onChange={(e) => setFormData({ ...formData, guestCreditLimit: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-background/50 p-4 rounded-xl border border-border">
                    <h4 className="text-sm font-bold text-foreground">Guest Hearts Config</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Max Hearts</label>
                        <input
                          type="number"
                          value={formData.guestHeartsConfig.maxHearts}
                          onChange={(e) => setFormData({
                            ...formData,
                            guestHeartsConfig: { ...formData.guestHeartsConfig, maxHearts: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Refill Count</label>
                        <input
                          type="number"
                          value={formData.guestHeartsConfig.refillCount}
                          onChange={(e) => setFormData({
                            ...formData,
                            guestHeartsConfig: { ...formData.guestHeartsConfig, refillCount: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Cooldown (Hrs)</label>
                        <input
                          type="number"
                          value={formData.guestHeartsConfig.refillCooldownHours}
                          onChange={(e) => setFormData({
                            ...formData,
                            guestHeartsConfig: { ...formData.guestHeartsConfig, refillCooldownHours: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Daily Refill Limit</label>
                        <input
                          type="number"
                          value={formData.guestHeartsConfig.dailyRefillLimit}
                          onChange={(e) => setFormData({
                            ...formData,
                            guestHeartsConfig: { ...formData.guestHeartsConfig, dailyRefillLimit: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <h5 className="text-[10px] font-bold text-text-muted mb-2 uppercase">Level Completion Hearts</h5>
                      <div className="grid grid-cols-3 gap-3">
                        {['easy', 'medium', 'hard'].map((level) => (
                          <div key={level}>
                            <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-tight">{level}</label>
                            <input
                              type="number"
                              min="0"
                              value={(formData.guestHeartsConfig.rewards as any)[level]}
                              onChange={(e) => setFormData({
                                ...formData,
                                guestHeartsConfig: {
                                  ...formData.guestHeartsConfig,
                                  rewards: { ...formData.guestHeartsConfig.rewards, [level]: Math.max(0, parseInt(e.target.value) || 0) }
                                }
                              })}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-4 bg-background/50 p-4 rounded-xl border border-border">
                <h4 className="text-sm font-bold text-foreground">User Coin Rewards</h4>
                <div className="grid grid-cols-3 gap-3">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <div key={level}>
                      <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-tight">{level}</label>
                      <input
                        type="number"
                        min="0"
                        value={(formData.rewards as any)[level]}
                        onChange={(e) => setFormData({
                          ...formData,
                          rewards: { ...formData.rewards, [level]: Math.max(0, parseInt(e.target.value) || 0) }
                        })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 bg-background/50 p-4 rounded-xl border border-border">
                <h4 className="text-sm font-bold text-foreground">Lifelines Configuration (Registered Users)</h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* AI Hints */}
                  <div className="space-y-3 p-3 bg-surface rounded-lg border border-border">
                    <h5 className="text-xs font-bold text-primary flex items-center gap-1"><span className="material-icons text-sm">psychology</span> AI Hints</h5>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Free per Level</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lifelines.aiHints.freePerLevel}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifelines: {
                            ...formData.lifelines,
                            aiHints: { ...formData.lifelines.aiHints, freePerLevel: Math.max(0, parseInt(e.target.value) || 0) }
                          }
                        })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Extra Hint Coin Cost</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lifelines.aiHints.coinCost}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifelines: {
                            ...formData.lifelines,
                            aiHints: { ...formData.lifelines.aiHints, coinCost: Math.max(0, parseInt(e.target.value) || 0) }
                          }
                        })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* 50/50 */}
                  <div className="space-y-3 p-3 bg-surface rounded-lg border border-border">
                    <h5 className="text-xs font-bold text-primary flex items-center gap-1"><span className="material-icons text-sm">hdr_strong</span> 50/50</h5>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Free per Level</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lifelines.fiftyFifty.freePerLevel}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifelines: {
                            ...formData.lifelines,
                            fiftyFifty: { ...formData.lifelines.fiftyFifty, freePerLevel: Math.max(0, parseInt(e.target.value) || 0) }
                          }
                        })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Extra 50/50 Coin Cost</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lifelines.fiftyFifty.coinCost}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifelines: {
                            ...formData.lifelines,
                            fiftyFifty: { ...formData.lifelines.fiftyFifty, coinCost: Math.max(0, parseInt(e.target.value) || 0) }
                          }
                        })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Change Question */}
                  <div className="space-y-3 p-3 bg-surface rounded-lg border border-border">
                    <h5 className="text-xs font-bold text-primary flex items-center gap-1"><span className="material-icons text-sm">swap_horiz</span> Change Question</h5>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Free per Level</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lifelines.changeQuestion?.freePerLevel || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifelines: {
                            ...formData.lifelines,
                            changeQuestion: { ...formData.lifelines.changeQuestion, freePerLevel: Math.max(0, parseInt(e.target.value) || 0) }
                          }
                        })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Coin Cost</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lifelines.changeQuestion?.coinCost || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifelines: {
                            ...formData.lifelines,
                            changeQuestion: { ...formData.lifelines.changeQuestion, coinCost: Math.max(0, parseInt(e.target.value) || 0) }
                          }
                        })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Stop Timer */}
                  <div className="space-y-3 p-3 bg-surface rounded-lg border border-border">
                    <h5 className="text-xs font-bold text-primary flex items-center gap-1"><span className="material-icons text-sm">timer_off</span> Stop Timer</h5>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Free per Level</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lifelines.stopTimer?.freePerLevel || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifelines: {
                            ...formData.lifelines,
                            stopTimer: { ...formData.lifelines.stopTimer, freePerLevel: Math.max(0, parseInt(e.target.value) || 0) }
                          }
                        })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase">Coin Cost</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lifelines.stopTimer?.coinCost || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifelines: {
                            ...formData.lifelines,
                            stopTimer: { ...formData.lifelines.stopTimer, coinCost: Math.max(0, parseInt(e.target.value) || 0) }
                          }
                        })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>


              <div className="flex gap-4 pt-4">
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
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
              <p className="text-text-muted mb-8">
                This will delete the <span className="text-foreground font-bold">"{categoryToDelete?.name}"</span> category. This action cannot be undone.
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
    </DashboardLayout>
  );
}
