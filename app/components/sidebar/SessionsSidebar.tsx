'use client';

import { motion } from 'framer-motion';
import { FiPlus, FiMessageSquare, FiLogOut } from 'react-icons/fi';
import type { SessionMeta } from '@/app/types';

interface SessionsSidebarProps {
  sessions: SessionMeta[];
  activeId: string;
  founderName: string;
  isDark: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onLogout: () => void;
}

export function SessionsSidebar({
  sessions, activeId, founderName, isDark, onSelect, onNew, onLogout,
}: SessionsSidebarProps) {
  const initials = founderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`flex flex-col h-full border-r ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
      {/* Founder header */}
      <div className={`p-3 border-b ${isDark ? 'border-zinc-900' : 'border-zinc-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold font-mono shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold font-mono text-zinc-300 truncate">{founderName}</p>
            <p className="text-[8px] text-zinc-600 font-mono">FOUNDER</p>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-1 rounded-lg text-zinc-600 hover:text-red-400 transition-colors"
          >
            <FiLogOut size={11} />
          </button>
        </div>

        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold transition-all"
        >
          <FiPlus size={11} />
          <span>New Session</span>
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <p className="text-[8px] font-mono font-bold text-zinc-600 tracking-wider px-1 py-1">
          RECENT SESSIONS
        </p>

        {sessions.length === 0 && (
          <p className="text-[9px] font-mono text-zinc-700 px-2 py-4 text-center">
            No sessions yet
          </p>
        )}

        {sessions.map(s => {
          const isActive = s.id === activeId;
          return (
            <motion.button
              key={s.id}
              onClick={() => onSelect(s.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left px-2.5 py-2.5 rounded-xl transition-all border ${
                isActive
                  ? isDark ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
                  : isDark ? 'hover:bg-zinc-900/80 border-transparent hover:border-zinc-800' : 'hover:bg-zinc-100 border-transparent'
              }`}
            >
              <div className="flex items-start gap-1.5">
                <FiMessageSquare
                  size={10}
                  className={`mt-0.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-600'}`}
                />
                <div className="min-w-0 flex-1">
                  {s.productName && (
                    <p className={`text-[8px] font-mono font-bold truncate mb-0.5 ${isActive ? 'text-indigo-400' : 'text-zinc-600'}`}>
                      {s.productName}
                    </p>
                  )}
                  <p className={`text-[9px] font-mono truncate leading-tight ${isActive ? 'text-indigo-200' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {s.preview || 'Session'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[7px] text-zinc-700">{s.count} msg{s.count !== 1 ? 's' : ''}</span>
                    {s.perspective && (
                      <span className={`text-[6px] px-1 py-0.5 rounded font-mono font-bold uppercase ${
                        s.perspective === 'management'
                          ? 'bg-emerald-900/40 text-emerald-600'
                          : 'bg-indigo-900/40 text-indigo-600'
                      }`}>
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
