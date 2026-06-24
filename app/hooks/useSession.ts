'use client';

import { useState, useRef, useCallback } from 'react';
import type { SessionMeta, StructuredReport, Perspective, Message } from '@/app/types';
import { SESSIONS_STORAGE_KEY } from '@/app/constants/agents';

const newSessionId = () =>
  `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

interface UseSessionReturn {
  sessionId: string;
  sessionIdRef: React.MutableRefObject<string>;
  sessions: SessionMeta[];
  /** Management-perspective war room report */
  managementReport: StructuredReport | null;
  /** Developer-perspective war room report (richer, includes code) */
  devReport: StructuredReport | null;
  productName: string;
  logs: string[];
  setManagementReport: (r: StructuredReport | null) => void;
  setDevReport: (r: StructuredReport | null) => void;
  setProductName: (name: string) => void;
  addLog: (line: string) => void;
  setSessions: React.Dispatch<React.SetStateAction<SessionMeta[]>>;
  upsertSessionMeta: (id: string, preview: string, count: number, extra?: Partial<SessionMeta>) => void;
  saveHistory: (messages: Message[], sessionId: string, productName: string, perspective: Perspective, devReport?: StructuredReport) => void;
  saveMeta: (sessionId: string, founderName: string, productName: string, extra?: Record<string, unknown>) => void;
  switchSession: (sid: string) => Promise<{
    messages: Message[];
    productName: string;
    perspective: Perspective;
  } | null>;
  createNewSession: () => string;
  clearCurrentSession: (sessionId: string) => Promise<void>;
  loadSessionsList: () => void;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useSession(_founderName: string | null): UseSessionReturn {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [managementReport, setManagementReport] = useState<StructuredReport | null>(null);
  const [devReport, setDevReport] = useState<StructuredReport | null>(null);
  const [productName, setProductName] = useState('');
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Qwen Co-Founder Engine initialized.',
    '[ENGINE] Pipeline ready. Awaiting founder input...',
  ]);

  const sessionIdRef = useRef(newSessionId());
  const [sessionId, setSessionId] = useState(sessionIdRef.current);

  const addLog = useCallback((line: string) => {
    setLogs(prev => [...prev, line]);
  }, []);

  const upsertSessionMeta = useCallback((
    id: string,
    preview: string,
    count: number,
    extra: Partial<SessionMeta> = {}
  ) => {
    setSessions(prev => {
      const blank: SessionMeta = {
        id, preview, productName: '', perspective: 'management',
        count, updatedAt: Date.now(), hasReport: false,
      };
      const updated = prev.find(s => s.id === id)
        ? prev.map(s => s.id === id ? { ...s, preview, count, updatedAt: Date.now(), ...extra } : s)
        : [{ ...blank, ...extra }, ...prev];
      try { localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated.slice(0, 30))); } catch {}
      return updated.slice(0, 30);
    });
  }, []);

  const saveHistory = useCallback((
    messages: Message[],
    sid: string,
    prodName: string,
    perspective: Perspective,
    latestDevReport?: StructuredReport
  ) => {
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        messages,
        productName: prodName,
        perspective,
        lastReport: latestDevReport ?? null,
      }),
    }).catch(() => {});
  }, []);

  const saveMeta = useCallback((
    sid: string,
    founder: string,
    prodName: string,
    extra: Record<string, unknown> = {}
  ) => {
    fetch('/api/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, founderName: founder, productName: prodName, ...extra }),
    }).catch(() => {});
  }, []);

  const loadSessionsList = useCallback(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { if (d.sessions?.length) setSessions(d.sessions); })
      .catch(() => {
        try {
          const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
          if (raw) setSessions(JSON.parse(raw));
        } catch {}
      });
  }, []);

  const switchSession = useCallback(async (sid: string) => {
    sessionIdRef.current = sid;
    setSessionId(sid);
    localStorage.setItem('cto_session_id', sid);
    setManagementReport(null);
    setDevReport(null);
    setLogs(['[SYSTEM] Loading session...']);

    try {
      const d = await fetch(`/api/history?sessionId=${sid}`).then(r => r.json());
      if (d.messages?.length) {
        // Restore saved dev report to devReport state
        if (d.lastReport) setDevReport(d.lastReport as StructuredReport);
        if (d.productName) setProductName(d.productName);
        addLog(`[SYSTEM] Session resumed: ${sid.slice(0, 24)}...`);
        addLog(`[ENGINE] ${d.messages.length} messages restored.`);
        return {
          messages: d.messages as Message[],
          productName: d.productName as string,
          perspective: (d.perspective ?? 'management') as Perspective,
        };
      }
    } catch {
      addLog('[ERROR] Failed to load session from database.');
    }
    return null;
  }, [addLog]);

  const createNewSession = useCallback(() => {
    const sid = newSessionId();
    sessionIdRef.current = sid;
    setSessionId(sid);
    localStorage.setItem('cto_session_id', sid);
    setManagementReport(null);
    setDevReport(null);
    setProductName('');
    setLogs(['[SYSTEM] New session created.', '[ENGINE] Ready for founder input...']);
    return sid;
  }, []);

  const clearCurrentSession = useCallback(async (sid: string) => {
    setManagementReport(null);
    setDevReport(null);
    setLogs(['[SYSTEM] Session cleared.', '[ENGINE] Ready for new input.']);
    await Promise.allSettled([
      fetch(`/api/history?sessionId=${sid}`, { method: 'DELETE' }),
      fetch(`/api/meta?sessionId=${sid}`, { method: 'DELETE' }),
    ]);
  }, []);

  return {
    sessionId,
    sessionIdRef,
    sessions,
    managementReport,
    devReport,
    productName,
    logs,
    setManagementReport,
    setDevReport,
    setProductName,
    addLog,
    setSessions,
    upsertSessionMeta,
    saveHistory,
    saveMeta,
    switchSession,
    createNewSession,
    clearCurrentSession,
    loadSessionsList,
    setLogs,
  };
}
