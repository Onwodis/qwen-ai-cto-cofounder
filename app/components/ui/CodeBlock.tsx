'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCopy, FiCheck } from 'react-icons/fi';

interface CodeBlockProps {
  title: string;
  code: string;
  isDark: boolean;
}

export function CodeBlock({ title, code, isDark }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
      {/* macOS-style titlebar */}
      <div className={`flex items-center justify-between px-4 py-2.5 ${isDark ? 'bg-zinc-900 border-b border-zinc-800' : 'bg-zinc-50 border-b border-zinc-200'}`}>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-xs font-mono font-semibold text-zinc-400">{title}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className={`text-xs px-2.5 py-1 rounded-lg font-mono transition-all flex items-center gap-1.5 ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : isDark
              ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
              : 'bg-zinc-200 text-zinc-600 border border-zinc-300'
          }`}
        >
          {copied ? <FiCheck size={10} /> : <FiCopy size={10} />}
          {copied ? 'Copied' : 'Copy'}
        </motion.button>
      </div>
      <pre className={`p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-80 ${isDark ? 'bg-zinc-950 text-zinc-300' : 'bg-white text-zinc-800'}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
