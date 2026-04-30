"use client";

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Shield, LogOut, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { username, logout } = useAuth();

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground uppercase tracking-tight">Admin Profile</h1>
          <p className="text-text-muted mt-1">Manage your administrative settings and sessions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar and Basic Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-1 bg-surface border border-border rounded-3xl p-8 flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20">
              <span className="text-4xl font-bold text-primary">{username?.charAt(0).toUpperCase()}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{username}</h2>
            <p className="text-text-muted text-sm italic uppercase tracking-wider mb-6">Senior Administrator</p>
            
            <button 
              onClick={logout}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 group font-medium"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Logout Session
            </button>
          </motion.div>

          {/* Details */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 space-y-6"
          >
            <div className="bg-surface border border-border rounded-3xl p-8">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Account Verification
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase">Username</p>
                    <p className="text-foreground font-semibold">{username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase">Email Address</p>
                    <p className="text-foreground font-semibold italic text-sm">Synchronizing from backend...</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase">Last Logged In</p>
                    <p className="text-foreground font-semibold">{new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
               <p className="text-sm text-primary text-center italic">
                 Security Tip: Always logout from your administrative session when working on public or shared terminals.
               </p>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
