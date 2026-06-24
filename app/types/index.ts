// Shared TypeScript definitions for Qwen Co-Founder Engine

export type AgentKey = 'CTO' | 'Infra' | 'Product' | 'Security';
export type DevReviewKey = 'DataML' | 'Frontend' | 'Backend' | 'QA';
export type BusinessKey = 'CEO' | 'CRO' | 'CMO' | 'CFO' | 'COO' | 'BizDev' | 'CPO';
export type AllManagerKey = AgentKey | DevReviewKey | BusinessKey;
export type ChatMode = 'warroom' | 'board' | 'tech-review' | 'one-on-one' | 'full-council';
export type Perspective = 'developer' | 'management';
export type CanvasTab = 'code' | 'roadmap' | 'logs';
export type Sentiment = 'bullish' | 'cautious' | 'neutral' | 'bearish';

export interface ReplyContext {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  agent?: AllManagerKey;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  /** Management-perspective text (also the default/fallback) */
  content: string;
  /** Developer-perspective text — shown when perspective === 'developer' */
  devContent?: string;
  /** Management-perspective heading */
  heading?: string;
  /** Developer-perspective heading */
  devHeading?: string;
  agent?: AllManagerKey;
  timestamp: number;
  replyTo?: ReplyContext;
}

export interface WorthinessScore {
  overall: number;
  technical: number;
  market: number;
  security: number;
  sentiment: Sentiment;
  summary: string;
}

export interface MarketFeasibility {
  marketSizeStudy: string;
  expectedProfitARR: string;
  riskMitigation: string;
}

export interface AgentsFeedback {
  /** Developer / technical language */
  ctoAnalysis: string;
  infraAnalysis: string;
  productAnalysis: string;
  securityAnalysis: string;
  /** Management / boardroom language — populated alongside the dev version */
  ctoManagement?: string;
  infraManagement?: string;
  productManagement?: string;
  securityManagement?: string;
}

export interface StructuredReport {
  /** Dev mode: actual React/Next.js production component */
  nextjsFrontendCode: string;
  /** Dev mode: actual Next.js API route with business logic */
  routeBackendCode: string;
  /** Management mode: pitch deck / value proposition brief */
  nextjsFrontendManagement?: string;
  /** Management mode: operations plan / budget / milestones */
  routeBackendManagement?: string;
  agentsFeedback: AgentsFeedback;
  marketFeasibility: MarketFeasibility;
  worthinessScore: WorthinessScore;
}

export interface SessionMeta {
  id: string;
  preview: string;
  productName: string;
  perspective: Perspective;
  updatedAt: number;
  count: number;
  hasReport: boolean;
}

export interface ManagerProfile {
  key: AllManagerKey;
  name: string;
  title: string;
  initials: string;
  avatarColor: string;
  ringColor: string;
  badgeColor: string;
  darkBg: string;
  darkBorder: string;
  domain: 'technical' | 'business';
  tagline: string;
  focus: string[];
}

export interface ChatModeConfig {
  id: ChatMode;
  label: string;
  emoji: string;
  description: string;
  managers: AllManagerKey[];
}

export interface ManagerResponse {
  manager: AllManagerKey;
  name: string;
  /** Business-language heading (always shown in MGMT mode) */
  heading: string;
  /** Technical-language heading (shown in DEV mode) */
  devHeading?: string;
  /** Business-language response (MGMT mode) */
  content: string;
  /** Technical-language response (DEV mode) — toggling perspective re-renders instantly */
  devContent?: string;
}

export interface ContextEntry {
  timestamp: string;
  round: number;
  userMessage: string;
  keyInsights: string[];
  openQuestions: string[];
  decisions: string[];
}

export interface ConversationContext {
  sessionId: string;
  projectName: string;
  founderName: string;
  mode: ChatMode;
  lastUpdated: string;
  roundCount: number;
  richSummary: string;
  entries: ContextEntry[];
  openQuestions: string[];
  keyDecisions: string[];
}

