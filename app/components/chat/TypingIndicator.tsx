'use client';

import { motion } from 'framer-motion';
import type { AllManagerKey } from '@/app/types';
import { getManagerProfile } from '@/app/constants/agents';

interface TypingIndicatorProps {
  managerKey: AllManagerKey;
  isDark: boolean;
}

export function TypingIndicator({ managerKey, isDark }: TypingIndicatorProps) {
  const profile = getManagerProfile(managerKey);
  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border w-fit max-w-[260px] ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}
    >
      <div className={`w-6 h-6 rounded-md ${profile.avatarColor} flex items-center justify-center text-white text-[9px] font-bold font-mono ring-1 ${profile.ringColor} shrink-0`}>
        {profile.initials}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[9px] font-bold opacity-50">
          {profile.name}
          <span className="opacity-60"> · {profile.title.split(' ').slice(0, 2).join(' ')}</span>
        </span>
        <div className="flex gap-1 items-center">
          {[0, 150, 300].map(delay => (
            <motion.div
              key={delay}
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: delay / 1000 }}
              className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-zinc-400' : 'bg-zinc-500'}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
