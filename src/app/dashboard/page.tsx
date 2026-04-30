"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Layers, CircleHelp, Users, ArrowUpRight, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [stats, setStats] = useState({ categories: 0, questions: 0 });
  const [topQuestions, setTopQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [cRes, qRes, topRes] = await Promise.all([
        api.get('/categories'),
        api.get('/questions'),
        api.get('/questions/top')
      ]);
      setStats({
        categories: cRes.data.length,
        questions: qRes.data.length,
      });
      setTopQuestions(topRes.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Categories', value: stats.categories, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/dashboard/categories' },
    { label: 'Total Questions', value: stats.questions, icon: CircleHelp, color: 'text-purple-500', bg: 'bg-purple-500/10', href: '/dashboard/questions' },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground uppercase tracking-tight">Overview</h1>
          <p className="text-text-muted mt-1">Operational snapshot of the Quiz Ecosystem</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {statCards.map((card, idx) => (
              <Link key={card.label} href={card.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-surface border border-border rounded-3xl p-8 relative overflow-hidden group cursor-pointer hover:border-primary/50 hover:scale-[1.02] transition-all duration-300"
                >
                  <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                     <card.icon className="w-24 h-24" />
                  </div>
                  
                  <div className={`${card.bg} ${card.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  
                  <div className="relative z-10">
                    <p className="text-text-muted text-sm font-medium">{card.label}</p>
                    <h2 className="text-5xl font-bold text-foreground mt-1">{card.value}</h2>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-3 bg-surface border border-border rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ArrowUpRight className="w-5 h-5 text-primary" />
                        Top Performing Questions
                    </h3>
                </div>
                <div className="space-y-4">
                    {topQuestions.map((q, idx) => (
                        <Link 
                            key={q._id} 
                            href={`/dashboard/questions?categoryId=${q.categoryId?._id}`}
                            className="flex items-center gap-4 p-4 bg-background/50 rounded-2xl border border-border hover:bg-background hover:border-primary/50 transition-all group"
                        >
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                                #{idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-foreground font-medium truncate group-hover:text-primary transition-colors">{q.text}</p>
                                <p className="text-xs text-text-muted uppercase tracking-wider font-bold mt-0.5">{q.categoryId?.name}</p>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <div>
                                    <p className="text-lg font-bold text-foreground">{q.playCount || 0}</p>
                                    <p className="text-[10px] text-text-muted uppercase font-bold">Plays</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                            </div>
                        </Link>
                    ))}
                    {topQuestions.length === 0 && (
                        <p className="text-text-muted italic text-center py-8">No data available yet.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>

  );
}


