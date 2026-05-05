"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  Layers,
  CircleHelp,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Categories', href: '/dashboard/categories', icon: Layers },
  { name: 'Questions', href: '/dashboard/questions', icon: CircleHelp },
  { name: 'Users', href: '/dashboard/users', icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, username } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-surface/50 backdrop-blur-xl flex flex-col">
        <Link href="/dashboard" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-text-muted">
            QuizAdmin
          </span>
        </Link>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-text-muted hover:text-foreground hover:bg-surface/80"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-text-muted group-hover:text-foreground")} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute right-4"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl text-text-muted hover:text-foreground hover:bg-surface/80 transition-all group"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                <span className="font-medium">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                <span className="font-medium">Dark Mode</span>
              </>
            )}
          </button>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl hover:bg-surface/80 transition-all group"
          >
            <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center text-xs font-bold text-text-muted border border-border group-hover:border-primary/50 transition-colors">
              {username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{username}</p>
              <p className="text-xs text-text-muted truncate italic">Administrator</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted hover:text-red-400 hover:bg-red-400/5 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
