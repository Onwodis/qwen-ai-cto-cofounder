'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCpu, FiZap, FiArrowRight } from 'react-icons/fi';

const spring = { type: 'spring' as const, stiffness: 380, damping: 26 };

interface AuthGateProps {
  onLogin: (name: string) => void;
}

export function AuthGate({ onLogin }: AuthGateProps) {
  const [name, setName] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onLogin(name.trim());
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-600/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.5) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...spring, delay: 0.1 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-black/60">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-2xl shadow-indigo-600/30 mb-4"
            >
              <FiCpu size={28} />
            </motion.div>
            <h1 className="text-lg font-black font-mono text-zinc-100 tracking-tight">
              QWEN CO-FOUNDER ENGINE
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 tracking-[0.2em] mt-1">
              MULTI-AGENT ADVISORY PLATFORM v4.0
            </p>
            <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
              {['Atlas', 'Rex', 'Nova', 'Cipher', 'Victoria', 'Marcus', 'Diana', 'Robert', 'Sarah', 'James', 'Alexis'].map((a, i) => (
                <motion.span
                  key={a}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="text-[7px] px-1.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono font-bold"
                >
                  {a}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 tracking-wider mb-2">
                FOUNDER NAME
              </label>
              <motion.input
                animate={shake ? { x: [-6, 6, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="e.g. Samuel Onwodi"
                className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-sans text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
              <p className="text-[9px] text-zinc-600 font-mono mt-1.5">
                Your name is stored locally — no account required.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono text-sm font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <FiZap size={15} />
              <span>Enter the War Room</span>
              <FiArrowRight size={14} />
            </motion.button>
          </div>

          <p className="text-center text-[10px] text-zinc-600 font-mono mt-5">
            11 AI managers · Qwen AI · Alibaba Cloud DashScope
          </p>
        </div>
      </motion.div>
    </div>
  );
}
