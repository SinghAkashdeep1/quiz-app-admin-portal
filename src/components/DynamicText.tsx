"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

interface DynamicTextProps {
  children: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

// Module-level cache so translations persist across re-renders and navigations
const translationCache: Record<string, string> = {};

// Read the current language from localStorage (no react-i18next dependency needed)
function getCurrentLang(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('adminLang') || 'en';
}

export default function DynamicText({ children, as: Component = 'span', className }: DynamicTextProps) {
  const [text, setText] = useState(children);
  const [lang, setLang] = useState('en');

  // Track language changes via storage event + polling
  useEffect(() => {
    const update = () => {
      const newLang = getCurrentLang();
      if (newLang !== lang) setLang(newLang);
    };

    update(); // Run once on mount
    window.addEventListener('adminLangChange', update);
    return () => window.removeEventListener('adminLangChange', update);
  }, [lang]);

  useEffect(() => {
    if (!children) return;

    const currentLang = getCurrentLang();

    if (currentLang === 'en') {
      setText(children);
      return;
    }

    const cacheKey = `${currentLang}:${children}`;
    if (translationCache[cacheKey]) {
      setText(translationCache[cacheKey]);
      return;
    }

    // Translate via backend
    api.post('/translate', { text: children, targetLang: currentLang })
      .then((res) => {
        const translated = res.data.translation;
        if (translated) {
          translationCache[cacheKey] = translated;
          setText(translated);
        }
      })
      .catch(() => {
        setText(children); // Fallback to original on error
      });
  }, [children, lang]);

  return (
    <Component className={className}>
      {text}
    </Component>
  );
}
