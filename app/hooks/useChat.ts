'use client';

import { useState, useCallback } from 'react';
import type {
  Message, AllManagerKey, ChatMode, Perspective,
  ReplyContext, StructuredReport, ManagerResponse, ConversationContext,
} from '@/app/types';
import { getModeManagers } from '@/app/constants/agents';

const ms = (n: number) => new Promise<void>(r => setTimeout(r, n));

interface SendOptions {
  sessionId: string;
  productName: string;
  founderName: string;
  onReportGenerated: (report: StructuredReport) => void;
  onLogAdd: (line: string) => void;
  onHistorySave: (messages: Message[], report?: StructuredReport) => void;
  onMetaSave: (extra?: Record<string, unknown>) => void;
}

interface UseChatReturn {
  messages: Message[];
  typingManagers: AllManagerKey[];
  isLoading: boolean;
  mode: ChatMode;
  selectedManager: AllManagerKey | null;
  perspective: Perspective;
  thinkingMode: boolean;
  replyingTo: ReplyContext | null;
  copiedId: string | null;
  setMode: (mode: ChatMode) => void;
  setSelectedManager: (m: AllManagerKey | null) => void;
  setPerspective: (p: Perspective) => void;
  setThinkingMode: (v: boolean) => void;
  setReplyingTo: (r: ReplyContext | null) => void;
  setMessages: (msgs: Message[]) => void;
  sendMessage: (input: string, opts: SendOptions) => Promise<void>;
  copyMessage: (msg: Message) => void;
  clearMessages: () => void;
}

async function fetchContext(sessionId: string): Promise<ConversationContext | null> {
  try {
    const res = await fetch(`/api/summary?sessionId=${encodeURIComponent(sessionId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.context ?? null;
  } catch {
    return null;
  }
}

function postContextSummary(
  sessionId: string,
  projectName: string,
  founderName: string,
  mode: string,
  messages: Message[],
  existingContext: ConversationContext | null
): void {
  const flatMessages = messages.slice(-12).map(m => ({
    role: m.role,
    content: m.content,
    agent: m.agent,
  }));
  fetch('/api/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, projectName, founderName, mode, messages: flatMessages, existingContext }),
  }).catch(() => { /* non-blocking */ });
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingManagers, setTypingManagers] = useState<AllManagerKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('board');
  const [selectedManager, setSelectedManager] = useState<AllManagerKey | null>('CEO');
  const [perspective, setPerspective] = useState<Perspective>('management');
  const [thinkingMode, setThinkingMode] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyContext | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyMessage = useCallback((msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setReplyingTo(null);
  }, []);

  // ── War Room / Tech Review: structured synthesis via /api/cto ────────────
  const sendWarRoomMessage = useCallback(async (
    input: string,
    history: Message[],
    opts: SendOptions,
    context: ConversationContext | null
  ) => {
    const { productName, onReportGenerated, onLogAdd, onMetaSave } = opts;

    onLogAdd(`[SYSTEM] Processing: "${input.slice(0, 60)}${input.length > 60 ? '...' : ''}"`);
    onMetaSave({ context: input, incrementPrompt: true, perspective });

    const res = await fetch('/api/cto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: input,
        optionalContext: productName || undefined,
        history: history.map(m => ({ role: m.role, content: m.content })),
        thinkingMode,
        perspective,
        richContext: context?.richSummary || undefined,
      }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data: StructuredReport = await res.json();
    onReportGenerated(data);

    const ts = Date.now();
    const agentMsgs: Message[] = [
      { id: `cto_${ts}`,  role: 'assistant', content: data.agentsFeedback.ctoAnalysis,     agent: 'CTO',      heading: 'ARCHITECTURAL VERDICT',       timestamp: ts + 700 },
      { id: `inf_${ts}`,  role: 'assistant', content: data.agentsFeedback.infraAnalysis,    agent: 'Infra',    heading: 'INFRASTRUCTURE & SCALE PLAN', timestamp: ts + 1500 },
      { id: `prd_${ts}`,  role: 'assistant', content: data.agentsFeedback.productAnalysis,  agent: 'Product',  heading: 'PRODUCT & MARKET STRATEGY',   timestamp: ts + 2300 },
      { id: `sec_${ts}`,  role: 'assistant', content: data.agentsFeedback.securityAnalysis, agent: 'Security', heading: 'SECURITY RISK ASSESSMENT',     timestamp: ts + 3100 },
    ];

    for (const msg of agentMsgs) {
      setTypingManagers([msg.agent!]);
      await ms(600 + Math.random() * 500);
      setTypingManagers([]);
      await ms(80);
      setMessages(prev => [...prev, msg]);
      await ms(150);
    }

    onLogAdd('[SUCCESS] All agents responded. Report synthesized.');
    if (data.marketFeasibility?.marketSizeStudy) {
      onLogAdd(`[MARKET] ${data.marketFeasibility.marketSizeStudy.slice(0, 80)}...`);
    }
    if (data.worthinessScore) {
      onLogAdd(`[ENGINE] Worthiness: ${data.worthinessScore.overall}/100 · ${data.worthinessScore.sentiment.toUpperCase()}`);
    }

    return agentMsgs;
  }, [perspective, thinkingMode]);

  // ── Board / 1:1 / Full Council: conversational via /api/chat ─────────────
  const sendChatMessage = useCallback(async (
    input: string,
    history: Message[],
    opts: SendOptions,
    context: ConversationContext | null
  ) => {
    const { productName, founderName, onLogAdd } = opts;
    const managers = getModeManagers(mode, selectedManager);

    onLogAdd(`[SYSTEM] ${managers.length} manager(s) responding in ${mode} mode...`);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        managers,
        founderName,
        history: history.slice(-10).map(m => ({ role: m.role, content: m.content })),
        thinkingMode,
        productName: productName || undefined,
        mode,
        context: context || undefined,
      }),
    });

    if (!res.ok) throw new Error(`Chat API error ${res.status}`);
    const data: { responses: ManagerResponse[] } = await res.json();

    const ts = Date.now();
    const managerMsgs: Message[] = [];

    for (let i = 0; i < data.responses.length; i++) {
      const r = data.responses[i];
      setTypingManagers([r.manager]);
      await ms(400 + Math.random() * 400);
      setTypingManagers([]);
      await ms(60);
      const msg: Message = {
        id: `${r.manager}_${ts}_${i}`,
        role: 'assistant',
        content: r.content,
        devContent: r.devContent || undefined,
        agent: r.manager,
        heading: r.heading || undefined,
        devHeading: r.devHeading || undefined,
        timestamp: ts + i * 500,
      };
      setMessages(prev => [...prev, msg]);
      managerMsgs.push(msg);
      await ms(100);
    }

    return managerMsgs;
  }, [mode, selectedManager, thinkingMode]);

  // ── Public send entry point ───────────────────────────────────────────────
  const sendMessage = useCallback(async (input: string, opts: SendOptions) => {
    if (!input.trim() || isLoading) return;

    const replyCtx = replyingTo;
    setReplyingTo(null);

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      ...(replyCtx && { replyTo: replyCtx }),
    };

    const snap = [...messages];
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const context = await fetchContext(opts.sessionId);

      let agentMsgs: Message[];
      if (mode === 'warroom' || mode === 'tech-review') {
        agentMsgs = await sendWarRoomMessage(input, snap, opts, context);
      } else {
        agentMsgs = await sendChatMessage(input, snap, opts, context);
      }

      const all = [...snap, userMsg, ...agentMsgs];
      opts.onHistorySave(all);

      postContextSummary(opts.sessionId, opts.productName, opts.founderName, mode, all, context);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      opts.onLogAdd(`[ERROR] ${errMsg}`);
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Connection error: ${errMsg}. Please try again.`,
        agent: 'CTO',
        timestamp: Date.now(),
      }]);
    } finally {
      setTypingManagers([]);
      setIsLoading(false);
    }
  }, [isLoading, messages, mode, replyingTo, sendWarRoomMessage, sendChatMessage]);

  return {
    messages,
    typingManagers,
    isLoading,
    mode,
    selectedManager,
    perspective,
    thinkingMode,
    replyingTo,
    copiedId,
    setMode,
    setSelectedManager,
    setPerspective,
    setThinkingMode,
    setReplyingTo,
    setMessages,
    sendMessage,
    copyMessage,
    clearMessages,
  };
}
