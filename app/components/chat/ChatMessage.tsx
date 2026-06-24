'use client';

import { motion } from 'framer-motion';
import { FiCornerUpLeft, FiCopy, FiCheck } from 'react-icons/fi';
import type { Message, Perspective } from '@/app/types';
import { getManagerProfile } from '@/app/constants/agents';
import { RichMessage } from '@/app/components/ui/RichMessage';
import { ManagerCard } from '@/app/components/managers/ManagerCard';

const spring = { type: 'spring' as const, stiffness: 380, damping: 26 };

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ChatMessageProps {
  message: Message;
  founderName: string;
  isDark: boolean;
  perspective: Perspective;
  copiedId: string | null;
  onReply: (msg: Message) => void;
  onCopy: (msg: Message) => void;
}

export function ChatMessage({ message, founderName, isDark, perspective, copiedId, onReply, onCopy }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const profile = message.agent ? getManagerProfile(message.agent) : null;
  const replyProfile = message.replyTo?.agent ? getManagerProfile(message.replyTo.agent) : null;

  // Switch content when perspective is toggled — fallback to management version if devContent absent
  const isDevMode = !isUser && perspective === 'developer';
  const displayContent = isDevMode && message.devContent ? message.devContent : message.content;
  const displayHeading = isDevMode && message.devHeading ? message.devHeading : message.heading;

  const bubbleStyle = isUser
    ? isDark
      ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100 rounded-tr-sm'
      : 'bg-indigo-100 border-indigo-200 text-indigo-900 rounded-tr-sm'
    : profile
    ? isDark
      ? `${profile.darkBg} ${profile.darkBorder} rounded-tl-sm`
      : 'bg-zinc-100 border-zinc-200 rounded-tl-sm'
    : isDark
    ? 'bg-zinc-900/60 border-zinc-800 rounded-tl-sm'
    : 'bg-zinc-100 border-zinc-200 rounded-tl-sm';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-bold font-mono ring-2 self-end ${
        isUser
          ? 'bg-zinc-700 ring-zinc-600/40'
          : profile
          ? `${profile.avatarColor} ${profile.ringColor}`
          : 'bg-zinc-700 ring-zinc-600/40'
      }`}>
        {isUser ? founderName.slice(0, 2).toUpperCase() : (profile?.initials ?? '??')}
      </div>

      {/* Content column */}
      <div className={`max-w-[85%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Name + time */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="font-mono text-xs font-bold opacity-60">
            {isUser ? founderName : profile ? (
              <>{profile.name} <span className="opacity-50 font-normal">· {profile.title.split(' ').slice(0, 2).join(' ')}</span></>
            ) : 'Agent'}
          </span>
          <span className={`text-[10px] font-mono opacity-30 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {fmtTime(message.timestamp)}
          </span>
        </div>

        {/* Heading — switches with perspective */}
        {!isUser && displayHeading && (
          <div className={`px-1 font-mono text-[9px] font-bold tracking-[0.15em] uppercase ${
            isDevMode ? 'text-indigo-400' : isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            {displayHeading}
          </div>
        )}

        {/* Reply quote */}
        {message.replyTo && (
          <div className={`px-2.5 py-1.5 rounded-lg border-l-2 mb-1 max-w-full ${isDark ? 'bg-zinc-900/60 border-zinc-600 text-zinc-500' : 'bg-zinc-100 border-zinc-400 text-zinc-500'}`}>
            <span className="text-[8px] font-mono font-bold block mb-0.5">
              {message.replyTo.role === 'user' ? founderName : replyProfile?.name ?? 'Agent'}
            </span>
            <p className="text-[9px] truncate max-w-[200px]">
              {message.replyTo.content.slice(0, 80)}{message.replyTo.content.length > 80 ? '…' : ''}
            </p>
          </div>
        )}

        {/* Bubble — content switches instantly when perspective is toggled */}
        <div className={`px-4 py-3.5 rounded-2xl border text-sm leading-relaxed relative ${bubbleStyle}`}>
          <RichMessage content={displayContent} isDark={isDark} />
        </div>

        {/* Manager role card (agent messages only) */}
        {!isUser && message.agent && (
          <ManagerCard managerKey={message.agent} isDark={isDark} />
        )}

        {/* Hover actions */}
        <div className={`flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onReply(message)}
            className={`cursor-pointer p-1 rounded-lg text-[9px] font-mono flex items-center gap-1 ${isDark ? 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200'}`}
          >
            <FiCornerUpLeft size={10} />
            <span>Reply</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onCopy(message)}
            className={`cursor-pointer p-1 rounded-lg text-[9px] font-mono flex items-center gap-1 ${isDark ? 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200'}`}
          >
            {copiedId === message.id
              ? <FiCheck size={10} className="text-emerald-400" />
              : <FiCopy size={10} />
            }
            <span>{copiedId === message.id ? 'Copied' : 'Copy'}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
