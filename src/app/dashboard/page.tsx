"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { Layers, CircleHelp, Users, ArrowUpRight, Loader2, Activity, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsRes, catRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/categories')
      ]);
      setStats(statsRes.data);
      setCategoryStats(catRes.data);
    } catch (error: any) {
      console.error('Failed to fetch stats', error);
      toast.error(error.response?.data?.message || 'Failed to connect to analytics server');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/dashboard/users?role=user' },
    { label: 'Guest Users', value: stats.totalGuests, icon: CircleHelp, color: 'text-indigo-500', bg: 'bg-indigo-500/10', href: '/dashboard/users?role=guest' },
    { label: 'Daily Active Users', value: stats.dau, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Total Games', value: stats.totalGames, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Profile Completion', value: `${(stats.profileCompletionRate || 0).toFixed(1)}%`, icon: Target, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Conversion Rate', value: `${(stats.conversionRate || 0).toFixed(1)}%`, icon: ArrowUpRight, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ] : [];

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground uppercase tracking-tight">Production Overview</h1>
          <p className="text-text-muted mt-1">Real-time metrics for your MCQ platform</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {statCards.map((card, idx) => {
                const CardContent = (
                  <>
                    <div className={`${card.bg} ${card.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{card.label}</p>
                      <h2 className="text-3xl font-bold text-foreground mt-1">{card.value}</h2>
                    </div>
                  </>
                );

                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-surface border border-border rounded-3xl p-6 relative overflow-hidden group shadow-sm"
                  >
                    {card.href ? (
                      <Link href={card.href} className="absolute inset-0 z-20" />
                    ) : null}
                    {CardContent}
                  </motion.div>
                );
              })}
            </div>

            <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Category Performance
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-text-muted text-xs uppercase font-bold">
                      <th className="pb-4 px-2">Category</th>
                      <th className="pb-4 px-2">Total Plays</th>
                      <th className="pb-4 px-2 text-center">Questions Played</th>
                      <th className="pb-4 px-2 text-center">Correct Answers</th>
                      <th className="pb-4 px-2 text-right">Avg. Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryStats.map((cat, idx) => (
                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                        <td className="py-4 px-2 text-foreground font-medium">{cat.name || 'Unknown'}</td>
                        <td className="py-4 px-2 text-text-muted">{cat.totalPlays}</td>
                        <td className="py-4 px-2 text-center text-text-muted">{cat.totalQuestions}</td>
                        <td className="py-4 px-2 text-center text-text-muted">{cat.totalCorrect}</td>
                        <td className="py-4 px-2 text-right font-bold text-primary">{parseFloat(cat.avgAccuracy || 0).toFixed(1)}%</td>
                      </tr>
                    ))}
                    {categoryStats.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-text-muted italic">No category data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
