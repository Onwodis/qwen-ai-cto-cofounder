'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCpu, FiDatabase, FiCheckSquare, FiTerminal, FiSun, FiMoon,
  FiArrowRight, FiCheckCircle, FiGrid, FiEdit2, FiHelpCircle,
  FiLayers, FiShield, FiTrendingUp, FiActivity, FiMinimize2,
  FiRefreshCw, FiCode, FiAlertTriangle, FiExternalLink, FiTrash2,
  FiZap, FiPlus, FiMessageSquare, FiLogOut, FiCopy, FiCheck,
  FiCornerUpLeft, FiX, FiDownload, FiBarChart2, FiList,
} from 'react-icons/fi';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AgentKey = 'CTO' | 'Infra' | 'Product' | 'Security';
type Perspective = 'management' | 'developer';

interface ReplyRef {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  agent?: AgentKey;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: AgentKey;
  timestamp: number;
  replyTo?: ReplyRef;
}

interface WorthinessScore {
  overall: number;
  technical: number;
  market: number;
  security: number;
  sentiment: 'bullish' | 'cautious' | 'neutral' | 'bearish';
  summary: string;
}

interface StructuredReport {
  nextjsFrontendCode: string;
  routeBackendCode: string;
  agentsFeedback: {
    ctoAnalysis: string;
    infraAnalysis: string;
    productAnalysis: string;
    securityAnalysis: string;
  };
  marketFeasibility: {
    marketSizeStudy: string;
    expectedProfitARR: string;
    riskMitigation: string;
  };
  worthinessScore: WorthinessScore;
}

interface AgentStatus {
  key: AgentKey;
  name: string;
  role: string;
  status: 'idle' | 'debating' | 'synchronized';
  icon: React.ReactNode;
  color: string;
  load: number;
}

interface SessionMeta {
  id: string;
  preview: string;
  productName: string;
  perspective: Perspective;
  updatedAt: number;
  count: number;
  hasReport: boolean;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const bounce = { type: 'spring' as const, stiffness: 380, damping: 26 };
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const SESSIONS_KEY = 'cto_sessions_meta';

const AGENT_DISPLAY: Record<AgentKey, { name: string; handle: string; avatarColor: string; Icon: React.ElementType; ring: string }> = {
  CTO:      { name: 'Atlas',  handle: 'AI CTO',             avatarColor: 'bg-indigo-600',  Icon: FiCpu,        ring: 'ring-indigo-500/40' },
  Infra:    { name: 'Rex',    handle: 'Infra Architect',    avatarColor: 'bg-amber-600',   Icon: FiLayers,     ring: 'ring-amber-500/40' },
  Product:  { name: 'Nova',   handle: 'Product Strategist', avatarColor: 'bg-emerald-600', Icon: FiTrendingUp, ring: 'ring-emerald-500/40' },
  Security: { name: 'Cipher', handle: 'Security SecOps',    avatarColor: 'bg-cyan-600',    Icon: FiShield,     ring: 'ring-cyan-500/40' },
};

const AGENT_STYLES: Record<AgentKey, { darkBg: string; darkBorder: string; badge: string }> = {
  CTO:      { darkBg: 'bg-indigo-950/20',  darkBorder: 'border-indigo-500/20',  badge: 'bg-indigo-500/20 text-indigo-300' },
  Infra:    { darkBg: 'bg-blue-950/20',    darkBorder: 'border-blue-500/20',    badge: 'bg-blue-500/20 text-blue-300' },
  Product:  { darkBg: 'bg-emerald-950/20', darkBorder: 'border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-300' },
  Security: { darkBg: 'bg-amber-950/20',   darkBorder: 'border-amber-500/20',   badge: 'bg-amber-500/20 text-amber-300' },
};

const AGENT_ROLES: Record<AgentKey, Record<Perspective, { title: string; handle: string; description: string; focus: string[] }>> = {
  CTO: {
    developer: {
      title: 'Atlas', handle: 'AI CTO',
      description: 'Full-stack architect and technical director. Evaluates frameworks, API contracts, database schemas, and system design trade-offs — always framing technical choices in competitive and financial terms.',
      focus: ['System Design', 'Stack Selection', 'API Architecture', 'Tech ROI'],
    },
    management: {
      title: 'Atlas', handle: 'Chief Technology Executive',
      description: 'Strategic technology voice at the executive table. Assesses build-vs-buy decisions, vendor partnerships, and platform investments purely through the lens of market timing, competitive advantage, and business value.',
      focus: ['Build vs Buy', 'Market Timing', 'Tech ROI', 'Competitive Edge'],
    },
  },
  Infra: {
    developer: {
      title: 'Rex', handle: 'Infra Architect',
      description: 'Distributed systems and cloud infrastructure specialist. Designs microservices topology, DevOps pipelines, and database clusters. Challenges every scale assumption with real latency and cost numbers.',
      focus: ['Cloud Architecture', 'Microservices', 'DevOps / CI-CD', 'Cost Optimization'],
    },
    management: {
      title: 'Rex', handle: 'Operations & Growth Lead',
      description: 'Business scalability and operational efficiency strategist. Negotiates vendor SLAs, manages headcount planning, and ensures the platform supports aggressive business growth without ballooning the burn rate.',
      focus: ['Cost Management', 'Vendor Strategy', 'SLA Commitments', 'Operational Scale'],
    },
  },
  Product: {
    developer: {
      title: 'Nova', handle: 'Product Strategist',
      description: 'Growth-hacking product lead bridging engineering velocity with market opportunity. Defines feature roadmaps and user flows, and ruthlessly cuts over-engineering to focus on what users will actually pay for.',
      focus: ['User Experience', 'Feature Prioritization', 'Growth Loops', 'Product-Market Fit'],
    },
    management: {
      title: 'Nova', handle: 'Market & Revenue Lead',
      description: 'Revenue and customer acquisition strategist. Owns the go-to-market plan, pricing model, customer segmentation, and competitive positioning. Measures everything in CAC, LTV, NPS, and churn rate.',
      focus: ['Go-to-Market', 'Pricing Strategy', 'CAC / LTV', 'Competitive Moat'],
    },
  },
  Security: {
    developer: {
      title: 'Cipher', handle: 'Security SecOps',
      description: 'Zero-trust security engineer running active threat modeling sessions. Reviews authentication flows, API attack surfaces, and data encryption standards. Demands specific technical mitigations — never accepts "we\'ll handle it later."',
      focus: ['Threat Modeling', 'Zero-Trust Auth', 'Data Encryption', 'Compliance Audits'],
    },
    management: {
      title: 'Cipher', handle: 'Risk & Compliance Officer',
      description: 'Business risk and regulatory compliance guardian. Flags GDPR, CCPA, and SOC2 exposures before they become lawsuits, manages cyber insurance requirements, and protects the company from reputational and financial liability.',
      focus: ['GDPR / CCPA', 'Legal Liability', 'Cyber Insurance', 'Business Continuity'],
    },
  },
};

const INITIAL_AGENTS: AgentStatus[] = [
  { key: 'CTO',      name: 'Atlas',  role: 'AI CTO · Executive Consensus',   status: 'idle', icon: <FiCpu />,        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', load: 0 },
  { key: 'Infra',    name: 'Rex',    role: 'Infra · Distributed Systems',    status: 'idle', icon: <FiLayers />,     color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   load: 0 },
  { key: 'Product',  name: 'Nova',   role: 'Product · Market-Fit Analytics', status: 'idle', icon: <FiTrendingUp />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', load: 0 },
  { key: 'Security', name: 'Cipher', role: 'SecOps · Zero-Trust Protocol',   status: 'idle', icon: <FiShield />,     color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',      load: 0 },
];

const RIGHT_TABS: Record<Perspective, Array<{ key: 'code' | 'roadmap' | 'logs'; label: string; icon: React.ReactNode }>> = {
  developer: [
    { key: 'code',    label: 'Code Output',   icon: <FiCode /> },
    { key: 'roadmap', label: 'Roadmap',       icon: <FiCheckSquare /> },
    { key: 'logs',    label: 'System Logs',   icon: <FiTerminal /> },
  ],
  management: [
    { key: 'code',    label: 'Pitch Brief',   icon: <FiBarChart2 /> },
    { key: 'roadmap', label: 'Strategy Map',  icon: <FiCheckSquare /> },
    { key: 'logs',    label: 'War Room Log',  icon: <FiTerminal /> },
  ],
};

const SENTIMENT_COLOR: Record<string, string> = {
  bullish:  'text-emerald-400',
  cautious: 'text-amber-400',
  neutral:  'text-zinc-400',
  bearish:  'text-red-400',
};

function getLogColor(l: string) {
  if (l.includes('[ERROR]'))   return 'text-red-400';
  if (l.includes('[SUCCESS]')) return 'text-emerald-400';
  if (l.includes('[ENGINE]') || l.includes('[SYSTEM]')) return 'text-indigo-400';
  if (l.includes('[MARKET]')) return 'text-amber-400';
  return 'text-zinc-500';
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── RICH MESSAGE RENDERER ───────────────────────────────────────────────────

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

function inlineFormat(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/\S+)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} className="font-bold">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))
      return <code key={i} className="px-1 py-0.5 rounded bg-zinc-800 text-indigo-300 font-mono text-[10px]">{p.slice(1, -1)}</code>;
    if (p.startsWith('http'))
      return <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline text-indigo-400 hover:text-indigo-300 break-all">{p.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}…</a>;
    return <span key={i}>{p}</span>;
  });
}

/**
 * Professional-grade content parser for Delta Auth workspace
 * Defensive against malformed data, streaming artifacts, and type-mismatch
 */
function parseRich(raw: any): RichToken[] {
  // 1. Defensive Type Guard: Coerce input to string or return empty set
  if (raw === null || raw === undefined) return [];
  const content = typeof raw === 'string' ? raw : String(raw);
  
  const tokens: RichToken[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { i++; continue; }

    // Table Handling
    if (t.startsWith('|') && t.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines.map(r => r.split('|').filter(c => c.trim() !== '').map(c => c.trim()));
      const isSep = (r: string[]) => r.every(c => /^[-:]+$/.test(c));
      if (rows.length >= 2 && isSep(rows[1])) {
        tokens.push({ type: 'table', headers: rows[0], rows: rows.slice(2) });
      } else {
        rows.forEach(r => tokens.push({ type: 'prose', content: r.join(' | ') }));
      }
      continue;
    }

    // Headers
    if (t.startsWith('## ')) { tokens.push({ type: 'h2', content: t.slice(3) }); i++; continue; }
    if (t.startsWith('###')) { tokens.push({ type: 'h3', content: t.replace(/^###\s*/, '') }); i++; continue; }

    // Lists (Bullet & Numbered)
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

    // Code Blocks
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

    // Links & Metrics
    if (/^https?:\/\/\S+$/.test(t)) {
      tokens.push({ type: 'link', url: t, label: t.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40) });
      i++; continue;
    }

    if (t.includes(':') && !t.startsWith('http') && t.length < 120) {
      const colon = t.indexOf(':');
      const k = t.substring(0, colon).trim();
      const v = t.substring(colon + 1).trim();
      if (k.length > 0 && k.length < 35 && v.length > 0 && !k.includes(' '.repeat(2))) {
        tokens.push({ type: 'metric', key: k, value: v });
        i++; continue;
      }
    }

    tokens.push({ type: 'prose', content: t });
    i++;
  }
  return tokens;
}

const staggerList = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const fadeSlide = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

function RichToken({ token, isDark }: { token: RichToken; isDark: boolean }) {
  switch (token.type) {
    case 'h2':
      return (
        <motion.h2 variants={fadeUp} className={`text-sm font-black font-mono uppercase tracking-widest mt-4 mb-1.5 pb-1 border-b ${isDark ? 'text-zinc-200 border-zinc-800' : 'text-zinc-800 border-zinc-200'}`}>
          {token.content}
        </motion.h2>
      );
    case 'h3':
      return (
        <motion.h3 variants={fadeUp} className={`text-[10px] font-bold uppercase tracking-widest mt-3 mb-1 font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {token.content}
        </motion.h3>
      );
    case 'bullet':
      return (
        <motion.ul variants={staggerList} initial="hidden" animate="visible" className="my-2 space-y-1.5">
          {token.items.map((item, i) => (
            <motion.li key={i} variants={fadeSlide}
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
          {token.items.map((item, i) => (
            <motion.li key={i} variants={fadeSlide}
              className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-white/[0.02] border-white/5 text-zinc-200' : 'bg-black/[0.01] border-black/5 text-zinc-800'}`}>
              <span className="text-indigo-400 font-mono font-bold shrink-0 w-4">{i + 1}.</span>
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
                {token.headers.map((h, i) => (
                  <th key={i} className={`px-3 py-2 text-left font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400 border-b border-zinc-800' : 'text-zinc-600 border-b border-zinc-200'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {token.rows.map((row, ri) => (
                <motion.tr key={ri} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ri * 0.04 }}
                  className={isDark ? 'border-b border-zinc-900 hover:bg-zinc-900/40' : 'border-b border-zinc-100 hover:bg-zinc-50'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-3 py-2.5 text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{inlineFormat(cell)}</td>
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
          className={`flex items-center gap-2 my-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${isDark ? 'bg-white/[0.02] border-white/10 text-indigo-400 hover:bg-white/[0.06]' : 'bg-zinc-100 border-zinc-200 text-indigo-600 hover:bg-zinc-200'}`}>
          <FiExternalLink size={10} /><span>{token.label}</span>
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

function RichMessage({ content, isDark }: { content: string; isDark: boolean }) {
  const tokens = parseRich(content);
  return (
    <motion.div variants={staggerList} initial="hidden" animate="visible" className="space-y-0.5">
      {tokens.map((tok, i) => <RichToken key={i} token={tok} isDark={isDark} />)}
    </motion.div>
  );
}

// ─── CODE BLOCK ───────────────────────────────────────────────────────────────

function CodeBlock({ title, code, isDark }: { title: string; code: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
      <div className={`flex items-center justify-between px-4 py-2.5 ${isDark ? 'bg-zinc-900 border-b border-zinc-800' : 'bg-zinc-50 border-b border-zinc-200'}`}>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/70" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" /></div>
          <span className="text-xs font-mono font-semibold text-zinc-400">{title}</span>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className={`text-xs px-2.5 py-1 rounded-lg font-mono transition-all flex items-center gap-1.5 ${copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700' : 'bg-zinc-200 text-zinc-600 border border-zinc-300'}`}>
          {copied ? <FiCheck size={10} /> : <FiCopy size={10} />}{copied ? 'Copied' : 'Copy'}
        </motion.button>
      </div>
      <pre className={`p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-80 ${isDark ? 'bg-zinc-950 text-zinc-300' : 'bg-white text-zinc-800'}`}><code>{code}</code></pre>
    </div>
  );
}

// ─── AUTH GATE ───────────────────────────────────────────────────────────────

function AuthGate({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState('');
  const [shake, setShake] = useState(false);
  const submit = () => {
    if (!name.trim()) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    onLogin(name.trim());
  };
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-600/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-600/5 blur-3xl" />
      </div>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...bounce, delay: 0.1 }}
        className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-black/60">
          <div className="flex flex-col items-center mb-8">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-2xl shadow-indigo-600/30 mb-4">
              <FiCpu size={28} />
            </motion.div>
            <h1 className="text-lg font-black font-mono text-zinc-100 tracking-tight">QWEN CO-FOUNDER ENGINE</h1>
            <p className="text-[10px] font-mono text-zinc-500 tracking-[0.2em] mt-1">MULTI-AGENT WAR ROOM v4.0</p>
            <div className="flex items-center gap-1.5 mt-3">
              {['Atlas', 'Rex', 'Nova', 'Cipher'].map((a, i) => (
                <motion.span key={a} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                  className="text-[8px] px-1.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono font-bold">{a}</motion.span>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 tracking-wider mb-2">FOUNDER IDENTIFIER</label>
              <motion.input animate={shake ? { x: [-6, 6, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}
                type="text" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="e.g. Samuel Onwodi"
                className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-sans text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submit}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono text-sm font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/20 transition-all">
              <FiZap size={15} /><span>Launch War Room</span><FiArrowRight size={14} />
            </motion.button>
          </div>
          <p className="text-center text-[10px] text-zinc-600 font-mono mt-5">Powered by Qwen AI · Alibaba Cloud DashScope</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────

function TypingBubble({ agent, isDark }: { agent: AgentKey; isDark: boolean }) {
  const d = AGENT_DISPLAY[agent];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border w-fit max-w-[240px] ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
      <div className={`p-1.5 rounded-lg text-white text-[10px] ${d.avatarColor} ring-2 ${d.ring}`}><d.Icon /></div>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] font-bold opacity-50">{d.name} <span className="opacity-60">· {d.handle}</span></span>
        <div className="flex gap-1 items-center">
          {[0, 150, 300].map(ms => (
            <motion.div key={ms} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: ms / 1000 }}
              className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-zinc-400' : 'bg-zinc-500'}`} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── AGENT ROLE CARD ─────────────────────────────────────────────────────────

function AgentRoleCard({ agent, perspective, isDark }: { agent: AgentKey; perspective: Perspective; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const role = AGENT_ROLES[agent][perspective];
  const d    = AGENT_DISPLAY[agent];
  const s    = AGENT_STYLES[agent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, type: 'spring' as const, stiffness: 280, damping: 26 }}
      className={`mt-2 rounded-xl border max-w-[92%] overflow-hidden ${isDark ? `${s.darkBg} ${s.darkBorder}` : 'bg-zinc-50 border-zinc-200'}`}>

      {/* Always-visible header row — click to expand */}
      <button onClick={() => setExpanded(e => !e)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-zinc-100'}`}>
        <div className={`p-1 rounded-md text-white text-[9px] ${d.avatarColor}`}><d.Icon /></div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className={`text-xs font-mono font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>{role.title}</span>
          <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>· {role.handle}</span>
          <span className={`text-[7px] px-1 py-0.5 rounded font-mono font-bold uppercase tracking-widest ml-1 ${perspective === 'management' ? 'bg-emerald-900/40 text-emerald-600 border border-emerald-800/30' : isDark ? 'bg-zinc-800 text-zinc-600 border border-zinc-700' : 'bg-zinc-200 text-zinc-500'}`}>
            {perspective === 'management' ? 'BUSINESS' : 'TECH'}
          </span>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}
          className={`text-[9px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>▾</motion.span>
      </button>

      {/* Focus tags — always visible */}
      <div className="flex flex-wrap gap-1 px-3 pb-2">
        {role.focus.map(f => (
          <span key={f} className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${isDark ? s.badge : 'bg-zinc-200 text-zinc-600'}`}>{f}</span>
        ))}
      </div>

      {/* Expandable description */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }} className="overflow-hidden">
            <p className={`px-3 pb-3 text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{role.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── SESSIONS SIDEBAR ─────────────────────────────────────────────────────────

function SessionsSidebar({
  sessions, activeId, onSelect, onNew, founderName, onLogout, isDark,
}: {
  sessions: SessionMeta[]; activeId: string; onSelect: (id: string) => void;
  onNew: () => void; founderName: string; onLogout: () => void; isDark: boolean;
}) {
  const initials = founderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`flex flex-col h-full border-r ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
      <div className={`p-3 border-b ${isDark ? 'border-zinc-900' : 'border-zinc-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold font-mono">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold font-mono text-zinc-300 truncate">{founderName}</p>
            <p className="text-[8px] text-zinc-600 font-mono">FOUNDER</p>
          </div>
          <button onClick={onLogout} title="Logout" className="p-1 rounded-lg text-zinc-600 hover:text-red-400 transition-colors"><FiLogOut size={11} /></button>
        </div>
        <button onClick={onNew}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold transition-all">
          <FiPlus size={11} /><span>New Session</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <p className="text-[8px] font-mono font-bold text-zinc-600 tracking-wider px-1 py-1">RECENT SESSIONS</p>
        {sessions.length === 0 && <p className="text-[9px] font-mono text-zinc-700 px-2 py-3 text-center">No sessions yet</p>}
        {sessions.map(s => {
          const isActive = s.id === activeId;
          return (
            <motion.button key={s.id} onClick={() => onSelect(s.id)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className={`w-full text-left px-2.5 py-2.5 rounded-xl transition-all border ${isActive ? isDark ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200' : isDark ? 'hover:bg-zinc-900/80 border-transparent hover:border-zinc-800' : 'hover:bg-zinc-100 border-transparent'}`}>
              <div className="flex items-start gap-1.5">
                <FiMessageSquare size={10} className={`mt-0.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-600'}`} />
                <div className="min-w-0 flex-1">
                  {/* Product name */}
                  {s.productName && (
                    <p className={`text-[8px] font-mono font-bold truncate mb-0.5 ${isActive ? 'text-indigo-400' : 'text-zinc-600'}`}>
                      {s.productName}
                    </p>
                  )}
                  {/* Preview */}
                  <p className={`text-[9px] font-mono truncate leading-tight ${isActive ? 'text-indigo-200' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {s.preview || 'Session'}
                  </p>
                  {/* Meta row */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[7px] text-zinc-700">{s.count} msg{s.count !== 1 ? 's' : ''}</span>
                    {s.perspective && (
                      <span className={`text-[6px] px-1 py-0.5 rounded font-mono font-bold uppercase ${s.perspective === 'management' ? 'bg-emerald-900/40 text-emerald-600' : 'bg-indigo-900/40 text-indigo-600'}`}>
                        {s.perspective === 'management' ? 'MGMT' : 'DEV'}
                      </span>
                    )}
                    {s.hasReport && (
                      <span className="text-[6px] px-1 py-0.5 rounded font-mono font-bold uppercase bg-zinc-800 text-zinc-500">
                        ● CANVAS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── WORTHINESS GAUGE ─────────────────────────────────────────────────────────

function ScoreBar({ label, value, color, isDark }: { label: string; value: number; color: string; isDark: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-[9px] font-mono font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{label}</span>
        <span className={`text-[9px] font-mono font-bold ${color}`}>{value}%</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${color.includes('emerald') ? 'from-emerald-600 to-emerald-400' : color.includes('indigo') ? 'from-indigo-600 to-indigo-400' : color.includes('amber') ? 'from-amber-600 to-amber-400' : 'from-cyan-600 to-cyan-400'}`} />
      </div>
    </div>
  );
}

// ─── PDF GENERATION ───────────────────────────────────────────────────────────

async function downloadPDF(report: StructuredReport, productName: string, founderName: string) {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; const H = 297;
  const margin = 20;
  const contentW = W - margin * 2;

  const addPage = () => { doc.addPage(); return margin; };
  const hex2rgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b] as [number, number, number];
  };

  // ── Cover Page ────────────────────────────────────────────────────────────
  doc.setFillColor(18, 18, 20);
  doc.rect(0, 0, W, H, 'F');

  // Accent bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 6, H, 'F');

  // Logo mark
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(margin, 30, 14, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('QCE', margin + 2.5, 39);

  doc.setTextColor(160, 160, 180);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('QWEN CO-FOUNDER ENGINE', margin + 18, 39);

  // Product name
  doc.setTextColor(240, 240, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  const nameLines = doc.splitTextToSize(productName || 'Product Analysis', contentW);
  doc.text(nameLines, margin, 80);

  // Subtitle
  doc.setTextColor(100, 100, 120);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('WAR ROOM CO-FOUNDER REPORT', margin, 80 + nameLines.length * 12 + 8);

  // Meta info
  const metaY = 140;
  const metas = [
    ['FOUNDER', founderName],
    ['DATE', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ['POWERED BY', 'Qwen AI · Alibaba Cloud DashScope'],
    ['SENTIMENT', (report.worthinessScore?.sentiment || 'N/A').toUpperCase()],
  ];
  metas.forEach(([label, value], i) => {
    doc.setTextColor(80, 80, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, metaY + i * 12);
    doc.setTextColor(200, 200, 220);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 35, metaY + i * 12);
  });

  // Worthiness dial
  if (report.worthinessScore) {
    const ws = report.worthinessScore;
    const gaugeY = 215;
    doc.setTextColor(80, 80, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERALL WORTHINESS SCORE', margin, gaugeY);

    const scores = [
      { label: 'Overall', value: ws.overall, x: margin },
      { label: 'Technical', value: ws.technical, x: margin + 42 },
      { label: 'Market', value: ws.market, x: margin + 84 },
      { label: 'Security', value: ws.security, x: margin + 126 },
    ];
    scores.forEach(({ label, value, x }) => {
      doc.setFillColor(40, 40, 50);
      doc.roundedRect(x, gaugeY + 4, 36, 20, 2, 2, 'F');
      doc.setFillColor(99, 102, 241);
      doc.roundedRect(x, gaugeY + 4, 36 * (value / 100), 20, 2, 2, 'F');
      doc.setTextColor(240, 240, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${value}`, x + 4, gaugeY + 16);
      doc.setTextColor(120, 120, 140);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(label, x + 4, gaugeY + 21);
    });

    doc.setTextColor(160, 160, 200);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const summaryLines = doc.splitTextToSize(`"${ws.summary}"`, contentW);
    doc.text(summaryLines, margin, gaugeY + 34);
  }

  // Footer
  doc.setTextColor(50, 50, 70);
  doc.setFontSize(7);
  doc.text('Confidential · Generated by Qwen Co-Founder Engine', margin, H - 12);

  // ── Page 2: Agent Analyses ───────────────────────────────────────────────
  let y = addPage();

  const sectionHeader = (title: string, color: [number, number, number]) => {
    doc.setFillColor(...color);
    doc.rect(margin, y, 4, 7, 'F');
    doc.setTextColor(...color);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 7, y + 5.5);
    y += 12;
  };

  const bodyText = (text: string, isDark = true) => {
    doc.setTextColor(isDark ? 190 : 60, isDark ? 190 : 60, isDark ? 210 : 80);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text.replace(/\*\*/g, '').replace(/`/g, ''), contentW - 8);
    lines.forEach((line: string) => {
      if (y > H - 25) { y = addPage(); }
      doc.text(line, margin + 6, y);
      y += 5;
    });
    y += 4;
  };

  // Page background
  doc.setFillColor(18, 18, 20);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 6, H, 'F');

  doc.setTextColor(240, 240, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AGENT WAR ROOM ANALYSES', margin, y);
  y += 12;

  sectionHeader('ATLAS — AI CTO VERDICT', [99, 102, 241]);
  bodyText(report.agentsFeedback.ctoAnalysis);

  sectionHeader('REX — INFRASTRUCTURE ASSESSMENT', [217, 119, 6]);
  bodyText(report.agentsFeedback.infraAnalysis);

  if (y > H - 60) { y = addPage(); doc.setFillColor(18, 18, 20); doc.rect(0, 0, W, H, 'F'); doc.setFillColor(99, 102, 241); doc.rect(0, 0, 6, H, 'F'); }

  sectionHeader('NOVA — PRODUCT STRATEGY', [16, 185, 129]);
  bodyText(report.agentsFeedback.productAnalysis);

  sectionHeader('CIPHER — SECURITY AUDIT', [6, 182, 212]);
  bodyText(report.agentsFeedback.securityAnalysis);

  // ── Page 3: Market Feasibility ────────────────────────────────────────────
  y = addPage();
  doc.setFillColor(18, 18, 20);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 6, H, 'F');

  doc.setTextColor(240, 240, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MARKET FEASIBILITY REPORT', margin, y);
  y += 12;

  sectionHeader('TAM / SAM / SOM MARKET STUDY', [99, 102, 241]);
  bodyText(report.marketFeasibility.marketSizeStudy);

  sectionHeader('ARR PROJECTION', [16, 185, 129]);
  bodyText(report.marketFeasibility.expectedProfitARR);

  sectionHeader('RISK MITIGATION', [239, 68, 68]);
  bodyText(report.marketFeasibility.riskMitigation);

  // Footer on last page
  doc.setTextColor(50, 50, 70);
  doc.setFontSize(7);
  doc.text('Confidential · Generated by Qwen Co-Founder Engine', margin, H - 12);

  doc.save(`${(productName || 'report').toLowerCase().replace(/\s+/g, '-')}-war-room-report.pdf`);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CtoWorkspace() {
  // Auth
  const [founderName, setFounderName] = useState<string | null>(null);

  // Sessions
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');

  // UI
  const [isDark, setIsDark]             = useState(true);
  const [perspective, setPerspective]   = useState<Perspective>('developer');
  const [activeTab, setActiveTab]       = useState<'code' | 'roadmap' | 'logs'>('code');
  const [thinkingMode, setThinkingMode] = useState(false);
  const [step, setStep]                 = useState<1 | 2 | 3>(1);
  const [showHelp, setShowHelp]         = useState(false);
  const [tooltip, setTooltip]           = useState<string | null>(null);
  const [mobilePanel, setMobilePanel]   = useState<'chat' | 'canvas' | 'sessions'>('chat');

  // Project
  const [productName, setProductName]     = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUnlocked, setIsUnlocked]       = useState(false);

  // Chat
  const [input, setInput]             = useState('');
  const [messages, setMessages]       = useState<Message[]>([]);
  const [typingAgent, setTypingAgent] = useState<AgentKey | null>(null);
  const [agents, setAgents]           = useState<AgentStatus[]>(INITIAL_AGENTS);
  const [report, setReport]           = useState<StructuredReport | null>(null);
  const [logs, setLogs]               = useState<string[]>(['[SYSTEM] Qwen Co-Founder Engine initialized.', '[ENGINE] Qwen pipeline ready. Awaiting founder input...']);
  const [replyingTo, setReplyingTo]   = useState<ReplyRef | null>(null);
  const [copiedId, setCopiedId]       = useState<string | null>(null);
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const sessionIdRef   = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const name = localStorage.getItem('cto_founder');
    if (name) setFounderName(name);
    const t = localStorage.getItem('cto_theme');
    if (t) setIsDark(t === 'dark');
  }, []);

  useEffect(() => {
    if (!founderName) return;
    let sid = localStorage.getItem('cto_session_id');
    if (!sid) { sid = newSid(); localStorage.setItem('cto_session_id', sid); }
    sessionIdRef.current = sid;
    setActiveSessionId(sid);
    loadSessionsList();
    fetch(`/api/history?sessionId=${sid}`).then(r => r.json()).then(d => {
      if (d.messages?.length) {
        setMessages(d.messages);
        setStep(3);
        setIsUnlocked(true);
        if (d.lastReport)  setReport(d.lastReport as StructuredReport);
        if (d.productName) setProductName(d.productName);
        if (d.perspective) setPerspective(d.perspective as Perspective);
        setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'synchronized' as const, load: 5 })));
      }
    }).catch(() => {});
  }, [founderName]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingAgent]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const newSid = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const loadSessionsList = () => {
    fetch('/api/sessions').then(r => r.json()).then(d => {
      if (d.sessions?.length) setSessions(d.sessions);
    }).catch(() => {
      try { const raw = localStorage.getItem(SESSIONS_KEY); if (raw) setSessions(JSON.parse(raw)); } catch {}
    });
  };

  const upsertSessionMeta = (id: string, preview: string, count: number, extra: Partial<SessionMeta> = {}) => {
    setSessions(prev => {
      const blank: SessionMeta = { id, preview, productName: '', perspective: 'developer', count, updatedAt: Date.now(), hasReport: false };
      const updated = prev.find(s => s.id === id)
        ? prev.map(s => s.id === id ? { ...s, preview, count, updatedAt: Date.now(), ...extra } : s)
        : [{ ...blank, ...extra }, ...prev];
      try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated.slice(0, 30))); } catch {}
      return updated.slice(0, 30);
    });
  };

  const saveMeta = useCallback((extra: Record<string, unknown> = {}) => {
    fetch('/api/meta', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionIdRef.current, founderName, productName, ...extra }),
    }).catch(() => {});
  }, [founderName, productName]);

  const addLog = (line: string) => setLogs(p => [...p, line]);

  const copyMsg = (msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const switchSession = async (sid: string) => {
    setActiveSessionId(sid);
    sessionIdRef.current = sid;
    localStorage.setItem('cto_session_id', sid);
    // Reset to loading state
    setMessages([]); setReport(null); setStep(1); setIsUnlocked(false); setReplyingTo(null);
    setAgents(INITIAL_AGENTS.map(a => ({ ...a })));

    try {
      const d = await fetch(`/api/history?sessionId=${sid}`).then(r => r.json());
      if (d.messages?.length) {
        setMessages(d.messages);
        setStep(3);
        setIsUnlocked(true);
        // Restore canvas state
        if (d.lastReport)   setReport(d.lastReport as StructuredReport);
        if (d.productName)  setProductName(d.productName);
        if (d.perspective)  setPerspective(d.perspective as Perspective);
        // Mark agents as synchronized since this is a resumed session
        setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'synchronized' as const, load: 5 })));
        addLog(`[SYSTEM] Session resumed: ${sid.slice(0, 24)}...`);
        addLog(`[ENGINE] ${d.messages.length} messages restored. Canvas unlocked.`);
      }
    } catch {
      addLog('[ERROR] Failed to load session from database.');
    }
  };

  const createNewSession = () => {
    const sid = newSid();
    localStorage.setItem('cto_session_id', sid);
    sessionIdRef.current = sid;
    setActiveSessionId(sid);
    setMessages([]); setReport(null); setStep(1); setIsUnlocked(false);
    setProductName(''); setReplyingTo(null);
    setAgents(INITIAL_AGENTS.map(a => ({ ...a })));
    setLogs(['[SYSTEM] New session created.', '[ENGINE] Ready for founder input...']);
  };

  const handleLogin = (name: string) => {
    localStorage.setItem('cto_founder', name);
    setFounderName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('cto_founder');
    setFounderName(null);
    setMessages([]); setReport(null); setStep(1); setReplyingTo(null);
  };

  const toggleTheme = () => { const n = !isDark; setIsDark(n); localStorage.setItem('cto_theme', n ? 'dark' : 'light'); };

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || step === 2) return;
    setInput('');
    const replyCtx = replyingTo;
    setReplyingTo(null);

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
      ...(replyCtx && { replyTo: replyCtx }),
    };
    const snap = messages;
    setMessages(p => [...p, userMsg]);
    setStep(2);
    setAgents(p => p.map(a => ({ ...a, status: 'debating' as const, load: Math.floor(Math.random() * 40) + 55 })));
    addLog(`[SYSTEM] Processing: "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`);

    // Save product meta
    saveMeta({ context: prompt, incrementPrompt: true, perspective });

    try {
      const res = await fetch('/api/cto', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, optionalContext: productName || undefined, history: snap, thinkingMode, perspective }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: StructuredReport = await res.json();
      setReport(data);

      const ts = Date.now();
      const agentMsgs: Message[] = [
        { id: `cto_${ts}`,  role: 'assistant', content: data.agentsFeedback.ctoAnalysis,     agent: 'CTO',      timestamp: ts + 700 },
        { id: `inf_${ts}`,  role: 'assistant', content: data.agentsFeedback.infraAnalysis,    agent: 'Infra',    timestamp: ts + 1500 },
        { id: `prd_${ts}`,  role: 'assistant', content: data.agentsFeedback.productAnalysis,  agent: 'Product',  timestamp: ts + 2300 },
        { id: `sec_${ts}`,  role: 'assistant', content: data.agentsFeedback.securityAnalysis, agent: 'Security', timestamp: ts + 3100 },
      ];

      for (const msg of agentMsgs) {
        setTypingAgent(msg.agent!);
        await delay(700 + Math.random() * 700);
        setTypingAgent(null);
        await delay(100);
        setMessages(p => [...p, msg]);
        await delay(180);
      }

      setStep(3);
      setAgents(p => p.map(a => ({ ...a, status: 'synchronized' as const, load: 5 })));
      addLog('[SUCCESS] All agents responded. Report synthesized.');
      addLog(`[MARKET] ${data.marketFeasibility.marketSizeStudy.slice(0, 80)}...`);
      addLog(`[ENGINE] ARR: ${data.marketFeasibility.expectedProfitARR}`);
      if (data.worthinessScore) {
        addLog(`[ENGINE] Worthiness: ${data.worthinessScore.overall}/100 · ${data.worthinessScore.sentiment.toUpperCase()}`);
      }

      const all = [...snap, userMsg, ...agentMsgs];
      fetch('/api/history', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId:   sessionIdRef.current,
          messages:    all,
          productName,
          perspective,
          lastReport:  data,
        }),
      }).catch(() => {});

      if (data.worthinessScore) {
        saveMeta({ worthinessScore: data.worthinessScore });
      }
      upsertSessionMeta(sessionIdRef.current, prompt.slice(0, 55), all.length, {
        productName, perspective, hasReport: true,
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`[ERROR] ${msg}`);
      setTypingAgent(null);
      setMessages(p => [...p, { id: `err_${Date.now()}`, role: 'assistant', content: `Synthesis failed: ${msg}`, agent: 'CTO', timestamp: Date.now() }]);
      setStep(snap.length > 0 ? 3 : 1);
      setAgents(p => p.map(a => ({ ...a, status: 'idle' as const, load: 0 })));
    }
  };

  const clearSession = async () => {
    setMessages([]); setReport(null); setStep(1); setIsUnlocked(false); setReplyingTo(null);
    setAgents(INITIAL_AGENTS.map(a => ({ ...a })));
    setLogs(['[SYSTEM] Session cleared.', '[ENGINE] Ready for new input.']);
    await fetch(`/api/history?sessionId=${sessionIdRef.current}`, { method: 'DELETE' }).catch(() => {});
    await fetch(`/api/meta?sessionId=${sessionIdRef.current}`, { method: 'DELETE' }).catch(() => {});
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────

  if (!founderName) return <AuthGate onLogin={handleLogin} />;


  // ── Shared chat section content ────────────────────────────────────────────

  const ChatSection = (
    <section
      className={`flex flex-col h-full min-h-0 border-r ${
        isDark ? 'bg-zinc-900/20 border-zinc-900' : 'bg-white border-zinc-200'
      }`}
    >
      {/* Chat header */}
      <div
        className={`shrink-0 px-4 py-2.5 border-b flex items-center justify-between gap-2 ${
          isDark
            ? 'border-zinc-900 bg-zinc-900/40'
            : 'border-zinc-100 bg-zinc-50'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AnimatePresence mode="wait">
            {step === 2 ? (
              <motion.div
                key="live"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 shrink-0"
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                  className="w-2 h-2 rounded-full bg-red-500"
                />
                <span className="font-mono text-[10px] font-bold text-red-400 tracking-wider whitespace-nowrap">
                  LIVE // IN SESSION
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 shrink-0"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-mono text-[10px] font-bold text-indigo-400 tracking-wider whitespace-nowrap hidden sm:inline">
                  WAR ROOM
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Perspective toggle */}
          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              isDark
                ? 'bg-zinc-950 border-zinc-800'
                : 'bg-zinc-100 border-zinc-200'
            }`}
          >
            {(['developer', 'management'] as Perspective[]).map((p) => (
              <motion.button
                key={p}
                onClick={() => setPerspective(p)}
                whileTap={{ scale: 0.95 }}
                className={`relative px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all ${
                  perspective === p
                    ? p === 'developer'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : isDark
                    ? 'text-zinc-600 hover:text-zinc-400'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {p === 'developer' ? '⚙ DEV' : '📊 MGMT'}
                {perspective === p && (
                  <motion.div
                    layoutId="persp-pill"
                    className="absolute inset-0 rounded-md -z-10"
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Perspective label */}
          <AnimatePresence mode="wait">
            <motion.span
              key={perspective}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              className={`text-[8px] font-mono hidden md:block ${
                perspective === 'developer'
                  ? 'text-indigo-400'
                  : 'text-emerald-400'
              }`}
            >
              {perspective === 'developer'
                ? 'Technical + Business'
                : 'Business + Marketing Only'}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {isEditingName ? (
              <motion.input
                key="inp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                autoFocus
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                onBlur={() => {
                  setIsEditingName(false);
                  saveMeta();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingName(false);
                    saveMeta();
                  }
                }}
                placeholder="Project name..."
                className={`px-2 py-0.5 w-32 font-mono text-[10px] font-bold border-b bg-transparent focus:outline-none focus:border-indigo-400 ${
                  isDark
                    ? 'text-zinc-100 border-zinc-700'
                    : 'text-zinc-900 border-zinc-300'
                }`}
              />
            ) : (
              <motion.span
                key="disp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditingName(true)}
                className="font-mono text-[10px] font-bold tracking-tight cursor-pointer hover:text-indigo-400 transition-colors underline decoration-dashed decoration-indigo-500/30"
              >
                {productName || 'Null Spec'}
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsEditingName(!isEditingName)}
            className={`p-1 rounded opacity-50 hover:opacity-100 transition-opacity ${
              isDark
                ? 'text-zinc-400 hover:bg-zinc-800'
                : 'text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <FiEdit2 size={11} />
          </button>
        </div>
      </div>

      {/* Live cross-talk bar */}
      <AnimatePresence>
        {step === 2 && !typingAgent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`shrink-0 px-4 py-2 border-b flex items-center gap-2 text-[9px] font-mono ${
              isDark
                ? 'bg-red-950/20 border-red-900/30 text-red-400'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            <FiActivity className="animate-pulse shrink-0" size={10} />
            <span>
              Agents are cross-referencing your prompt — Atlas is leading the
              synthesis...
            </span>
            <div className="ml-auto flex gap-1">
              {(['CTO', 'Infra', 'Product', 'Security'] as AgentKey[]).map(
                (k, idx) => (
                  <motion.div
                    key={k}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      delay: idx * 0.3,
                    }}
                    className={`w-1.5 h-1.5 rounded-full ${AGENT_DISPLAY[k].avatarColor}`}
                  />
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scroll-smooth">
        <AnimatePresence key="lk" initial={false}>
          {messages.length === 0 && !typingAgent && (
            <motion.div
              key="empty13"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-32 flex flex-col items-center justify-center gap-2"
            >
              <FiMessageSquare size={20} className="text-zinc-700" />
              <p
                className={`text-[10px] font-mono text-center ${
                  isDark ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                The war room is silent.
                <br />
                Describe your product to start the debate.
              </p>
            </motion.div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const d = msg.agent ? AGENT_DISPLAY[msg.agent] : null;
            const replyD = msg.replyTo?.agent
              ? AGENT_DISPLAY[msg.replyTo.agent]
              : null;

            // Clean fallback mapping to resolve the empty string key error safely
            const safeKey =
              msg.id && msg.id !== '' ? msg.id : `msg-fallback-${index}`;

            return (
              <motion.div
                key={safeKey}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={bounce}
                className={`flex gap-3 group ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] ring-2 self-end ${
                    isUser
                      ? 'bg-zinc-700 ring-zinc-600/40'
                      : d
                      ? `${d.avatarColor} ${d.ring}`
                      : 'bg-zinc-700 ring-zinc-600/40'
                  }`}
                >
                  {isUser ? (
                    <span className="font-bold text-[9px]">
                      {founderName.slice(0, 2).toUpperCase()}
                    </span>
                  ) : d ? (
                    <d.Icon />
                  ) : (
                    <FiCpu />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] ${
                    isUser ? 'items-end' : 'items-start'
                  } flex flex-col gap-1`}
                >
                  <div
                    className={`flex items-center gap-2 px-1 ${
                      isUser ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <span className="font-mono text-xs font-bold opacity-60">
                      {isUser ? (
                        founderName
                      ) : d ? (
                        <>
                          {d.name}{' '}
                          <span className="opacity-50 font-normal">
                            · {d.handle}
                          </span>
                        </>
                      ) : (
                        'Agent'
                      )}
                    </span>
                    <span
                      className={`text-[10px] font-mono opacity-30 ${
                        isDark ? 'text-zinc-400' : 'text-zinc-600'
                      }`}
                    >
                      {fmtTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Reply quote */}
                  {msg.replyTo && (
                    <div
                      className={`px-2.5 py-1.5 rounded-lg border-l-2 mb-1 max-w-full ${
                        isDark
                          ? 'bg-zinc-900/60 border-zinc-600 text-zinc-500'
                          : 'bg-zinc-100 border-zinc-400 text-zinc-500'
                      }`}
                    >
                      <span className="text-[8px] font-mono font-bold block mb-0.5">
                        {msg.replyTo.role === 'user'
                          ? founderName
                          : replyD
                          ? replyD.name
                          : 'Agent'}
                      </span>
                      <p className="text-[9px] truncate max-w-[200px]">
                        {msg.replyTo.content.slice(0, 80)}
                        {msg.replyTo.content.length > 80 ? '…' : ''}
                      </p>
                    </div>
                  )}

                  <div
                    className={`px-4 py-3.5 rounded-2xl border text-sm leading-relaxed relative ${
                      isUser
                        ? isDark
                          ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100 rounded-tr-sm'
                          : 'bg-indigo-100 border-indigo-200 text-indigo-900 rounded-tr-sm'
                        : msg.agent
                        ? isDark
                          ? `${AGENT_STYLES[msg.agent].darkBg} ${
                              AGENT_STYLES[msg.agent].darkBorder
                            } rounded-tl-sm`
                          : 'bg-zinc-100 border-zinc-200 rounded-tl-sm'
                        : isDark
                        ? 'bg-zinc-900/60 border-zinc-800 rounded-tl-sm'
                        : 'bg-zinc-100 border-zinc-200 rounded-tl-sm'
                    }`}
                  >
                    <RichMessage content={msg.content} isDark={isDark} />
                  </div>

                  {/* Agent role card */}
                  {!isUser && msg.agent && (
                    <AgentRoleCard
                      agent={msg.agent}
                      perspective={perspective}
                      isDark={isDark}
                    />
                  )}

                  {/* Actions (visible on hover) */}
                  <div
                    className={`flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isUser ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        setReplyingTo({
                          id: msg.id,
                          content: msg.content,
                          role: msg.role,
                          agent: msg.agent,
                        })
                      }
                      className={`p-1 rounded-lg text-[9px] font-mono flex items-center gap-1 ${
                        isDark
                          ? 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'
                          : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      <FiCornerUpLeft size={10} />
                      <span>Reply</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyMsg(msg)}
                      className={`p-1 rounded-lg text-[9px] font-mono flex items-center gap-1 ${
                        isDark
                          ? 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'
                          : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {copiedId === msg.id ? (
                        <FiCheck size={10} className="text-emerald-400" />
                      ) : (
                        <FiCopy size={10} />
                      )}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {typingAgent && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <div
                className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] ring-2 ${AGENT_DISPLAY[typingAgent].avatarColor} ${AGENT_DISPLAY[typingAgent].ring}`}
              >
                {React.createElement(AGENT_DISPLAY[typingAgent].Icon)}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] font-bold opacity-40 px-1">
                  {AGENT_DISPLAY[typingAgent].name}{' '}
                  <span className="opacity-60">
                    · {AGENT_DISPLAY[typingAgent].handle}
                  </span>
                </span>
                <TypingBubble agent={typingAgent} isDark={isDark} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className={`shrink-0 p-3 border-t ${
          isDark
            ? 'border-zinc-900 bg-zinc-950/60'
            : 'border-zinc-100 bg-zinc-50'
        }`}
      >
        {/* Reply preview */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-2 px-3 py-2 rounded-xl border-l-2 flex items-start justify-between gap-2 ${
                isDark
                  ? 'bg-zinc-900 border-indigo-500 text-zinc-400'
                  : 'bg-zinc-100 border-indigo-400 text-zinc-500'
              }`}
            >
              <div className="min-w-0">
                <span className="text-[8px] font-mono font-bold text-indigo-400 block mb-0.5">
                  Replying to{' '}
                  {replyingTo.role === 'user'
                    ? founderName
                    : replyingTo.agent
                    ? AGENT_DISPLAY[replyingTo.agent].name
                    : 'Agent'}
                </span>
                <p className="text-[9px] truncate">
                  {replyingTo.content.slice(0, 80)}
                  {replyingTo.content.length > 80 ? '…' : ''}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="shrink-0 p-0.5 rounded hover:text-red-400 transition-colors"
              >
                <FiX size={11} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!isUnlocked ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <div
              className={`flex-1 px-3 py-2.5 rounded-xl text-[10px] font-sans flex items-center border ${
                isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  : 'bg-white border-zinc-200 text-zinc-600'
              }`}
            >
              Project:{' '}
              <strong className="ml-1 text-indigo-400">
                {productName || 'Null Spec'}
              </strong>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsUnlocked(true)}
              className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/10"
            >
              Enter Context <FiArrowRight size={11} />
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={step === 2}
                placeholder={
                  replyingTo
                    ? 'Type your reply...'
                    : `Speak to the war room${
                        productName ? ` about ${productName}` : ''
                      }... (Enter)`
                }
                className={`flex-1 px-3 py-2.5 rounded-xl text-[11px] font-mono border focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-all ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-900 text-zinc-100 placeholder-zinc-600'
                    : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                } disabled:opacity-50`}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={step === 2 || !input.trim()}
                className="px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/10 self-end"
              >
                {step === 2 ? (
                  <FiRefreshCw size={13} className="animate-spin" />
                ) : (
                  <FiZap size={13} />
                )}
              </motion.button>
            </div>
            <p
              className={`text-[9px] font-mono ${
                isDark ? 'text-zinc-700' : 'text-zinc-400'
              }`}
            >
              Enter ↵ send · Shift+Enter newline · Hover messages to reply or
              copy
            </p>
          </div>
        )}
      </div>
    </section>
  );

  // ── Shared canvas content ──────────────────────────────────────────────────

  const CanvasSection = (
    <section className={`flex flex-col h-full min-h-0 ${isDark ? 'bg-zinc-900/10' : 'bg-zinc-50'}`}>
      {/* Tabs */}
      <div className={`shrink-0 flex items-center justify-between px-4 py-2 border-b ${isDark ? 'border-zinc-900 bg-zinc-900/40' : 'border-zinc-100 bg-white'}`}>
        <div className="flex gap-1">
          {RIGHT_TABS[perspective].map(tab => (
            <button key={tab.key} onClick={() => step === 3 && setActiveTab(tab.key)} disabled={step < 3}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-medium transition-all flex items-center gap-1.5 ${step < 3 ? 'opacity-25 cursor-not-allowed' : activeTab === tab.key ? 'text-indigo-400 bg-indigo-500/5 font-bold border border-indigo-500/10' : 'text-zinc-500 border border-transparent hover:text-zinc-400'}`}>
              {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {step === 3 && report && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] rounded-lg font-mono font-bold">
                <FiCheckCircle size={9} /><span>SYNCED</span>
              </motion.div>
            )}
          </AnimatePresence>
          {step === 3 && report && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={async () => { setPdfLoading(true); await downloadPDF(report, productName, founderName!).catch(console.error); setPdfLoading(false); }}
              disabled={pdfLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all ${isDark ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20' : 'bg-indigo-100 border border-indigo-200 text-indigo-600 hover:bg-indigo-200'}`}>
              {pdfLoading ? <FiRefreshCw size={9} className="animate-spin" /> : <FiDownload size={9} />}
              <span>PDF</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        {step < 3 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-3">
            <FiGrid size={32} className="animate-pulse text-indigo-400" />
            <p className="text-[10px] font-mono tracking-wide">Awaiting agent consensus output...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>

              {/* Code Tab */}
              {activeTab === 'code' && (
                report ? (
                  <div className="space-y-5">
                    <div className={`px-3 py-2.5 rounded-xl border font-mono text-[10px] flex items-center justify-between ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                      <div>
                        <p className="text-indigo-400 font-bold">
                          {perspective === 'management' ? '// PITCH BRIEF: ' : '// BLUEPRINT: '}{(productName || 'UNTITLED').toUpperCase()}
                        </p>
                        <p className="opacity-40 text-[9px] mt-0.5">
                          {perspective === 'management' ? 'Qwen AI · Business Strategy · War Room Output' : 'Qwen AI · Next.js 16 · APP_ROUTER'}
                        </p>
                      </div>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold ${perspective === 'management' ? 'bg-emerald-900/40 border-emerald-700/30 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                        {perspective === 'management' ? 'MGMT_MODE' : 'AI_GENERATED'}
                      </span>
                    </div>
                    <CodeBlock
                      title={perspective === 'management' ? 'pitch-deck.md' : 'frontend.tsx'}
                      code={report.nextjsFrontendCode} isDark={isDark} />
                    <CodeBlock
                      title={perspective === 'management' ? 'ops-plan.md' : 'route.ts'}
                      code={report.routeBackendCode} isDark={isDark} />
                  </div>
                ) : <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>No code yet.</p>
              )}

              {/* Roadmap Tab */}
              {activeTab === 'roadmap' && report && (
                <div className="space-y-3">
                  {/* Worthiness Scores */}
                  {report.worthinessScore && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FiBarChart2 className="text-indigo-400" size={12} />
                          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-indigo-400">WORTHINESS ASSESSMENT</span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg border ${
                          report.worthinessScore.sentiment === 'bullish'  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                          report.worthinessScore.sentiment === 'cautious' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          report.worthinessScore.sentiment === 'bearish'  ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                          'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                        }`}>{report.worthinessScore.sentiment}</span>
                      </div>
                      <div className="space-y-2.5">
                        <ScoreBar label="OVERALL BUILD WORTHINESS" value={report.worthinessScore.overall} color="text-indigo-400" isDark={isDark} />
                        <ScoreBar label="TECHNICAL FEASIBILITY" value={report.worthinessScore.technical} color="text-emerald-400" isDark={isDark} />
                        <ScoreBar label="MARKET OPPORTUNITY" value={report.worthinessScore.market} color="text-amber-400" isDark={isDark} />
                        <ScoreBar label="SECURITY POSTURE" value={report.worthinessScore.security} color="text-cyan-400" isDark={isDark} />
                      </div>
                      <p className={`mt-3 text-[9px] font-mono italic ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>"{report.worthinessScore.summary}"</p>
                    </motion.div>
                  )}

                  {/* Agent analyses */}
                  {([
                    { agent: 'CTO',      content: report.agentsFeedback.ctoAnalysis },
                    { agent: 'Infra',    content: report.agentsFeedback.infraAnalysis },
                    { agent: 'Product',  content: report.agentsFeedback.productAnalysis },
                    { agent: 'Security', content: report.agentsFeedback.securityAnalysis },
                  ] as const).map(({ agent, content }, i) => {
                    const d = AGENT_DISPLAY[agent]; const s = AGENT_STYLES[agent];
                    return (
                      <motion.div key={agent} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, ...bounce }}
                        className={`p-3.5 rounded-xl border ${isDark ? `${s.darkBg} ${s.darkBorder}` : 'bg-zinc-50 border-zinc-200'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1 rounded-lg text-white text-[9px] ${d.avatarColor}`}><d.Icon /></div>
                          <div>
                            <span className={`font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isDark ? s.badge : 'bg-zinc-200 text-zinc-600'}`}>{d.name}</span>
                            <span className="ml-1.5 text-[8px] font-mono opacity-40">{d.handle}</span>
                          </div>
                        </div>
                        <RichMessage content={content} isDark={isDark} />
                      </motion.div>
                    );
                  })}

                  {/* Market Feasibility */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ...bounce }}
                    className={`p-3.5 rounded-xl border ${isDark ? 'bg-gradient-to-br from-zinc-900/60 to-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <FiTrendingUp className="text-emerald-400" size={11} />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-400">MARKET FEASIBILITY</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { l: 'TAM/SAM/SOM', v: report.marketFeasibility.marketSizeStudy },
                        { l: 'ARR Projection', v: report.marketFeasibility.expectedProfitARR },
                        { l: 'Risk Mitigation', v: report.marketFeasibility.riskMitigation },
                      ].map(({ l, v }) => (
                        <div key={l} className={`px-2.5 py-2 rounded-lg ${isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-white border border-zinc-200'}`}>
                          <span className="font-mono text-zinc-500 text-[9px] uppercase block mb-1">{l}</span>
                          <RichMessage content={v} isDark={isDark} />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Logs Tab */}
              {activeTab === 'logs' && (
                <div className={`font-mono text-[10px] p-3.5 rounded-xl border min-h-48 overflow-y-auto space-y-1 ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                  {logs.map((line, i) => (
                    <motion.p key={i} initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.006 }} className={getLogColor(line)}>{line}</motion.p>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`h-screen w-full flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden transition-colors duration-500 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed z-[9999] px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-200 shadow-2xl pointer-events-none"
            style={{ top: '64px', right: '24px' }}>
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className={`shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b ${isDark ? 'border-zinc-900 bg-zinc-950/90' : 'border-zinc-200 bg-white/90'} backdrop-blur-md z-50`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="shrink-0 p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <FiCpu className="text-base sm:text-lg animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[10px] sm:text-xs font-black font-mono tracking-tight uppercase truncate">QWEN CO-FOUNDER ENGINE</h1>
              <span className="hidden sm:inline text-[8px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono shrink-0">v4.0</span>
            </div>
            <p className="text-[8px] opacity-40 font-mono tracking-widest hidden sm:block">MULTI-AGENT WAR ROOM</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setThinkingMode(!thinkingMode)}
            onMouseEnter={() => setTooltip('Qwen3 chain-of-thought reasoning')} onMouseLeave={() => setTooltip(null)}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-mono font-bold transition-all ${thinkingMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-500' : 'bg-zinc-100 border border-zinc-200 text-zinc-500'}`}>
            <span className="hidden sm:inline">REASONING </span>{thinkingMode ? 'ON' : 'OFF'}
          </motion.button>
          {[
            { icon: <FiHelpCircle size={13} />, tip: 'Help', fn: () => setShowHelp(!showHelp), hi: showHelp ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : '' },
            { icon: <FiTrash2 size={13} />, tip: 'Clear', fn: clearSession, hi: '' },
            { icon: isDark ? <FiSun size={13} /> : <FiMoon size={13} />, tip: 'Theme', fn: toggleTheme, hi: '' },
          ].map(({ icon, tip, fn, hi }, i) => (
            <motion.button key={i} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={fn} onMouseEnter={() => setTooltip(tip)} onMouseLeave={() => setTooltip(null)}
              className={`p-1.5 sm:p-2 rounded-xl border cursor-pointer transition-all ${hi || (isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100')}`}>
              {icon}
            </motion.button>
          ))}
        </div>
      </header>

      {/* ── AGENT STATUS BAR ────────────────────────────────────────────────── */}
      <div className={`shrink-0 px-4 sm:px-6 py-2 border-b flex items-center gap-2 overflow-x-auto ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-100'}`}>
        <div className={`flex items-center gap-1.5 pr-2 sm:pr-3 border-r shrink-0 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <FiActivity className="text-indigo-400 animate-pulse" size={10} />
          <span className="font-mono text-[8px] sm:text-[9px] font-bold tracking-wider opacity-50 whitespace-nowrap">WAR ROOM:</span>
        </div>
        {INITIAL_AGENTS.map((a, i) => {
          const live = agents[i];
          return (
            <motion.div key={i}
              onMouseEnter={() => setTooltip(`${live.role} — Load: ${live.load}%`)} onMouseLeave={() => setTooltip(null)}
              animate={live.status === 'debating' ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={live.status === 'debating' ? { repeat: Infinity, duration: 1.2 } : {}}
              className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono transition-all cursor-help shrink-0 ${live.color}`}>
              <span className={live.status === 'debating' ? 'animate-spin' : ''}>{a.icon}</span>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-[9px]">{live.name}</span>
                <span className="text-[7px] opacity-40 capitalize hidden sm:block">{live.status}</span>
              </div>
              <span className={`w-1.5 h-1.5 rounded-full ${live.status === 'idle' ? 'bg-zinc-600' : live.status === 'debating' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
            </motion.div>
          );
        })}
      </div>

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────────────── */}

      {/* Help overlay — shared across all layouts */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }} transition={bounce}
              className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 flex flex-col ${isDark ? 'bg-zinc-950 border-amber-500/20' : 'bg-white border-amber-300'}`}>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-2 text-amber-400"><FiTerminal className="animate-pulse" /><span className="font-bold font-mono text-sm">SYSTEM HELP</span></div>
                <button onClick={() => setShowHelp(false)} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300"><FiMinimize2 size={14} /></button>
              </div>
              <div className="space-y-3 overflow-y-auto text-sm leading-relaxed">
                {[
                  ['AUTH', 'Founder identity stored locally. Logout to reset.'],
                  ['SESSIONS', 'Switch or create sessions from the sidebar. All messages and canvas data saved to MongoDB.'],
                  ['WAR ROOM', 'Submit a product idea. Atlas leads, Rex challenges, Nova focuses, Cipher audits. Hover messages to Reply or Copy.'],
                  ['PERSPECTIVE', '⚙ DEV = technical + business depth. 📊 MGMT = pure business language for non-technical stakeholders.'],
                  ['REPLY', 'Hover any message → Reply — quoted context appears in your next message (WhatsApp-style).'],
                  ['PDF', 'Click PDF in Canvas after first response to download the full war room report with worthiness scores.'],
                ].map(([l, d]) => (
                  <p key={l} className={`${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    <span className="text-amber-400 font-bold font-mono">{l}: </span>{d}
                  </p>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar slide-over (for lg breakpoint) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden" />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className={`fixed top-0 left-0 h-full w-72 z-50 shadow-2xl xl:hidden ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
              <SessionsSidebar
                sessions={sessions} activeId={activeSessionId}
                onSelect={id => { switchSession(id); setSidebarOpen(false); }}
                onNew={() => { createNewSession(); setSidebarOpen(false); }}
                founderName={founderName} onLogout={handleLogout} isDark={isDark} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DESKTOP 3-panel (xl+: 1280px) ──────────────────────────────────── */}
      <main className="hidden xl:grid xl:grid-cols-12 flex-1 min-h-0 relative">
        <div className="col-span-2 min-h-0">
          <SessionsSidebar sessions={sessions} activeId={activeSessionId} onSelect={switchSession} onNew={createNewSession} founderName={founderName} onLogout={handleLogout} isDark={isDark} />
        </div>
        <div className="col-span-5 min-h-0">{ChatSection}</div>
        <div className="col-span-5 min-h-0">{CanvasSection}</div>
      </main>

      {/* ── TABLET 2-panel (lg–xl: 1024–1279px) ────────────────────────────── */}
      <main className="hidden lg:flex xl:hidden flex-1 min-h-0">
        <div className="flex-1 min-h-0 flex flex-col border-r" style={{ width: '56%' }}>{ChatSection}</div>
        <div className="min-h-0 flex flex-col" style={{ width: '44%' }}>{CanvasSection}</div>
      </main>

      {/* ── MOBILE single-panel + bottom nav (< lg) ─────────────────────────── */}
      <main className="flex lg:hidden flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0">
          {mobilePanel === 'chat'     && ChatSection}
          {mobilePanel === 'canvas'   && CanvasSection}
          {mobilePanel === 'sessions' && (
            <div className="h-full">
              <SessionsSidebar sessions={sessions} activeId={activeSessionId}
                onSelect={id => { switchSession(id); setMobilePanel('chat'); }}
                onNew={() => { createNewSession(); setMobilePanel('chat'); }}
                founderName={founderName} onLogout={handleLogout} isDark={isDark} />
            </div>
          )}
        </div>
        <div className={`shrink-0 flex border-t ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'}`}>
          {([
            { key: 'sessions', icon: <FiList size={18} />, label: 'Sessions' },
            { key: 'chat',     icon: <FiMessageSquare size={18} />, label: 'War Room' },
            { key: 'canvas',   icon: <FiCode size={18} />, label: 'Canvas' },
          ] as const).map(({ key, icon, label }) => (
            <button key={key} onClick={() => setMobilePanel(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${mobilePanel === key ? 'text-indigo-400' : isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {icon}
              <span className="text-[10px] font-mono">{label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
