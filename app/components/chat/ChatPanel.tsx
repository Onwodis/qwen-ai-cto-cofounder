'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiActivity, FiMessageSquare, FiEdit2 } from 'react-icons/fi';
import type { Message, AllManagerKey, ChatMode, Perspective, ReplyContext } from '@/app/types';
import { getModeManagers, CHAT_MODES } from '@/app/constants/agents';
import { ModeSelector } from '@/app/components/sidebar/ModeSelector';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';

interface ChatPanelProps {
  messages: Message[];
  typingManagers: AllManagerKey[];
  isLoading: boolean;
  mode: ChatMode;
  selectedManager: AllManagerKey | null;
  perspective: Perspective;
  thinkingMode: boolean;
  replyingTo: ReplyContext | null;
  copiedId: string | null;
  founderName: string;
  productName: string;
  isDark: boolean;
  inputValue: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onModeChange: (mode: ChatMode) => void;
  onManagerChange: (manager: AllManagerKey) => void;
  onPerspectiveChange: (p: Perspective) => void;
  onThinkingModeToggle: () => void;
  onReply: (msg: Message) => void;
  onCopy: (msg: Message) => void;
  onCancelReply: () => void;
  onProductNameChange: (name: string) => void;
  onProductNameSave: () => void;
}

export function ChatPanel({
  messages, typingManagers, isLoading, mode, selectedManager, perspective,
  thinkingMode, replyingTo, copiedId, founderName, productName, isDark,
  inputValue, onInputChange, onSend, onModeChange, onManagerChange,
  onPerspectiveChange, onThinkingModeToggle, onReply, onCopy, onCancelReply,
  onProductNameChange, onProductNameSave,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modeConfig = CHAT_MODES.find(m => m.id === mode);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingManagers]);

  return (
    <section className={`flex flex-col h-full min-h-0 border-r ${isDark ? 'bg-zinc-900/20 border-zinc-900' : 'bg-white border-zinc-200'}`}>
      {/* ── Header ── */}
      <div className={`shrink-0 px-4 py-2.5 border-b flex items-center justify-between gap-2 ${isDark ? 'border-zinc-900 bg-zinc-900/40' : 'border-zinc-100 bg-zinc-50'}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Live / idle indicator */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 shrink-0">
                <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}
                  className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-mono text-[10px] font-bold text-red-400 tracking-wider whitespace-nowrap">
                  LIVE // IN SESSION
                </span>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 shrink-0">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-mono text-[10px] font-bold text-indigo-400 tracking-wider whitespace-nowrap hidden sm:inline">
                  {modeConfig?.label?.toUpperCase() ?? 'WAR ROOM'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Perspective toggle */}
          <div className={`flex items-center p-0.5 rounded-lg border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
            {(['developer', 'management'] as Perspective[]).map(p => (
              <motion.button key={p} onClick={() => onPerspectiveChange(p)} whileTap={{ scale: 0.95 }}
                className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all ${
                  perspective === p
                    ? p === 'developer'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : isDark ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-600'
                }`}>
                {p === 'developer' ? '⚙ DEV' : '📊 MGMT'}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.span key={perspective} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 4 }}
              className={`text-[8px] font-mono hidden md:block ${perspective === 'developer' ? 'text-indigo-400' : 'text-emerald-400'}`}>
              {perspective === 'developer' ? 'Technical + Business' : 'Business Only'}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Product name + thinking mode */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onThinkingModeToggle}
            className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold transition-all ${
              thinkingMode
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-600' : 'bg-zinc-100 border border-zinc-200 text-zinc-400'
            }`}>
            {thinkingMode ? '🧠 ON' : '🧠 OFF'}
          </button>

          <div className="flex items-center gap-1">
            <input
              type="text"
              value={productName}
              onChange={e => onProductNameChange(e.target.value)}
              onBlur={onProductNameSave}
              onKeyDown={e => e.key === 'Enter' && onProductNameSave()}
              placeholder="Project name"
              className={`w-28 px-2 py-0.5 font-mono text-[10px] font-bold border-b bg-transparent focus:outline-none focus:border-indigo-400 ${isDark ? 'text-zinc-100 border-zinc-700 placeholder-zinc-600' : 'text-zinc-900 border-zinc-300 placeholder-zinc-400'}`}
            />
            <FiEdit2 size={10} className={isDark ? 'text-zinc-600' : 'text-zinc-400'} />
          </div>
        </div>
      </div>

      {/* ── Mode Selector Strip ── */}
      <ModeSelector
        activeMode={mode}
        selectedManager={selectedManager}
        isDark={isDark}
        onModeChange={onModeChange}
        onManagerChange={onManagerChange}
      />

      {/* ── Live cross-talk bar ── */}
      <AnimatePresence>
        {isLoading && typingManagers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`shrink-0 px-4 py-2 border-b flex items-center gap-2 text-[9px] font-mono ${isDark ? 'bg-red-950/20 border-red-900/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}
          >
            <FiActivity className="animate-pulse shrink-0" size={10} />
            <span>
              {mode === 'board'
                ? 'Board deliberating — Victoria is leading the discussion...'
                : mode === 'tech-review'
                ? 'Engineering team reviewing — Kai is coordinating...'
                : mode === 'full-council'
                ? 'Full council in session — all 12 advisors responding...'
                : mode === 'one-on-one'
                ? 'Your advisor is preparing a response...'
                : 'War room active — Atlas is coordinating the team...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.length === 0 && !isLoading && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center gap-3 py-16">
              <FiMessageSquare size={24} className={perspective === 'management' ? 'text-violet-700' : 'text-indigo-700'} />
              <div className={`text-[10px] font-mono text-center leading-relaxed space-y-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <p className="font-bold uppercase tracking-widest text-[9px]">
                  {mode === 'board' ? '👔 Board Room is Ready' : mode === 'tech-review' ? '🔧 Engineering Team is Ready' : mode === 'warroom' ? '⚡ War Room is Ready' : mode === 'full-council' ? '🌐 Full Council is Ready' : '💬 Advisor is Ready'}
                </p>
                <p>
                  {mode === 'board'
                    ? 'Victoria, Marcus, Diana, Robert, Sarah, James & Alexis are waiting.'
                    : mode === 'tech-review'
                    ? 'Kai, Luna, Sage & Finn will review your implementation.'
                    : mode === 'warroom'
                    ? 'Atlas, Rex, Nova & Cipher will synthesize + generate code.'
                    : mode === 'one-on-one'
                    ? `Start a private session with your advisor.`
                    : 'All 12 managers are standing by.'}
                </p>
                <p className="opacity-60">
                  {perspective === 'developer' ? 'DEV mode — technical + business language' : 'MGMT mode — business strategy only'}
                </p>
              </div>
            </motion.div>
          )}

          {messages.map((msg, index) => (
            <ChatMessage
              key={msg.id || `msg-${index}`}
              message={msg}
              perspective={perspective}
              founderName={founderName}
              isDark={isDark}
              copiedId={copiedId}
              onReply={() => onReply(msg)}
              onCopy={() => onCopy(msg)}
            />
          ))}
        </AnimatePresence>

        {/* Typing indicators */}
        <AnimatePresence>
          {typingManagers.map(key => (
            <motion.div key={key} className="flex gap-3">
              <TypingIndicator managerKey={key} isDark={isDark} />
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <ChatInput
        value={inputValue}
        isLoading={isLoading}
        replyingTo={replyingTo}
        mode={mode}
        selectedManager={selectedManager}
        isDark={isDark}
        onChange={onInputChange}
        onSend={onSend}
        onCancelReply={onCancelReply}
      />
    </section>
  );
}
