'use client';

import { motion } from 'framer-motion';

interface LogsTabProps {
  logs: string[];
  isDark: boolean;
}

function getLogColor(line: string): string {
  if (line.includes('[ERROR]'))   return 'text-red-400';
  if (line.includes('[SUCCESS]')) return 'text-emerald-400';
  if (line.includes('[ENGINE]') || line.includes('[SYSTEM]')) return 'text-indigo-400';
  if (line.includes('[MARKET]')) return 'text-amber-400';
  return 'text-zinc-500';
}

export function LogsTab({ logs, isDark }: LogsTabProps) {
  return (
    <div className={`font-mono text-[10px] p-3.5 rounded-xl border min-h-48 overflow-y-auto space-y-1 ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
      {logs.map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, x: -3 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.005 }}
          className={getLogColor(line)}
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
}
