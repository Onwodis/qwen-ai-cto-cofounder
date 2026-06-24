'use client';

import type { StructuredReport, Perspective } from '@/app/types';
import { CodeBlock } from '@/app/components/ui/CodeBlock';

interface CodeOutputProps {
  report: StructuredReport;
  productName: string;
  perspective: Perspective;
  isDark: boolean;
}

export function CodeOutput({ report, productName, perspective, isDark }: CodeOutputProps) {
  const isManagement = perspective === 'management';

  return (
    <div className="space-y-5">
      {/* Header badge */}
      <div className={`px-3 py-2.5 rounded-xl border font-mono text-[10px] flex items-center justify-between ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
        <div>
          <p className="text-indigo-400 font-bold">
            {isManagement ? '// PITCH BRIEF: ' : '// BLUEPRINT: '}
            {(productName || 'UNTITLED').toUpperCase()}
          </p>
          <p className="opacity-40 text-[9px] mt-0.5">
            {isManagement
              ? 'Qwen AI · Business Strategy · War Room Output'
              : 'Qwen AI · Next.js 16 · APP_ROUTER'}
          </p>
        </div>
        <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold ${
          isManagement
            ? 'bg-emerald-900/40 border-emerald-700/30 text-emerald-500'
            : 'bg-zinc-900 border-zinc-800 text-zinc-600'
        }`}>
          {isManagement ? 'MGMT_MODE' : 'AI_GENERATED'}
        </span>
      </div>

      <CodeBlock
        title={isManagement ? 'pitch-deck.md' : 'frontend.tsx'}
        code={report.nextjsFrontendCode}
        isDark={isDark}
      />
      <CodeBlock
        title={isManagement ? 'ops-plan.md' : 'route.ts'}
        code={report.routeBackendCode}
        isDark={isDark}
      />
    </div>
  );
}
