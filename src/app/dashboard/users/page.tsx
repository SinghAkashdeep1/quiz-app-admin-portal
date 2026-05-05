"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Users, Search, Plus, Loader2, Edit2, Trash2, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  guestId?: string;
  totalGamesPlayed: number;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  accuracy: number;
  createdAt: string;
}

export default function UsersPage() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(roleParam === 'guest' ? 'guest' : '');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', role: 'user', password: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Analytics State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const openFormModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username || '', email: user.email || '', role: user.role, password: '' });
    } else {
      setEditingUser(null);
      setFormData({ username: '', email: '', role: 'user', password: '' });
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingUser(null);
  };

  const openAnalyticsModal = async (id: string) => {
    try {
      const res = await api.get(`/admin/users/${id}`);
      setSelectedUser(res.data);
      setIsAnalyticsModalOpen(true);
    } catch (error) {
      toast.error('Failed to fetch user analytics');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser._id}`, {
          username: formData.username,
          email: formData.email,
          role: formData.role
        });
        toast.success('User updated successfully');
      } else {
        await api.post('/admin/users', formData);
        toast.success('User created successfully');
      }
      await fetchUsers();
      closeFormModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving user');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/admin/users/${userToDelete._id}`);
      setUsers(users.filter(u => u._id !== userToDelete._id));
      toast.success('User deleted successfully');
      setDeleteModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting user');
    }
  };

  const filteredUsers = users.filter(u => {
    // If roleParam is present, filter by role
    if (roleParam && u.role !== roleParam) return false;

    // Then filter by search term
    const term = search.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.guestId && u.guestId.toLowerCase().includes(term))
    );
  });

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground uppercase tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Users Management
            </h1>
            <p className="text-text-muted mt-1">Manage platform users and view their analytics</p>
          </div>
          <button
            onClick={() => openFormModal()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>

        <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border bg-background/50 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search users, emails or guest IDs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-text-muted"
              />
            </div>
            <div className="text-sm text-text-muted font-medium">
              {filteredUsers.length} Users
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-background/50">
                  <tr className="text-text-muted text-xs uppercase font-bold tracking-wider">
                    <th className="py-4 px-6 border-b border-border">User</th>
                    <th className="py-4 px-6 border-b border-border">Role</th>
                    <th className="py-4 px-6 border-b border-border">Joined</th>
                    <th className="py-4 px-6 border-b border-border text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-background/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-foreground truncate max-w-[200px]">
                            {user.username || (user.guestId ? `Guest: ${user.guestId.substring(0, 10)}...` : 'Anonymous')}
                          </p>
                          <p className="text-sm text-text-muted">{user.email || (user.guestId ? 'Guest User' : 'No email')}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                          user.role === 'guest' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                            'bg-green-500/10 text-green-500 border border-green-500/20'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-text-muted text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button
                            onClick={() => openAnalyticsModal(user._id)}
                            className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="View Analytics"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.role === 'user' && (
                            <>
                              <button
                                onClick={() => openFormModal(user)}
                                className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                                title="Edit User"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setUserToDelete(user);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-text-muted">
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={closeFormModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-background/50">
                <h3 className="text-xl font-bold text-foreground">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                <button onClick={closeFormModal} className="p-2 bg-surface hover:bg-border/50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/50"
                    required
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/50"
                    placeholder="Enter email address"
                  />
                </div>

                {!editingUser && (
                  <div className="relative">
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted/50 pr-12"
                      required
                      placeholder="Set account password"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-[38px] text-text-muted hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="flex-1 py-3 bg-surface border border-border hover:bg-border/50 text-foreground rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                  >
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingUser ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Analytics Modal */}
      <AnimatePresence>
        {isAnalyticsModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsAnalyticsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-background/50">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    {selectedUser.username || (selectedUser.guestId ? 'Guest User' : 'User')}'s Analytics
                  </h3>
                  <p className="text-sm text-text-muted mt-1">{selectedUser.email || selectedUser.guestId || 'No identification'}</p>
                </div>
                <button onClick={() => setIsAnalyticsModalOpen(false)} className="p-2 bg-surface hover:bg-border/50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-background border border-border rounded-2xl p-4 text-center">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Total Games</p>
                    <p className="text-3xl font-black text-purple-500">{selectedUser.totalGamesPlayed || 0}</p>
                  </div>
                  <div className="bg-background border border-border rounded-2xl p-4 text-center">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Accuracy</p>
                    <p className="text-3xl font-black text-green-500">{Math.round(selectedUser.accuracy || 0)}%</p>
                  </div>
                  <div className="bg-background border border-border rounded-2xl p-4 text-center">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Questions</p>
                    <p className="text-3xl font-black text-blue-500">{selectedUser.totalQuestionsAttempted || 0}</p>
                  </div>
                  <div className="bg-background border border-border rounded-2xl p-4 text-center">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Correct</p>
                    <p className="text-3xl font-black text-rose-500">{selectedUser.totalCorrectAnswers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-background/50 text-right">
                <button
                  onClick={() => setIsAnalyticsModalOpen(false)}
                  className="px-6 py-2.5 bg-surface border border-border hover:bg-border/50 text-foreground rounded-xl font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-surface border border-border rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Delete User?</h2>
              <p className="text-text-muted mb-8">
                Are you sure you want to delete <span className="text-foreground font-bold">"{userToDelete?.username || userToDelete?.guestId || 'this user'}"</span>? This action cannot be undone.
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
                  Delete User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
