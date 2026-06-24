'use client';

import React ,{useEffect} from 'react';
import {motion,AnimatePresence} from "framer-motion"
import { Sun, Moon } from 'lucide-react';
// import { Toaster } from 'sonner';

import { cn } from '@/app/lib/utils';
import { usePathname } from 'next/navigation';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  mounted: boolean;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('dark');
  const [mounted, setMounted] = React.useState(false);

  const pathname = usePathname();

  useEffect(() => {
    // We wrap this in a requestAnimationFrame to ensure the DOM has
    // painted the new route before we trigger the scroll.
    const scrollTarget = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant', // Use 'smooth' only if requested by UX; 'instant' is standard for routing.
      });
    };

    requestAnimationFrame(scrollTarget);
  }, [pathname]);

  React.useEffect(() => {
    // 1. Critical Sync: Check storage or system
    const saved = localStorage.getItem('mikptech-theme') as Theme | null;
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const initial = saved || system;

    setThemeState(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
    setMounted(true);
  }, []);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('mikptech-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }, []);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      isDark: theme === 'dark',
      mounted,
    }),
    [theme, setTheme, mounted]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        className={`transition-opacity duration-700 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {children}
        {/* <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className:
              'backdrop-blur-xl bg-white/10 border-white/10 text-white rounded-[1.5rem] shadow-2xl',
          }}
        /> */}
      </div>
    </ThemeContext.Provider>
  );
}

// 🚀 THE HOOK: Export this to use in Navbar, Footer, etc.
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}



export function ThemeToggle() {
  const { isDark, setTheme, mounted } = useTheme();

  // 🛡️ ARCHITECT FIX: Guarding against hydration mismatch
  if (!mounted) return <div className="w-12 h-12" />;

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative w-12 ml-auto h-12 cp rounded-full flex items-center justify-center transition-colors focus:outline-none overflow-hidden',
        isDark
          ? 'hover:bg-white/5 text-emerald-400'
          : 'hover:bg-black/5 text-emerald-600'
      )}
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ y: 20, rotate: 90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -20, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'circOut' }}
          >
            <Sun size={20} className="ml-auto text-amber-400" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: 20, rotate: 90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -20, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'circOut' }}
          >
            <Moon size={20} className="text-slate-700" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle background pulse effect on click */}
      <motion.span
        key={isDark ? 'dark-pulse' : 'light-pulse'}
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-emerald-500/20 rounded-full pointer-events-none"
      />
    </button>
  );
}