import type { AllManagerKey, ChatMode, ChatModeConfig, ManagerProfile } from '@/app/types';

// War Room strategic tech team — architects & decision-makers
export const TECHNICAL_MANAGERS: ManagerProfile[] = [
  {
    key: 'CTO',
    name: 'Atlas',
    title: 'Chief Technology Officer',
    initials: 'AT',
    avatarColor: 'bg-indigo-600',
    ringColor: 'ring-indigo-500/40',
    badgeColor: 'bg-indigo-500/20 text-indigo-300',
    darkBg: 'bg-indigo-950/20',
    darkBorder: 'border-indigo-500/20',
    domain: 'technical',
    tagline: 'Ship fast. Scale smart.',
    focus: ['System Design', 'Stack Selection', 'API Architecture', 'Tech ROI'],
  },
  {
    key: 'Infra',
    name: 'Rex',
    title: 'Infrastructure & DevOps Lead',
    initials: 'RX',
    avatarColor: 'bg-amber-600',
    ringColor: 'ring-amber-500/40',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    darkBg: 'bg-amber-950/20',
    darkBorder: 'border-amber-500/20',
    domain: 'technical',
    tagline: '99.9% uptime or nothing.',
    focus: ['Cloud Infrastructure', 'CI/CD Pipelines', 'Monitoring', 'Cost Optimization'],
  },
  {
    key: 'Product',
    name: 'Nova',
    title: 'Product & Growth Lead',
    initials: 'NV',
    avatarColor: 'bg-emerald-600',
    ringColor: 'ring-emerald-500/40',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    darkBg: 'bg-emerald-950/20',
    darkBorder: 'border-emerald-500/20',
    domain: 'technical',
    tagline: 'Build what users actually want.',
    focus: ['Product Roadmap', 'User Research', 'Growth Loops', 'Feature Prioritization'],
  },
  {
    key: 'Security',
    name: 'Cipher',
    title: 'Security & Compliance Lead',
    initials: 'CP',
    avatarColor: 'bg-cyan-600',
    ringColor: 'ring-cyan-500/40',
    badgeColor: 'bg-cyan-500/20 text-cyan-300',
    darkBg: 'bg-cyan-950/20',
    darkBorder: 'border-cyan-500/20',
    domain: 'technical',
    tagline: 'Trust no one. Verify everything.',
    focus: ['Threat Modeling', 'Zero-Trust Auth', 'Data Encryption', 'Compliance Audits'],
  },
];

// Tech Review senior engineers — implementation specialists (distinct from War Room team)
export const DEV_REVIEW_MANAGERS: ManagerProfile[] = [
  {
    key: 'DataML',
    name: 'Kai Chen',
    title: 'Data & ML Lead',
    initials: 'KC',
    avatarColor: 'bg-purple-600',
    ringColor: 'ring-purple-500/40',
    badgeColor: 'bg-purple-500/20 text-purple-300',
    darkBg: 'bg-purple-950/20',
    darkBorder: 'border-purple-500/20',
    domain: 'technical',
    tagline: 'Data is the new oil. Refine it or get left behind.',
    focus: ['Data Architecture', 'ML Pipelines', 'LLM Integration', 'Analytics & BI'],
  },
  {
    key: 'Frontend',
    name: 'Luna Park',
    title: 'Frontend & UX Lead',
    initials: 'LP',
    avatarColor: 'bg-rose-600',
    ringColor: 'ring-rose-500/40',
    badgeColor: 'bg-rose-500/20 text-rose-300',
    darkBg: 'bg-rose-950/20',
    darkBorder: 'border-rose-500/20',
    domain: 'technical',
    tagline: 'Users feel UX before they think it.',
    focus: ['UI/UX Design', 'Web Performance', 'Accessibility', 'Conversion Optimization'],
  },
  {
    key: 'Backend',
    name: 'Sage Obi',
    title: 'Backend & API Lead',
    initials: 'SO',
    avatarColor: 'bg-lime-600',
    ringColor: 'ring-lime-500/40',
    badgeColor: 'bg-lime-500/20 text-lime-300',
    darkBg: 'bg-lime-950/20',
    darkBorder: 'border-lime-500/20',
    domain: 'technical',
    tagline: 'Clean API contracts save companies.',
    focus: ['API Design', 'Database Optimization', 'Event-Driven Systems', 'Scalability Patterns'],
  },
  {
    key: 'QA',
    name: 'Finn Brooks',
    title: 'QA & DevEx Lead',
    initials: 'FB',
    avatarColor: 'bg-yellow-600',
    ringColor: 'ring-yellow-500/40',
    badgeColor: 'bg-yellow-500/20 text-yellow-300',
    darkBg: 'bg-yellow-950/20',
    darkBorder: 'border-yellow-500/20',
    domain: 'technical',
    tagline: 'Tests are insurance. Ship them first.',
    focus: ['Testing Strategy', 'CI/CD Quality Gates', 'Developer Experience', 'Code Review Culture'],
  },
];

export const BUSINESS_MANAGERS: ManagerProfile[] = [
  {
    key: 'CEO',
    name: 'Victoria Cross',
    title: 'Chief Executive Officer',
    initials: 'VC',
    avatarColor: 'bg-violet-600',
    ringColor: 'ring-violet-500/40',
    badgeColor: 'bg-violet-500/20 text-violet-300',
    darkBg: 'bg-violet-950/20',
    darkBorder: 'border-violet-500/20',
    domain: 'business',
    tagline: 'Vision without execution is hallucination.',
    focus: ['Strategic Vision', 'Investor Relations', 'Competitive Positioning', 'Stakeholder Management'],
  },
  {
    key: 'CRO',
    name: 'Marcus Sterling',
    title: 'Chief Revenue Officer',
    initials: 'MS',
    avatarColor: 'bg-green-600',
    ringColor: 'ring-green-500/40',
    badgeColor: 'bg-green-500/20 text-green-300',
    darkBg: 'bg-green-950/20',
    darkBorder: 'border-green-500/20',
    domain: 'business',
    tagline: 'Revenue solves everything.',
    focus: ['ARR Growth', 'Sales Pipeline', 'Pricing Models', 'Revenue Forecasting'],
  },
  {
    key: 'CMO',
    name: 'Diana Chen',
    title: 'Chief Marketing Officer',
    initials: 'DC',
    avatarColor: 'bg-pink-600',
    ringColor: 'ring-pink-500/40',
    badgeColor: 'bg-pink-500/20 text-pink-300',
    darkBg: 'bg-pink-950/20',
    darkBorder: 'border-pink-500/20',
    domain: 'business',
    tagline: 'Brand is the moat no one can copy.',
    focus: ['Brand Strategy', 'Go-to-Market', 'Customer Acquisition', 'Content & Distribution'],
  },
  {
    key: 'CFO',
    name: 'Robert Fitch',
    title: 'Chief Financial Officer',
    initials: 'RF',
    avatarColor: 'bg-sky-600',
    ringColor: 'ring-sky-500/40',
    badgeColor: 'bg-sky-500/20 text-sky-300',
    darkBg: 'bg-sky-950/20',
    darkBorder: 'border-sky-500/20',
    domain: 'business',
    tagline: 'Show me the unit economics.',
    focus: ['Unit Economics', 'Burn Rate', 'Funding Strategy', 'Financial Projections'],
  },
  {
    key: 'COO',
    name: 'Sarah Knox',
    title: 'Chief Operating Officer',
    initials: 'SK',
    avatarColor: 'bg-orange-600',
    ringColor: 'ring-orange-500/40',
    badgeColor: 'bg-orange-500/20 text-orange-300',
    darkBg: 'bg-orange-950/20',
    darkBorder: 'border-orange-500/20',
    domain: 'business',
    tagline: 'Strategy is nothing without operations.',
    focus: ['Team Scaling', 'Process Design', 'Vendor Management', 'Operational Efficiency'],
  },
  {
    key: 'BizDev',
    name: 'James Pierce',
    title: 'Chief Business Development Officer',
    initials: 'JP',
    avatarColor: 'bg-indigo-700',
    ringColor: 'ring-indigo-400/40',
    badgeColor: 'bg-indigo-400/20 text-indigo-200',
    darkBg: 'bg-indigo-950/30',
    darkBorder: 'border-indigo-400/20',
    domain: 'business',
    tagline: 'The right partnership changes everything.',
    focus: ['Strategic Partnerships', 'Enterprise Sales', 'M&A', 'Channel Development'],
  },
  {
    key: 'CPO',
    name: 'Alexis Vance',
    title: 'Chief People Officer',
    initials: 'AV',
    avatarColor: 'bg-teal-600',
    ringColor: 'ring-teal-500/40',
    badgeColor: 'bg-teal-500/20 text-teal-300',
    darkBg: 'bg-teal-950/20',
    darkBorder: 'border-teal-500/20',
    domain: 'business',
    tagline: 'Culture eats strategy for breakfast.',
    focus: ['Talent Acquisition', 'Culture Design', 'Org Structure', 'Leadership Development'],
  },
];

export const ALL_MANAGERS: ManagerProfile[] = [...TECHNICAL_MANAGERS, ...DEV_REVIEW_MANAGERS, ...BUSINESS_MANAGERS];

export const ALL_MANAGERS_MAP: Record<AllManagerKey, ManagerProfile> = Object.fromEntries(
  ALL_MANAGERS.map(m => [m.key, m])
) as Record<AllManagerKey, ManagerProfile>;

export const CHAT_MODES: ChatModeConfig[] = [
  {
    id: 'warroom',
    label: 'War Room',
    emoji: '⚡',
    description: 'Full tech synthesis + code output',
    managers: ['CTO', 'Infra', 'Product', 'Security'],
  },
  {
    id: 'board',
    label: 'Board Meeting',
    emoji: '👔',
    description: 'Business leadership — pure strategy, no code',
    managers: ['CEO', 'CRO', 'CMO', 'CFO', 'COO', 'BizDev', 'CPO'],
  },
  {
    id: 'tech-review',
    label: 'Tech Review',
    emoji: '🔧',
    description: 'Deep implementation review — Kai, Luna, Sage & Finn',
    managers: ['DataML', 'Frontend', 'Backend', 'QA'],
  },
  {
    id: 'one-on-one',
    label: '1:1 Chat',
    emoji: '💬',
    description: 'Private session with one manager of your choice',
    managers: [],
  },
  {
    id: 'full-council',
    label: 'Full Council',
    emoji: '🌐',
    description: 'All 12 managers — every business and technical angle',
    managers: ['CEO', 'CTO', 'CRO', 'CMO', 'CFO', 'COO', 'BizDev', 'CPO', 'Infra', 'Product', 'Security', 'DataML', 'Frontend', 'Backend', 'QA'],
  },
];

export const SESSIONS_STORAGE_KEY = 'cto_sessions_meta';

export function getManagerProfile(key: AllManagerKey): ManagerProfile | undefined {
  return ALL_MANAGERS_MAP[key];
}

export function getModeConfig(mode: ChatMode): ChatModeConfig | undefined {
  return CHAT_MODES.find(m => m.id === mode);
}

export function getModeManagers(mode: ChatMode, selectedManager?: AllManagerKey | null): AllManagerKey[] {
  if (mode === 'one-on-one') return selectedManager ? [selectedManager] : ['CEO'];
  return getModeConfig(mode)?.managers ?? ['CTO'];
}
