'use client';

import { motion } from 'framer-motion';

interface ScoreBarProps {
  label: string;
  value: number;
  colorClass: string;
  gradientFrom: string;
  gradientTo: string;
  isDark: boolean;
}

export function ScoreBar({ label, value, colorClass, gradientFrom, gradientTo, isDark }: ScoreBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-[9px] font-mono font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {label}
        </span>
        <span className={`text-[9px] font-mono font-bold ${colorClass}`}>{value}%</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
        />
      </div>
    </div>
  );
}
