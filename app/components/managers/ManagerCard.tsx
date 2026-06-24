'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AllManagerKey } from '@/app/types';
import { getManagerProfile } from '@/app/constants/agents';

interface ManagerCardProps {
  managerKey: AllManagerKey;
  isDark: boolean;
}

export function ManagerCard({ managerKey, isDark }: ManagerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const profile = getManagerProfile(managerKey);
  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className={`mt-2 rounded-xl border max-w-[92%] overflow-hidden ${isDark ? `${profile.darkBg} ${profile.darkBorder}` : 'bg-zinc-50 border-zinc-200'}`}
    >
      {/* Header row — click to expand */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={`cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-zinc-100'}`}
      >
        <div className={`w-6 h-6 rounded-md ${profile.avatarColor} flex items-center justify-center text-white text-[9px] font-bold font-mono ring-1 ${profile.ringColor}`}>
          {profile.initials}
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className={`text-xs font-mono font-bold truncate ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>
            {profile.name}
          </span>
          <span className={`text-[9px] font-mono truncate ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            · {profile.title}
          </span>
          <span className={`text-[7px] px-1 py-0.5 rounded font-mono font-bold uppercase tracking-widest ml-auto shrink-0 ${
            profile.domain === 'business'
              ? 'bg-emerald-900/40 text-emerald-500 border border-emerald-800/30'
              : isDark ? 'bg-zinc-800 text-zinc-500 border border-zinc-700' : 'bg-zinc-200 text-zinc-500'
          }`}>
            {profile.domain === 'business' ? 'BIZ' : 'TECH'}
          </span>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`text-[9px] shrink-0 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}
        >
          ▾
        </motion.span>
      </button>

      {/* Focus tags — always visible */}
      <div className="flex flex-wrap gap-1 px-3 pb-2">
        {profile.focus.map(f => (
          <span
            key={f}
            className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${isDark ? profile.badgeColor : 'bg-zinc-200 text-zinc-600'}`}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Expandable tagline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className={`px-3 pb-3 text-xs leading-relaxed italic ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              "{profile.tagline}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
