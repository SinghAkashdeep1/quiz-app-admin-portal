"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Plus, Edit2, Trash2, Tag, Loader2, AlertTriangle, X } from 'lucide-react';
import Pagination from '@/components/Pagination';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

interface Icon {
  _id: string;
  name: string;
  label: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [icons, setIcons] = useState<Icon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '', color: '#3B82F6' });
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
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
    } catch (error) {
      console.error('Failed to fetch icons');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, icon: category.icon, color: category.color });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', icon: icons[0]?.name || '', color: '#3B82F6' });
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
    if (!formData.icon) {
      toast.error('Please select an icon');
      return;
    }
    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, formData);
        toast.success('Category updated');
      } else {
        await api.post('/categories', formData);
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
      await api.delete(`/categories/${categoryToDelete._id}`);
      toast.success('Category deleted');
      setDeleteModalOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <Toaster position="top-right" />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quiz Categories</h1>
            <p className="text-text-muted mt-1">Manage themes and categories for your quiz app</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-primary hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {categories
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((category) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-surface border border-border rounded-2xl p-6 group hover:border-primary/30 transition-all duration-300 relative overflow-hidden shadow-sm"
                >
                  <Link 
                    href={`/dashboard/questions?categoryId=${category._id}`} 
                    className="absolute inset-0 z-0 cursor-pointer"
                  />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner border border-white/5"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      <span className="material-icons text-2xl">{category.icon}</span>
                    </div>
                    <div className="flex gap-2">
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
                        className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors bg-background/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative z-10 pointer-events-none">
                    <h3 className="text-xl font-bold text-foreground mb-1">{category.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }}></div>
                      <span className="text-xs text-text-muted uppercase tracking-tighter font-semibold">Theme: {category.color}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(categories.length / ITEMS_PER_PAGE)}
            totalItems={categories.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="categories"
          />
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h2>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., General Knowledge"
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
