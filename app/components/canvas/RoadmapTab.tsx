'use client';

import { motion } from 'framer-motion';
import { FiBarChart2, FiTrendingUp } from 'react-icons/fi';
import type { StructuredReport, AgentKey, AgentsFeedback } from '@/app/types';
import { ScoreBar } from '@/app/components/ui/ScoreBar';
import { RichMessage } from '@/app/components/ui/RichMessage';
import { TECHNICAL_MANAGERS } from '@/app/constants/agents';

const spring = { type: 'spring' as const, stiffness: 300, damping: 26 };

const SCORE_BARS = [
  { label: 'OVERALL BUILD WORTHINESS', field: 'overall' as const, colorClass: 'text-indigo-400', from: 'from-indigo-600', to: 'to-indigo-400' },
  { label: 'TECHNICAL FEASIBILITY',    field: 'technical' as const, colorClass: 'text-emerald-400', from: 'from-emerald-600', to: 'to-emerald-400' },
  { label: 'MARKET OPPORTUNITY',       field: 'market' as const, colorClass: 'text-amber-400', from: 'from-amber-600', to: 'to-amber-400' },
  { label: 'SECURITY POSTURE',         field: 'security' as const, colorClass: 'text-cyan-400', from: 'from-cyan-600', to: 'to-cyan-400' },
];

const SENTIMENT_BADGE: Record<string, string> = {
  bullish:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  cautious: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  bearish:  'text-red-400 bg-red-500/10 border-red-500/20',
  neutral:  'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

const AGENT_CONTENT_MAP: { agent: AgentKey; field: keyof AgentsFeedback }[] = [
  { agent: 'CTO',      field: 'ctoAnalysis' },
  { agent: 'Infra',    field: 'infraAnalysis' },
  { agent: 'Product',  field: 'productAnalysis' },
  { agent: 'Security', field: 'securityAnalysis' },
];

interface RoadmapTabProps {
  report: StructuredReport;
  isDark: boolean;
}

export function RoadmapTab({ report, isDark }: RoadmapTabProps) {
  return (
    <div className="space-y-3">
      {/* Worthiness Scores */}
      {report.worthinessScore && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiBarChart2 className="text-indigo-400" size={12} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-indigo-400">
                WORTHINESS ASSESSMENT
              </span>
            </div>
            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg border ${SENTIMENT_BADGE[report.worthinessScore.sentiment] ?? SENTIMENT_BADGE.neutral}`}>
              {report.worthinessScore.sentiment}
            </span>
          </div>

          <div className="space-y-2.5">
            {SCORE_BARS.map(({ label, field, colorClass, from, to }) => (
              <ScoreBar
                key={field}
                label={label}
                value={report.worthinessScore[field]}
                colorClass={colorClass}
                gradientFrom={from}
                gradientTo={to}
                isDark={isDark}
              />
            ))}
          </div>

          <p className={`mt-3 text-[9px] font-mono italic ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            "{report.worthinessScore.summary}"
          </p>
        </motion.div>
      )}

      {/* Technical Agent Analyses */}
      {AGENT_CONTENT_MAP.map(({ agent, field }, i) => {
        const profile = TECHNICAL_MANAGERS.find(m => m.key === agent);
        if (!profile) return null;
        return (
          <motion.div
            key={agent}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, ...spring }}
            className={`p-3.5 rounded-xl border ${isDark ? `${profile.darkBg} ${profile.darkBorder}` : 'bg-zinc-50 border-zinc-200'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-md ${profile.avatarColor} flex items-center justify-center text-white text-[9px] font-bold ring-1 ${profile.ringColor}`}>
                {profile.initials}
              </div>
              <div>
                <span className={`font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isDark ? profile.badgeColor : 'bg-zinc-200 text-zinc-600'}`}>
                  {profile.name}
                </span>
                <span className="ml-1.5 text-[8px] font-mono opacity-40">{profile.title}</span>
              </div>
            </div>
            <RichMessage content={report.agentsFeedback[field] ?? ''} isDark={isDark} />
          </motion.div>
        );
      })}

      {/* Market Feasibility */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...spring }}
        className={`p-3.5 rounded-xl border ${isDark ? 'bg-gradient-to-br from-zinc-900/60 to-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <FiTrendingUp className="text-emerald-400" size={11} />
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-400">
            MARKET FEASIBILITY
          </span>
        </div>
        <div className="space-y-2">
          {([
            { label: 'TAM/SAM/SOM', value: report.marketFeasibility.marketSizeStudy },
            { label: 'ARR Projection', value: report.marketFeasibility.expectedProfitARR },
            { label: 'Risk Mitigation', value: report.marketFeasibility.riskMitigation },
          ] as const).map(({ label, value }) => (
            <div key={label} className={`px-2.5 py-2 rounded-lg ${isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-white border border-zinc-200'}`}>
              <span className="font-mono text-zinc-500 text-[9px] uppercase block mb-1">{label}</span>
              <RichMessage content={value} isDark={isDark} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
