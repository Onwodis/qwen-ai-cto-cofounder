'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMessageSquare, FiLogOut, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import type { SessionMeta } from '@/app/types';

interface SessionsSidebarProps {
  sessions: SessionMeta[];
  activeId: string;
  founderName: string;
  isDark: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onLogout: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}

export function SessionsSidebar({
  sessions, activeId, founderName, isDark, onSelect, onNew, onLogout, onDelete, onDeleteAll,
}: SessionsSidebarProps) {
  const initials = founderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) {
      onDelete(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  };

  const handleDeleteAll = () => {
    if (confirmDeleteAll) {
      onDeleteAll();
      setConfirmDeleteAll(false);
    } else {
      setConfirmDeleteAll(true);
    }
  };

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
            className="cursor-pointer p-1 rounded-lg text-zinc-600 hover:text-red-400 transition-colors"
          >
            <FiLogOut size={11} />
          </button>
        </div>

        <button
          onClick={onNew}
          className="cursor-pointer w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold transition-all"
        >
          <FiPlus size={11} />
          <span>New Session</span>
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="flex items-center justify-between px-1 py-1">
          <p className="text-[8px] font-mono font-bold text-zinc-600 tracking-wider">
            RECENT SESSIONS
          </p>
          {sessions.length > 0 && (
            <button
              onClick={handleDeleteAll}
              title={confirmDeleteAll ? 'Confirm — delete all' : 'Delete all sessions'}
              className={`cursor-pointer flex items-center gap-1 text-[7px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${
                confirmDeleteAll
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400 animate-pulse'
                  : 'text-zinc-700 hover:text-red-400'
              }`}
            >
              {confirmDeleteAll ? <FiAlertTriangle size={8} /> : <FiTrash2 size={8} />}
              <span>{confirmDeleteAll ? 'CONFIRM' : 'CLEAR ALL'}</span>
            </button>
          )}
        </div>

        {/* Cancel confirm-delete-all on click-away */}
        {confirmDeleteAll && (
          <button
            className="sr-only"
            onClick={() => setConfirmDeleteAll(false)}
            tabIndex={-1}
          />
        )}

        {sessions.length === 0 && (
          <p className="text-[9px] font-mono text-zinc-700 px-2 py-4 text-center">
            No sessions yet
          </p>
        )}

        <AnimatePresence initial={false}>
          {sessions.map(s => {
            const isActive = s.id === activeId;
            const isConfirmingDelete = deletingId === s.id;

            return (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8, height: 0, marginTop: 0 }}
                transition={{ duration: 0.15 }}
                className="relative group"
              >
                <button
                  onClick={() => { setDeletingId(null); onSelect(s.id); }}
                  className={`cursor-pointer w-full text-left px-2.5 py-2.5 rounded-xl transition-all border pr-8 ${
                    isActive
                      ? isDark ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
                      : isDark ? 'hover:bg-zinc-900/80 border-transparent hover:border-zinc-800' : 'hover:bg-zinc-100 border-transparent'
                  } ${isConfirmingDelete ? 'border-red-500/30 bg-red-500/5' : ''}`}
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
                        {isConfirmingDelete ? 'Click trash to confirm delete' : (s.preview || 'Session')}
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
                </button>

                {/* Delete button — visible on hover or confirm state */}
                <button
                  onClick={e => handleDeleteSession(e, s.id)}
                  title={isConfirmingDelete ? 'Confirm delete' : 'Delete session'}
                  className={`cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                    isConfirmingDelete
                      ? 'text-red-400 bg-red-500/20 opacity-100'
                      : 'text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <FiTrash2 size={10} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
