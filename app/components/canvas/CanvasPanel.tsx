'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGrid, FiCode, FiCheckSquare, FiTerminal, FiBarChart2, FiCheckCircle, FiDownload, FiRefreshCw } from 'react-icons/fi';
import type { StructuredReport, Perspective, CanvasTab } from '@/app/types';
import { CodeOutput } from './CodeOutput';
import { RoadmapTab } from './RoadmapTab';
import { LogsTab } from './LogsTab';

interface CanvasPanelProps {
  report: StructuredReport | null;
  perspective: Perspective;
  logs: string[];
  isUnlocked: boolean;
  productName: string;
  founderName: string;
  isDark: boolean;
}

type TabConfig = { key: CanvasTab; label: string; icon: React.ReactNode };

const DEV_TABS: TabConfig[] = [
  { key: 'code',    label: 'Code Output', icon: <FiCode size={11} /> },
  { key: 'roadmap', label: 'Roadmap',     icon: <FiCheckSquare size={11} /> },
  { key: 'logs',    label: 'System Logs', icon: <FiTerminal size={11} /> },
];

const MGMT_TABS: TabConfig[] = [
  { key: 'code',    label: 'Pitch Brief',  icon: <FiBarChart2 size={11} /> },
  { key: 'roadmap', label: 'Strategy Map', icon: <FiCheckSquare size={11} /> },
  { key: 'logs',    label: 'War Room Log', icon: <FiTerminal size={11} /> },
];

export function CanvasPanel({ report, perspective, logs, isUnlocked, productName, founderName, isDark }: CanvasPanelProps) {
  const [activeTab, setActiveTab] = useState<CanvasTab>('code');
  const [pdfLoading, setPdfLoading] = useState(false);

  const tabs = perspective === 'management' ? MGMT_TABS : DEV_TABS;

  const handleDownloadPDF = async () => {
    if (!report) return;
    setPdfLoading(true);
    try {
      const { downloadPDF } = await import('@/app/lib/pdf');
      await downloadPDF(report, productName, founderName);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <section className={`flex flex-col h-full min-h-0 ${isDark ? 'bg-zinc-900/10' : 'bg-zinc-50'}`}>
      {/* Tabs header */}
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
                  ? 'text-indigo-400 bg-indigo-500/5 font-bold border border-indigo-500/10'
                  : 'text-zinc-500 border border-transparent hover:text-zinc-400'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isUnlocked && report && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] rounded-lg font-mono font-bold"
              >
                <FiCheckCircle size={9} />
                <span>SYNCED</span>
              </motion.div>
            )}
          </AnimatePresence>

          {isUnlocked && report && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all ${isDark ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20' : 'bg-indigo-100 border border-indigo-200 text-indigo-600 hover:bg-indigo-200'}`}
            >
              {pdfLoading ? <FiRefreshCw size={9} className="animate-spin" /> : <FiDownload size={9} />}
              <span>PDF</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        {!isUnlocked ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-3">
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
            >
              {activeTab === 'code' && (
                report
                  ? <CodeOutput report={report} productName={productName} perspective={perspective} isDark={isDark} />
                  : <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>No output yet.</p>
              )}
              {activeTab === 'roadmap' && (
                report
                  ? <RoadmapTab report={report} isDark={isDark} />
                  : <p className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>No roadmap yet.</p>
              )}
              {activeTab === 'logs' && (
                <LogsTab logs={logs} isDark={isDark} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
