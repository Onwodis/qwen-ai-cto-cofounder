'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiCode, FiCheckSquare, FiTerminal, FiBarChart2,
  FiCheckCircle, FiDownload, FiRefreshCw, FiZap, FiTrendingUp,
  FiLock, FiFileText,
} from 'react-icons/fi';
import type { StructuredReport, Perspective, CanvasTab, Message } from '@/app/types';
import { CodeOutput } from './CodeOutput';
import { RoadmapTab } from './RoadmapTab';
import { LogsTab } from './LogsTab';

interface CanvasPanelProps {
  report: StructuredReport | null;
  perspective: Perspective;
  logs: string[];
  messages: Message[];
  isUnlocked: boolean;
  productName: string;
  founderName: string;
  isDark: boolean;
}

type TabConfig = { key: CanvasTab; label: string; icon: React.ReactNode };

const DEV_TABS: TabConfig[] = [
  { key: 'code',    label: 'Code Output',  icon: <FiCode size={11} /> },
  { key: 'roadmap', label: 'Roadmap',      icon: <FiCheckSquare size={11} /> },
  { key: 'logs',    label: 'System Logs',  icon: <FiTerminal size={11} /> },
];

const MGMT_TABS: TabConfig[] = [
  { key: 'code',    label: 'Pitch Brief',   icon: <FiBarChart2 size={11} /> },
  { key: 'roadmap', label: 'Strategy Map',  icon: <FiTrendingUp size={11} /> },
  { key: 'logs',    label: 'War Room Log',  icon: <FiTerminal size={11} /> },
];

// ── Rich "unlock" placeholder shown when canvas is open but no war room run yet ─
function WarRoomPrompt({
  tab, perspective, isDark,
}: { tab: 'code' | 'roadmap'; perspective: Perspective; isDark: boolean }) {
  const isMgmt = perspective === 'management';

  const codeItems = isMgmt
    ? ['Pitch deck — value proposition & revenue model', 'Operations plan — team, vendors, 90-day milestones', 'Budget breakdown & KPI framework']
    : ['Production-ready Next.js 16 App Router component', 'API route handler with full TypeScript types', 'Tailwind-styled UI with hooks & error handling'];

  const roadmapItems = isMgmt
    ? ['Build worthiness scores (Overall, Market, Technical, Security)', 'Atlas, Rex, Nova & Cipher boardroom verdicts', 'TAM/SAM/SOM market sizing & ARR projections', 'Risk register with mitigation strategies']
    : ['Build worthiness scores with animated bars', 'Full agent analyses — CTO, Infra, Product, Security', 'Market feasibility & Year 1–3 ARR projections', 'Risk assessment & threat model summary'];

  const items = tab === 'code' ? codeItems : roadmapItems;
  const icon  = tab === 'code' ? <FiCode size={20} /> : <FiCheckSquare size={20} />;
  const label = tab === 'code'
    ? (isMgmt ? 'Pitch Brief & Ops Plan' : 'Code Blueprint')
    : (isMgmt ? 'Strategy Map'           : 'Roadmap & Analysis');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col items-center justify-center px-6 py-12 text-center"
    >
      <div className={`p-4 rounded-2xl border mb-5 ${isDark ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
        <div className="text-indigo-400">{icon}</div>
      </div>

      <h3 className={`font-mono font-bold text-sm mb-1 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
        {label}
      </h3>
      <p className={`text-[10px] font-mono mb-5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
        Run a <span className="text-indigo-400 font-bold">⚡ War Room</span> session to generate this output
      </p>

      <div className="space-y-2 w-full max-w-xs text-left">
        {items.map((item, i) => (
          <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-[9px] font-mono ${isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'}`}>
            <FiZap size={9} className="text-indigo-400 shrink-0 mt-0.5" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className={`mt-6 flex items-center gap-1.5 text-[9px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
        <FiLock size={9} />
        <span>Switch to War Room mode → send your pitch to unlock</span>
      </div>
    </motion.div>
  );
}

export function CanvasPanel({
  report, perspective, logs, messages, isUnlocked, productName, founderName, isDark,
}: CanvasPanelProps) {
  const [activeTab, setActiveTab] = useState<CanvasTab>('code');
  const [pdfLoading, setPdfLoading] = useState(false);

  const tabs = perspective === 'management' ? MGMT_TABS : DEV_TABS;

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const { downloadPDF } = await import('@/app/lib/pdf');
      await downloadPDF(report, productName, founderName, messages, logs, perspective);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <section className={`flex flex-col h-full min-h-0 ${isDark ? 'bg-zinc-900/10' : 'bg-zinc-50'}`}>

      {/* ── Tabs header ── */}
      <div className={`shrink-0 flex items-center justify-between px-4 py-2 border-b ${isDark ? 'border-zinc-900 bg-zinc-900/40' : 'border-zinc-100 bg-white'}`}>
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => isUnlocked && setActiveTab(tab.key)}
              disabled={!isUnlocked}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-medium transition-all flex items-center gap-1.5 ${
                !isUnlocked
                  ? 'opacity-25 cursor-not-allowed'
                  : activeTab === tab.key
                  ? 'cursor-pointer text-indigo-400 bg-indigo-500/5 font-bold border border-indigo-500/10'
                  : 'cursor-pointer text-zinc-500 border border-transparent hover:text-zinc-400'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* SYNCED badge — only when a full report is loaded */}
          <AnimatePresence>
            {isUnlocked && report && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] rounded-lg font-mono font-bold"
              >
                <FiCheckCircle size={9} />
                <span>SYNCED</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PDF button — always visible once canvas is unlocked */}
          {isUnlocked && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              title={report ? 'Download full war room report' : 'Download session PDF (messages + logs)'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                report
                  ? isDark ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20' : 'bg-indigo-100 border border-indigo-200 text-indigo-600 hover:bg-indigo-200'
                  : isDark ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 border border-zinc-200 text-zinc-500 hover:bg-zinc-200'
              }`}
            >
              {pdfLoading
                ? <FiRefreshCw size={9} className="animate-spin" />
                : report ? <FiDownload size={9} /> : <FiFileText size={9} />
              }
              <span>{report ? 'PDF' : 'Export'}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isUnlocked ? (
          /* Canvas fully locked — no messages yet */
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-3 p-8">
            <FiGrid size={32} className="animate-pulse text-indigo-400" />
            <p className="text-[10px] font-mono tracking-wide">
              Awaiting agent consensus output...
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'code' && (
                report
                  ? <div className="p-4"><CodeOutput report={report} productName={productName} perspective={perspective} isDark={isDark} /></div>
                  : <WarRoomPrompt tab="code" perspective={perspective} isDark={isDark} />
              )}

              {activeTab === 'roadmap' && (
                report
                  ? <div className="p-4"><RoadmapTab report={report} isDark={isDark} /></div>
                  : <WarRoomPrompt tab="roadmap" perspective={perspective} isDark={isDark} />
              )}

              {activeTab === 'logs' && (
                <div className="p-4">
                  <LogsTab logs={logs} isDark={isDark} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
