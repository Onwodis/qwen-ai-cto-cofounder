'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCpu, FiActivity, FiSun, FiMoon, FiTrash2,
  FiHelpCircle, FiMinimize2, FiTerminal, FiList,
  FiMessageSquare, FiCode,
} from 'react-icons/fi';
import type { AllManagerKey, Message } from '@/app/types';
import { useChat } from '@/app/hooks/useChat';
import { useSession } from '@/app/hooks/useSession';
import { AuthGate } from '@/app/components/auth/AuthGate';
import { SessionsSidebar } from '@/app/components/sidebar/SessionsSidebar';
import { ChatPanel } from '@/app/components/chat/ChatPanel';
import { CanvasPanel } from '@/app/components/canvas/CanvasPanel';
import { getModeManagers, ALL_MANAGERS_MAP } from '@/app/constants/agents';

export default function CtoWorkspace() {
  const [founderName, setFounderName] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'canvas' | 'sessions'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // ── Panel resize state (desktop + tablet) ───────────────────────────────────
  const [sidebarPct, setSidebarPct] = useState(16.67);
  const [chatPct, setChatPct]       = useState(41.67);
  const desktopRef = useRef<HTMLElement>(null);
  const tabletRef  = useRef<HTMLElement>(null);
  const dragRef    = useRef<{
    divider: 'sidebar-chat' | 'chat-canvas';
    startX: number;
    startSidebar: number;
    startChat: number;
    container: HTMLElement;
  } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const totalW = d.container.getBoundingClientRect().width;
      const dxPct  = ((e.clientX - d.startX) / totalW) * 100;
      if (d.divider === 'sidebar-chat') {
        setSidebarPct(Math.max(11, Math.min(28, d.startSidebar + dxPct)));
      } else {
        setChatPct(Math.max(24, Math.min(62, d.startChat + dxPct)));
      }
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor        = '';
      document.body.style.userSelect    = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const startDrag = useCallback((
    divider: 'sidebar-chat' | 'chat-canvas',
    e: React.MouseEvent,
    container: HTMLElement | null,
  ) => {
    if (!container) return;
    e.preventDefault();
    dragRef.current = { divider, startX: e.clientX, startSidebar: sidebarPct, startChat: chatPct, container };
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarPct, chatPct]);

  const session = useSession(founderName);
  const chat = useChat();

  useEffect(() => {
    const name = localStorage.getItem('cto_founder');
    if (name) setFounderName(name);
    const theme = localStorage.getItem('cto_theme');
    if (theme) setIsDark(theme === 'dark');
  }, []);

  useEffect(() => {
    if (!founderName) return;
    let sid = localStorage.getItem('cto_session_id');
    if (!sid) {
      sid = session.createNewSession();
    } else {
      session.sessionIdRef.current = sid;
    }
    session.loadSessionsList();

    fetch(`/api/history?sessionId=${sid}`)
      .then(r => r.json())
      .then(d => {
        if (d.messages?.length) {
          chat.setMessages(d.messages as Message[]);
          if (d.lastReport) session.setManagementReport(d.lastReport);
          if (d.productName) session.setProductName(d.productName);
          if (d.perspective) chat.setPerspective(d.perspective);
          session.addLog('[ENGINE] Previous session restored from database.');
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [founderName]);

  const handleLogin = (name: string) => {
    localStorage.setItem('cto_founder', name);
    setFounderName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('cto_founder');
    setFounderName(null);
    chat.clearMessages();
    session.setManagementReport(null);
    session.setDevReport(null);
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('cto_theme', next ? 'dark' : 'light');
  };

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || !founderName) return;
    const input = inputValue;
    setInputValue('');

    chat.sendMessage(input, {
      sessionId: session.sessionIdRef.current,
      productName: session.productName,
      founderName,
      onReportGenerated: (report) => {
        session.setManagementReport(report);
        if (report.worthinessScore) {
          session.saveMeta(
            session.sessionIdRef.current,
            founderName,
            session.productName,
            { worthinessScore: report.worthinessScore }
          );
        }
      },
      onLogAdd: session.addLog,
      onHistorySave: (messages, report) => {
        session.saveHistory(
          messages,
          session.sessionIdRef.current,
          session.productName,
          chat.perspective,
          report
        );
        session.upsertSessionMeta(
          session.sessionIdRef.current,
          input.slice(0, 55),
          messages.length,
          { productName: session.productName, perspective: chat.perspective, hasReport: !!report }
        );
      },
      onMetaSave: (extra) => {
        session.saveMeta(
          session.sessionIdRef.current,
          founderName,
          session.productName,
          extra
        );
      },
    });
  }, [inputValue, founderName, chat, session]);

  const handleSelectSession = async (sid: string) => {
    chat.clearMessages();
    const data = await session.switchSession(sid);
    if (data) {
      chat.setMessages(data.messages);
      if (data.perspective) chat.setPerspective(data.perspective);
    }
    setSidebarOpen(false);
  };

  const handleNewSession = () => {
    chat.clearMessages();
    session.createNewSession();
    setSidebarOpen(false);
  };

  const handleClearSession = async () => {
    chat.clearMessages();
    await session.clearCurrentSession(session.sessionIdRef.current);
    session.setManagementReport(null);
    session.setDevReport(null);
  };

  if (!founderName) return <AuthGate onLogin={handleLogin} />;

  // Dynamic status bar — reflects active mode's managers
  const activeManagerKeys = getModeManagers(chat.mode, chat.selectedManager).slice(0, 7);
  const activeStatusAgents = activeManagerKeys.map(key => ALL_MANAGERS_MAP[key]).filter(Boolean);

  // Report switches with perspective toggle
  const activeReport = chat.perspective === 'developer'
    ? (session.devReport ?? session.managementReport)
    : session.managementReport;

  const isMgmtMode = chat.perspective === 'management';

  const chatPanel = (
    <ChatPanel
      messages={chat.messages}
      typingManagers={chat.typingManagers}
      isLoading={chat.isLoading}
      mode={chat.mode}
      selectedManager={chat.selectedManager}
      perspective={chat.perspective}
      thinkingMode={chat.thinkingMode}
      replyingTo={chat.replyingTo}
      copiedId={chat.copiedId}
      founderName={founderName}
      productName={session.productName}
      isDark={isDark}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onSend={handleSend}
      onModeChange={chat.setMode}
      onManagerChange={(m: AllManagerKey) => chat.setSelectedManager(m)}
      onPerspectiveChange={chat.setPerspective}
      onThinkingModeToggle={() => chat.setThinkingMode(!chat.thinkingMode)}
      onReply={msg => chat.setReplyingTo({ id: msg.id, content: msg.content, role: msg.role, agent: msg.agent })}
      onCopy={chat.copyMessage}
      onCancelReply={() => chat.setReplyingTo(null)}
      onProductNameChange={session.setProductName}
      onProductNameSave={() => session.saveMeta(session.sessionIdRef.current, founderName, session.productName)}
    />
  );

  const canvasPanel = (
    <CanvasPanel
      report={activeReport}
      perspective={chat.perspective}
      logs={session.logs}
      isUnlocked={chat.messages.length > 0}
      productName={session.productName}
      founderName={founderName}
      isDark={isDark}
    />
  );

  const sidebar = (
    <SessionsSidebar
      sessions={session.sessions}
      activeId={session.sessionId}
      founderName={founderName}
      isDark={isDark}
      onSelect={handleSelectSession}
      onNew={handleNewSession}
      onLogout={handleLogout}
    />
  );

  return (
    <div className={`h-screen w-full flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden transition-colors duration-500 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[9999] px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-200 shadow-2xl pointer-events-none"
            style={{ top: '64px', right: '24px' }}
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className={`shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b ${isDark ? 'border-zinc-900 bg-zinc-950/90' : 'border-zinc-200 bg-white/90'} backdrop-blur-md z-50`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={`shrink-0 p-2 rounded-xl text-white shadow-lg transition-all duration-300 ${isMgmtMode ? 'bg-gradient-to-br from-violet-600 to-purple-600 shadow-violet-600/20' : 'bg-gradient-to-br from-indigo-600 to-cyan-600 shadow-indigo-600/20'}`}>
            <FiCpu className="text-base sm:text-lg animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[10px] sm:text-xs font-black font-mono tracking-tight uppercase truncate">
                QWEN CO-FOUNDER ENGINE
              </h1>
              <AnimatePresence mode="wait">
                <motion.span
                  key={isMgmtMode ? 'mgmt-badge' : 'dev-badge'}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className={`hidden sm:inline text-[8px] px-1.5 py-0.5 rounded-md border font-mono font-bold shrink-0 ${isMgmtMode ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}
                >
                  {isMgmtMode ? '👔 MGMT' : '⚙ DEV'}
                </motion.span>
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={isMgmtMode ? 'mgmt-sub' : 'dev-sub'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="text-[8px] font-mono tracking-widest hidden sm:block"
              >
                {isMgmtMode ? '7-EXEC BOARD · STRATEGIC ADVISORY' : '8-ENGINEER SQUAD · TECHNICAL REVIEW'}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {[
            { icon: <FiHelpCircle size={13} />, tip: 'Help', fn: () => setShowHelp(!showHelp), active: showHelp },
            { icon: <FiTrash2 size={13} />, tip: 'Clear session', fn: handleClearSession, active: false },
            { icon: isDark ? <FiSun size={13} /> : <FiMoon size={13} />, tip: 'Toggle theme', fn: toggleTheme, active: false },
          ].map(({ icon, tip, fn, active }, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={fn}
              onMouseEnter={() => setTooltip(tip)}
              onMouseLeave={() => setTooltip(null)}
              className={`p-1.5 sm:p-2 rounded-xl border cursor-pointer transition-all ${
                active
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {icon}
            </motion.button>
          ))}
        </div>
      </header>

      {/* ── Agent Status Bar (mode-aware) ── */}
      <div className={`shrink-0 px-4 sm:px-6 py-2 border-b flex items-center gap-2 overflow-x-auto transition-colors duration-300 ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-100'}`}>
        <div className={`flex items-center gap-1.5 pr-3 border-r shrink-0 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <FiActivity className={`animate-pulse transition-colors ${isMgmtMode ? 'text-violet-400' : 'text-indigo-400'}`} size={10} />
          <span className="font-mono text-[8px] sm:text-[9px] font-bold tracking-wider opacity-50 whitespace-nowrap">
            {isMgmtMode ? 'BOARD:' : 'TEAM:'}
          </span>
        </div>
        <AnimatePresence mode="popLayout">
          {activeStatusAgents.map(a => {
            const isTyping = chat.typingManagers.includes(a.key as AllManagerKey);
            return (
              <motion.div
                key={a.key}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isTyping ? { scale: [1, 1.04, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={isTyping ? { repeat: Infinity, duration: 1.2 } : { duration: 0.25 }}
                onMouseEnter={() => setTooltip(a.title)}
                onMouseLeave={() => setTooltip(null)}
                className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono transition-all cursor-help shrink-0 ${a.badgeColor} ${a.darkBorder}`}
              >
                <div className={`w-4 h-4 rounded-md ${a.avatarColor} flex items-center justify-center text-white text-[7px] font-bold font-mono`}>
                  {a.initials}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-[9px]">{a.name.split(' ')[0]}</span>
                  <span className="text-[7px] opacity-40 hidden sm:block">
                    {isTyping ? 'typing...' : 'ready'}
                  </span>
                </div>
                <span className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-amber-400 animate-ping' : chat.isLoading ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-600'}`} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Help Modal ── */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 flex flex-col ${isDark ? 'bg-zinc-950 border-amber-500/20' : 'bg-white border-amber-300'}`}
            >
              <div className={`flex items-center justify-between border-b pb-3 mb-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <div className="flex items-center gap-2 text-amber-400">
                  <FiTerminal className="animate-pulse" />
                  <span className="font-bold font-mono text-sm">SYSTEM HELP</span>
                </div>
                <button onClick={() => setShowHelp(false)} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300">
                  <FiMinimize2 size={14} />
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto text-sm leading-relaxed">
                {([
                  ['WAR ROOM ⚡', 'Atlas (CTO), Rex (Infra), Nova (Product) & Cipher (Security) — strategic tech synthesis + code output.'],
                  ['BOARD MEETING 👔', '7 executives (Victoria, Marcus, Diana, Robert, Sarah, James, Alexis) — pure strategy, zero tech jargon.'],
                  ['TECH REVIEW 🔧', 'Kai (Data/ML), Luna (Frontend), Sage (Backend) & Finn (QA) — deep implementation review. Different team from War Room.'],
                  ['1:1 CHAT 💬', 'Pick any of the 12 managers for a focused private advisory session.'],
                  ['FULL COUNCIL 🌐', 'All 12 managers respond — complete business + technical coverage.'],
                  ['⚙ DEV / 📊 MGMT TOGGLE', 'Switch between technical and business language. All chat messages re-render to match the selected mode instantly.'],
                  ['CANVAS', 'Code Output, Roadmap, and Logs unlock after the first War Room synthesis.'],
                  ['PDF', 'Export a 3-page war room report after any War Room session.'],
                ] as [string, string][]).map(([l, d]) => (
                  <p key={l} className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
                    <span className="text-amber-400 font-bold font-mono">{l}: </span>{d}
                  </p>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar slide-over (sm/md) ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className={`fixed top-0 left-0 h-full w-72 z-50 shadow-2xl xl:hidden ${isDark ? 'bg-zinc-950' : 'bg-white'}`}
            >
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop 3-panel (xl+) — drag borders to resize ── */}
      <main ref={desktopRef} className="hidden xl:flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <div className="shrink-0 min-h-0 overflow-hidden" style={{ width: `${sidebarPct}%` }}>
          {sidebar}
        </div>

        {/* Divider: sidebar ↔ chat */}
        <div
          onMouseDown={e => startDrag('sidebar-chat', e, desktopRef.current)}
          onDoubleClick={() => setSidebarPct(16.67)}
          className={`shrink-0 w-[5px] cursor-col-resize relative group select-none z-10 ${isDark ? 'bg-zinc-900 hover:bg-indigo-500/25' : 'bg-zinc-200 hover:bg-indigo-400/25'} transition-colors`}
          title="Drag to resize · Double-click to reset"
        >
          <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px group-hover:w-0.5 transition-all ${isDark ? 'bg-zinc-800 group-hover:bg-indigo-500/60' : 'bg-zinc-300 group-hover:bg-indigo-400/60'}`} />
        </div>

        {/* Chat panel */}
        <div className="shrink-0 min-h-0 overflow-hidden" style={{ width: `${chatPct}%` }}>
          {chatPanel}
        </div>

        {/* Divider: chat ↔ canvas */}
        <div
          onMouseDown={e => startDrag('chat-canvas', e, desktopRef.current)}
          onDoubleClick={() => setChatPct(41.67)}
          className={`shrink-0 w-[5px] cursor-col-resize relative group select-none z-10 ${isDark ? 'bg-zinc-900 hover:bg-indigo-500/25' : 'bg-zinc-200 hover:bg-indigo-400/25'} transition-colors`}
          title="Drag to resize · Double-click to reset"
        >
          <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px group-hover:w-0.5 transition-all ${isDark ? 'bg-zinc-800 group-hover:bg-indigo-500/60' : 'bg-zinc-300 group-hover:bg-indigo-400/60'}`} />
        </div>

        {/* Canvas — takes remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">{canvasPanel}</div>
      </main>

      {/* ── Tablet 2-panel (lg–xl) — drag border to resize ── */}
      <main ref={tabletRef} className="hidden lg:flex xl:hidden flex-1 min-h-0 overflow-hidden">
        <div className="shrink-0 min-h-0 flex flex-col overflow-hidden" style={{ width: `${chatPct + sidebarPct}%` }}>
          {chatPanel}
        </div>

        {/* Divider: chat ↔ canvas */}
        <div
          onMouseDown={e => startDrag('chat-canvas', e, tabletRef.current)}
          onDoubleClick={() => setChatPct(41.67)}
          className={`shrink-0 w-[5px] cursor-col-resize relative group select-none z-10 ${isDark ? 'bg-zinc-900 hover:bg-indigo-500/25' : 'bg-zinc-200 hover:bg-indigo-400/25'} transition-colors`}
          title="Drag to resize · Double-click to reset"
        >
          <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px group-hover:w-0.5 transition-all ${isDark ? 'bg-zinc-800 group-hover:bg-indigo-500/60' : 'bg-zinc-300 group-hover:bg-indigo-400/60'}`} />
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{canvasPanel}</div>
      </main>

      {/* ── Mobile single-panel + bottom nav ── */}
      <main className="flex lg:hidden flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0">
          {mobilePanel === 'chat'     && chatPanel}
          {mobilePanel === 'canvas'   && canvasPanel}
          {mobilePanel === 'sessions' && <div className="h-full">{sidebar}</div>}
        </div>
        <div className={`shrink-0 flex border-t ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'}`}>
          {([
            { key: 'sessions', icon: <FiList size={18} />, label: 'Sessions' },
            { key: 'chat',     icon: <FiMessageSquare size={18} />, label: 'Chat' },
            { key: 'canvas',   icon: <FiCode size={18} />, label: 'Canvas' },
          ] as const).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setMobilePanel(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${mobilePanel === key ? (isMgmtMode ? 'text-violet-400' : 'text-indigo-400') : isDark ? 'text-zinc-600' : 'text-zinc-400'}`}
            >
              {icon}
              <span className="text-[10px] font-mono">{label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
