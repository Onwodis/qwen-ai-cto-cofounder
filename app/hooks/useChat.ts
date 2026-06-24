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

  // ── War Room: structured synthesis via /api/cto ──────────────────────────
  const sendWarRoomMessage = useCallback(async (
    input: string,
    history: Message[],
    opts: SendOptions,
    context: ConversationContext | null
  ) => {
    const { productName, onReportGenerated, onLogAdd, onMetaSave } = opts;

    // ① Show all 4 agents "thinking" IMMEDIATELY — before the API responds
    const warRoomAgents: AllManagerKey[] = ['CTO', 'Infra', 'Product', 'Security'];
    setTypingManagers(warRoomAgents);
    onLogAdd(`[SYSTEM] War room convening — "${input.slice(0, 55)}${input.length > 55 ? '...' : ''}"`);
    onLogAdd('[ENGINE] Atlas, Rex, Nova & Cipher are deliberating...');
    onMetaSave({ context: input, incrementPrompt: true, perspective });

    // ② Fetch the full report (slow — 10-30 s). Typing indicators stay up the whole time.
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

    // ③ Response received — clear all-typing state, register report
    setTypingManagers([]);
    onReportGenerated(data);
    onLogAdd('[SUCCESS] War room synthesis complete. Releasing agent verdicts...');

    const ts = Date.now();
    const agentMsgs: Message[] = [
      {
        id: `cto_${ts}`, role: 'assistant', agent: 'CTO',
        content: data.agentsFeedback.ctoAnalysis,
        heading: perspective === 'management' ? 'STRATEGIC TECHNOLOGY VERDICT' : 'ARCHITECTURAL VERDICT',
        timestamp: ts,
      },
      {
        id: `inf_${ts}`, role: 'assistant', agent: 'Infra',
        content: data.agentsFeedback.infraAnalysis,
        heading: perspective === 'management' ? 'OPERATIONAL SCALING PLAN' : 'INFRASTRUCTURE & SCALE PLAN',
        timestamp: ts + 100,
      },
      {
        id: `prd_${ts}`, role: 'assistant', agent: 'Product',
        content: data.agentsFeedback.productAnalysis,
        heading: perspective === 'management' ? 'MARKET OPPORTUNITY ANALYSIS' : 'PRODUCT & MARKET STRATEGY',
        timestamp: ts + 200,
      },
      {
        id: `sec_${ts}`, role: 'assistant', agent: 'Security',
        content: data.agentsFeedback.securityAnalysis,
        heading: perspective === 'management' ? 'RISK & COMPLIANCE ASSESSMENT' : 'SECURITY RISK ASSESSMENT',
        timestamp: ts + 300,
      },
    ];

    // ④ Reveal each agent one-by-one with realistic typing delays
    for (const msg of agentMsgs) {
      setTypingManagers([msg.agent!]);
      // Typing duration scales with response length — 1.2 s base + ~1 ms per char, max 4 s
      const textLen = msg.content?.length ?? 200;
      const typingMs = Math.min(4000, 1200 + textLen * 0.8 + Math.random() * 600);
      await ms(typingMs);
      setTypingManagers([]);
      await ms(120);
      setMessages(prev => [...prev, msg]);
      await ms(350);
    }

    if (data.marketFeasibility?.marketSizeStudy) {
      onLogAdd(`[MARKET] ${data.marketFeasibility.marketSizeStudy.slice(0, 90)}...`);
    }
    if (data.worthinessScore) {
      onLogAdd(`[ENGINE] Worthiness: ${data.worthinessScore.overall}/100 · ${data.worthinessScore.sentiment.toUpperCase()}`);
    }

    return agentMsgs;
  }, [perspective, thinkingMode]);

  // ── Board / 1:1 / Tech Review / Full Council: conversational via /api/chat ─
  const sendChatMessage = useCallback(async (
    input: string,
    history: Message[],
    opts: SendOptions,
    context: ConversationContext | null
  ) => {
    const { productName, founderName, onLogAdd } = opts;
    const managers = getModeManagers(mode, selectedManager);

    // ① Show ALL managers typing IMMEDIATELY — before the API responds
    setTypingManagers(managers);
    const modeLabel = mode === 'board' ? 'Board' : mode === 'tech-review' ? 'Engineering team' : mode === 'full-council' ? 'Full council' : 'Advisor';
    onLogAdd(`[SYSTEM] ${modeLabel} convening — ${managers.length} advisor${managers.length !== 1 ? 's' : ''} deliberating...`);

    // ② Fetch all responses (slow). All typing indicators stay visible.
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
        perspective,
      }),
    });

    if (!res.ok) throw new Error(`Chat API error ${res.status}`);
    const data: { responses: ManagerResponse[] } = await res.json();

    // ③ Response received — clear all-typing, then reveal one by one
    setTypingManagers([]);
    await ms(200);

    const ts = Date.now();
    const managerMsgs: Message[] = [];

    for (let i = 0; i < data.responses.length; i++) {
      const r = data.responses[i];
      setTypingManagers([r.manager]);
      // Typing duration scales with content length — 1 s base, max 3.5 s
      const textLen = (r.content?.length ?? 150) + (r.devContent?.length ?? 0);
      const typingMs = Math.min(3500, 1000 + textLen * 0.5 + Math.random() * 500);
      await ms(typingMs);
      setTypingManagers([]);
      await ms(100);
      const msg: Message = {
        id: `${r.manager}_${ts}_${i}`,
        role: 'assistant',
        content: r.content,
        devContent: r.devContent || undefined,
        agent: r.manager,
        heading: r.heading || undefined,
        devHeading: r.devHeading || undefined,
        timestamp: ts + i * 300,
      };
      setMessages(prev => [...prev, msg]);
      managerMsgs.push(msg);
      await ms(280);
    }

    return managerMsgs;
  }, [mode, selectedManager, thinkingMode, perspective]);

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
      if (mode === 'warroom') {
        // War room generates a full StructuredReport with code + canvas output
        agentMsgs = await sendWarRoomMessage(input, snap, opts, context);
      } else {
        // All other modes (board, tech-review, one-on-one, full-council) use conversational chat
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
