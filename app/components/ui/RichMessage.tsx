'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink } from 'react-icons/fi';

// ── Token types ───────────────────────────────────────────────────────────────

type RichToken =
  | { type: 'h2'; content: string }
  | { type: 'h3'; content: string }
  | { type: 'bullet'; items: string[] }
  | { type: 'numbered'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'metric'; key: string; value: string }
  | { type: 'code'; content: string }
  | { type: 'link'; url: string; label: string }
  | { type: 'prose'; content: string };

// ── Animation variants ────────────────────────────────────────────────────────

const staggerList = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const fadeSlide = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

// ── Inline formatter ──────────────────────────────────────────────────────────

function inlineFormat(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/\S+)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} className="font-bold">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))
      return (
        <code key={i} className="px-1 py-0.5 rounded bg-zinc-800 text-indigo-300 font-mono text-[10px]">
          {p.slice(1, -1)}
        </code>
      );
    if (p.startsWith('http'))
      return (
        <a key={i} href={p} target="_blank" rel="noopener noreferrer"
          className="cursor-pointer underline text-indigo-400 hover:text-indigo-300 break-all">
          {p.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}…
        </a>
      );
    return <span key={i}>{p}</span>;
  });
}

// ── Markdown-like parser ──────────────────────────────────────────────────────

function parseRich(raw: unknown): RichToken[] {
  if (raw === null || raw === undefined) return [];
  const content = typeof raw === 'string' ? raw : String(raw);
  const tokens: RichToken[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { i++; continue; }

    // Tables
    if (t.startsWith('|') && t.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines.map(r =>
        r.split('|').filter(c => c.trim() !== '').map(c => c.trim())
      );
      const isSep = (r: string[]) => r.every(c => /^[-:]+$/.test(c));
      if (rows.length >= 2 && isSep(rows[1])) {
        tokens.push({ type: 'table', headers: rows[0], rows: rows.slice(2) });
      } else {
        rows.forEach(r => tokens.push({ type: 'prose', content: r.join(' | ') }));
      }
      continue;
    }

    if (t.startsWith('## ')) { tokens.push({ type: 'h2', content: t.slice(3) }); i++; continue; }
    if (t.startsWith('###')) { tokens.push({ type: 'h3', content: t.replace(/^###\s*/, '') }); i++; continue; }

    if (/^[-*●•]\s/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*●•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*●•]\s+/, ''));
        i++;
      }
      tokens.push({ type: 'bullet', items });
      continue;
    }

    if (/^\d+\.\s/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      tokens.push({ type: 'numbered', items });
      continue;
    }

    if (t.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      tokens.push({ type: 'code', content: codeLines.join('\n') });
      continue;
    }

    if (/^https?:\/\/\S+$/.test(t)) {
      tokens.push({ type: 'link', url: t, label: t.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40) });
      i++; continue;
    }

    if (t.includes(':') && !t.startsWith('http') && t.length < 120) {
      const colon = t.indexOf(':');
      const k = t.substring(0, colon).trim();
      const v = t.substring(colon + 1).trim();
      if (k.length > 0 && k.length < 35 && v.length > 0 && !k.includes('  ')) {
        tokens.push({ type: 'metric', key: k, value: v });
        i++; continue;
      }
    }

    tokens.push({ type: 'prose', content: t });
    i++;
  }
  return tokens;
}

// ── Individual token renderers ────────────────────────────────────────────────

function TokenRenderer({ token, isDark }: { token: RichToken; isDark: boolean }) {
  switch (token.type) {
    case 'h2':
      return (
        <motion.h2 variants={fadeUp}
          className={`text-sm font-black font-mono uppercase tracking-widest mt-4 mb-1.5 pb-1 border-b ${isDark ? 'text-zinc-200 border-zinc-800' : 'text-zinc-800 border-zinc-200'}`}>
          {token.content}
        </motion.h2>
      );
    case 'h3':
      return (
        <motion.h3 variants={fadeUp}
          className={`text-[10px] font-bold uppercase tracking-widest mt-3 mb-1 font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {token.content}
        </motion.h3>
      );
    case 'bullet':
      return (
        <motion.ul variants={staggerList} initial="hidden" animate="visible" className="my-2 space-y-1.5">
          {token.items.map((item, idx) => (
            <motion.li key={idx} variants={fadeSlide}
              className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/[0.02] border-white/5 text-zinc-200' : 'bg-black/[0.01] border-black/5 text-zinc-800'}`}>
              <span className="text-indigo-400 shrink-0 mt-0.5 font-bold">●</span>
              <span className="leading-relaxed">{inlineFormat(item)}</span>
            </motion.li>
          ))}
        </motion.ul>
      );
    case 'numbered':
      return (
        <motion.ol variants={staggerList} initial="hidden" animate="visible" className="my-2 space-y-1.5">
          {token.items.map((item, idx) => (
            <motion.li key={idx} variants={fadeSlide}
              className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/[0.02] border-white/5 text-zinc-200' : 'bg-black/[0.01] border-black/5 text-zinc-800'}`}>
              <span className="text-indigo-400 font-mono font-bold shrink-0 w-4">{idx + 1}.</span>
              <span className="leading-relaxed">{inlineFormat(item)}</span>
            </motion.li>
          ))}
        </motion.ol>
      );
    case 'table':
      return (
        <motion.div variants={fadeUp} className="my-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className={isDark ? 'bg-zinc-900' : 'bg-zinc-100'}>
                {token.headers.map((h, idx) => (
                  <th key={idx} className={`px-3 py-2 text-left font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400 border-b border-zinc-800' : 'text-zinc-600 border-b border-zinc-200'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {token.rows.map((row, ri) => (
                <motion.tr key={ri} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ri * 0.04 }}
                  className={isDark ? 'border-b border-zinc-900 hover:bg-zinc-900/40' : 'border-b border-zinc-100 hover:bg-zinc-50'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-3 py-2.5 text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {inlineFormat(cell)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      );
    case 'metric':
      return (
        <motion.div variants={fadeUp}
          className={`flex justify-between items-center px-3 py-2.5 rounded-xl border text-xs my-1.5 ${isDark ? 'bg-zinc-900/60 border-white/5 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>
          <span className="font-mono opacity-60 text-xs">{token.key}</span>
          <span className="font-mono font-bold text-indigo-400 text-xs">{inlineFormat(token.value)}</span>
        </motion.div>
      );
    case 'code':
      return (
        <motion.pre variants={fadeUp}
          className={`my-2 p-3 rounded-xl border overflow-x-auto text-[10px] font-mono leading-relaxed ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}>
          <code>{token.content}</code>
        </motion.pre>
      );
    case 'link':
      return (
        <motion.a variants={fadeUp} href={token.url} target="_blank" rel="noopener noreferrer"
          className={`cursor-pointer flex items-center gap-2 my-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${isDark ? 'bg-white/[0.02] border-white/10 text-indigo-400 hover:bg-white/[0.06]' : 'bg-zinc-100 border-zinc-200 text-indigo-600 hover:bg-zinc-200'}`}>
          <FiExternalLink size={10} />
          <span>{token.label}</span>
        </motion.a>
      );
    default:
      return (
        <motion.p variants={fadeUp} className="text-sm leading-relaxed whitespace-pre-wrap my-1">
          {inlineFormat((token as { type: 'prose'; content: string }).content)}
        </motion.p>
      );
  }
}

// ── Public export ─────────────────────────────────────────────────────────────

interface RichMessageProps {
  content: string;
  isDark: boolean;
}

export function RichMessage({ content, isDark }: RichMessageProps) {
  const tokens = parseRich(content);
  return (
    <motion.div variants={staggerList} initial="hidden" animate="visible" className="space-y-0.5">
      {tokens.map((tok, i) => (
        <TokenRenderer key={i} token={tok} isDark={isDark} />
      ))}
    </motion.div>
  );
}
