'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMode, AllManagerKey } from '@/app/types';
import { CHAT_MODES, ALL_MANAGERS } from '@/app/constants/agents';

interface ModeSelectorProps {
  activeMode: ChatMode;
  selectedManager: AllManagerKey | null;
  isDark: boolean;
  onModeChange: (mode: ChatMode) => void;
  onManagerChange: (manager: AllManagerKey) => void;
}

export function ModeSelector({
  activeMode, selectedManager, isDark, onModeChange, onManagerChange,
}: ModeSelectorProps) {
  const [showManagerPicker, setShowManagerPicker] = useState(false);

  const handleModeChange = (mode: ChatMode) => {
    onModeChange(mode);
    setShowManagerPicker(mode === 'one-on-one');
  };

  return (
    <div className={`border-b ${isDark ? 'border-zinc-900 bg-zinc-950/80' : 'border-zinc-200 bg-zinc-50'}`}>
      {/* Mode pills */}
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
        {CHAT_MODES.map(cm => (
          <motion.button
            key={cm.id}
            onClick={() => handleModeChange(cm.id)}
            whileTap={{ scale: 0.95 }}
            title={cm.description}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all shrink-0 ${
              activeMode === cm.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : isDark
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                : 'bg-zinc-100 border border-zinc-200 text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <span>{cm.emoji}</span>
            <span>{cm.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Mode description */}
      <div className={`px-3 pb-2 flex items-center gap-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
        <span className="text-[9px] font-mono">
          {CHAT_MODES.find(m => m.id === activeMode)?.description}
        </span>
        {activeMode === 'one-on-one' && selectedManager && (
          <span className="text-[9px] font-mono text-indigo-400 font-bold">
            · with {ALL_MANAGERS.find(m => m.key === selectedManager)?.name ?? selectedManager}
          </span>
        )}
      </div>

      {/* Manager picker for 1:1 mode */}
      <AnimatePresence>
        {(activeMode === 'one-on-one' && showManagerPicker) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`overflow-hidden border-t ${isDark ? 'border-zinc-900' : 'border-zinc-200'}`}
          >
            <div className="p-3">
              <p className={`text-[8px] font-mono font-bold tracking-wider mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                SELECT YOUR ADVISOR
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ALL_MANAGERS.map(m => (
                  <motion.button
                    key={m.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onManagerChange(m.key);
                      setShowManagerPicker(false);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      selectedManager === m.key
                        ? `${m.darkBg} ${m.darkBorder} ring-1 ${m.ringColor}`
                        : isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md ${m.avatarColor} flex items-center justify-center text-white text-[8px] font-bold font-mono shrink-0`}>
                      {m.initials}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[9px] font-mono font-bold truncate ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {m.name}
                      </p>
                      <p className={`text-[7px] font-mono truncate ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {m.domain === 'business' ? '👔' : '⚙'} {m.title.split(' ').slice(0, 2).join(' ')}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
