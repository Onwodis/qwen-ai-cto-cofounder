'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiRefreshCw, FiX } from 'react-icons/fi';
import type { ReplyContext, ChatMode, AllManagerKey } from '@/app/types';
import { CHAT_MODES, getManagerProfile } from '@/app/constants/agents';

interface ChatInputProps {
  value: string;
  isLoading: boolean;
  replyingTo: ReplyContext | null;
  mode: ChatMode;
  selectedManager: AllManagerKey | null;
  isDark: boolean;
  onChange: (val: string) => void;
  onSend: () => void;
  onCancelReply: () => void;
}

export function ChatInput({
  value, isLoading, replyingTo, mode, selectedManager, isDark,
  onChange, onSend, onCancelReply,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeConfig = CHAT_MODES.find(m => m.id === mode);
  const replyProfile = replyingTo?.agent ? getManagerProfile(replyingTo.agent) : null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSend();
    }
  };

  const respondingParty = mode === 'one-on-one'
    ? (selectedManager ? (getManagerProfile(selectedManager)?.name ?? selectedManager) : 'your advisor')
    : `${modeConfig?.managers.length ?? 0} managers`;

  return (
    <div className={`shrink-0 p-4 border-t ${isDark ? 'border-zinc-900 bg-zinc-950/60' : 'border-zinc-100 bg-zinc-50'}`}>
      {/* Reply preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-3 px-3 py-2 rounded-xl border-l-2 flex items-start justify-between gap-2 ${isDark ? 'bg-zinc-900 border-indigo-500 text-zinc-400' : 'bg-zinc-100 border-indigo-400 text-zinc-500'}`}
          >
            <div className="min-w-0">
              <span className="text-[8px] font-mono font-bold text-indigo-400 block mb-0.5">
                Replying to {replyingTo.role === 'user' ? 'yourself' : (replyProfile?.name ?? 'Agent')}
              </span>
              <p className="text-[9px] truncate">
                {replyingTo.content.slice(0, 80)}{replyingTo.content.length > 80 ? '…' : ''}
              </p>
            </div>
            <button onClick={onCancelReply} className="shrink-0 p-0.5 rounded hover:text-red-400 transition-colors cursor-pointer">
              <FiX size={11} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className={`rounded-2xl border transition-all ${
        isLoading
          ? isDark ? 'border-indigo-500/30 bg-zinc-900/40' : 'border-indigo-300/50 bg-zinc-50'
          : isDark ? 'border-zinc-800 bg-zinc-900/60 focus-within:border-indigo-500/50' : 'border-zinc-200 bg-white focus-within:border-indigo-400'
      }`}>
        {/* Who will respond hint */}
        <div className={`px-4 pt-3 pb-1 text-[9px] font-mono font-bold tracking-wider ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {isLoading
            ? `⟳  ${respondingParty} ${mode === 'one-on-one' ? 'is' : 'are'} responding...`
            : `↵  ${modeConfig?.emoji ?? '⚡'} Send to ${respondingParty}`
          }
        </div>

        <textarea
          ref={textareaRef}
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={
            replyingTo
              ? 'Type your reply... (Enter to send, Shift+Enter for newline)'
              : `Ask your ${mode === 'board' ? 'board' : mode === 'one-on-one' ? 'advisor' : 'team'} anything... (Enter to send)`
          }
          className={`w-full px-4 py-2 text-sm font-sans border-0 bg-transparent focus:outline-none resize-none transition-all ${
            isDark ? 'text-zinc-100 placeholder-zinc-600' : 'text-zinc-900 placeholder-zinc-400'
          } disabled:opacity-50`}
        />

        {/* Actions row */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <p className={`text-[9px] font-mono ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>
            Shift+Enter for newline · Hover messages to reply or copy
          </p>
          <div className="flex items-center gap-2">
            {value.trim().length > 0 && (
              <span className={`text-[9px] font-mono ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>
                {value.length}
              </span>
            )}
            <motion.button
              whileHover={!isLoading && value.trim() ? { scale: 1.05 } : {}}
              whileTap={!isLoading && value.trim() ? { scale: 0.95 } : {}}
              onClick={() => !isLoading && value.trim() && onSend()}
              disabled={isLoading || !value.trim()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                isLoading || !value.trim()
                  ? isDark ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/20'
              }`}
            >
              {isLoading
                ? <><FiRefreshCw size={12} className="animate-spin" /><span>Thinking...</span></>
                : <><FiSend size={12} /><span>Send</span></>
              }
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
