import { NextRequest, NextResponse } from 'next/server';
import { ragChat, ChatMessage } from '@/app/ai/rag';

export interface WorthinessScore {
  overall: number;
  technical: number;
  market: number;
  security: number;
  sentiment: 'bullish' | 'cautious' | 'neutral' | 'bearish';
  summary: string;
}

export interface StructuredCoFounderReport {
  nextjsFrontendCode: string;
  routeBackendCode: string;
  agentsFeedback: {
    ctoAnalysis: string;
    infraAnalysis: string;
    productAnalysis: string;
    securityAnalysis: string;
  };
  marketFeasibility: {
    marketSizeStudy: string;
    expectedProfitARR: string;
    riskMitigation: string;
  };
  worthinessScore: WorthinessScore;
}

type Perspective = 'management' | 'developer';

function buildWarRoomPrompt(
  prompt: string,
  context: string,
  perspective: Perspective
): string {
  const managementPersonas = `
AGENT PERSONAS (MANAGEMENT / BUSINESS PERSPECTIVE — zero technical jargon):
- Chief Technology Exec (Atlas): Speaks about technology ONLY in terms of business value, competitive advantage, time-to-market, and cost. Never mentions code, frameworks, or infrastructure. Says things like "My recommendation is to invest in a platform that gives us a 6-month speed advantage over competitors..." Uses boardroom language.
- Operations & Growth Lead (Rex): Focuses on business scalability — headcount, cost-per-user, operational efficiency, vendor contracts, SLA guarantees. Challenges Atlas on budget. Says "Atlas, that approach could inflate our burn rate by 40%..."
- Market & Product Lead (Nova): Speaks in customer segments, revenue models, churn rates, NPS, user acquisition costs, and go-to-market strategy. Says "Rex, the operational cost matters less than the $40 CAC reduction we get from..."
- Risk & Compliance Officer (Cipher): Talks about legal liability, data privacy regulations (GDPR, CCPA), reputational risk, cyber insurance, and business continuity. Says "I need to flag a regulatory exposure in Nova's approach..."`;

  const developerPersonas = `
AGENT PERSONAS (DEVELOPER / TECHNICAL + BUSINESS PERSPECTIVE):
- AI CTO (Atlas): Senior full-stack architect. Sets technical direction with code-level precision. Evaluates frameworks, APIs, database models, and scalability patterns. Also frames every technical choice in business ROI. Uses "I'm proposing..." or "My call is...".
- Infra Architect (Rex): Distributed systems and cloud infrastructure expert. Challenges CTO's proposals on scale, latency, and cost. Says things like "Atlas, that monolith won't hold at 10k concurrent users — we need event-driven microservices with..."
- Product Strategist (Nova): Growth-hacking product lead who bridges engineering velocity with market opportunity. Pushes back on over-engineering. Says "Rex, users don't care about Kafka clusters — they care about sub-200ms load times and..."
- Security SecOps (Cipher): Zero-trust security engineer. Performs threat modeling on the stack. Says "I need to flag that Atlas's JWT approach exposes us to token replay attacks — we need..."`;

  const managementRules = `
MANAGEMENT MODE RULES:
1. ctoAnalysis: Atlas gives a boardroom-level strategic technology verdict — business value, market timing, and build-vs-buy. NO code or infrastructure terms. (3-4 sharp sentences)
2. infraAnalysis: Rex responds with operational scaling plan — cost model, headcount, vendor choices, SLA commitments. Challenges Atlas on budget. (3-4 sentences)
3. productAnalysis: Nova synthesizes the market opportunity — customer segments, pricing model, CAC, LTV, competitive moat. References Atlas and Rex by name. (3-4 sentences)
4. securityAnalysis: Cipher flags the business risk — regulatory exposure, liability, data protection obligations, business continuity. Names specific regulations. (3-4 sentences)
5. nextjsFrontendCode: Write a BUSINESS PITCH DECK summary as a formatted string (not actual code) — value proposition, target market, revenue model, competitive advantage.
6. routeBackendCode: Write an OPERATIONS PLAN as a formatted string — team structure, vendor stack, budget breakdown, 90-day milestones.`;

  const developerRules = `
DEVELOPER MODE RULES:
1. ctoAnalysis: Atlas sets the architectural direction — stack choice, system design, key technical decisions. (3-4 sharp sentences)
2. infraAnalysis: Rex responds to Atlas's proposal — agree on parts, challenge scale assumptions, propose infra fixes with specifics. (3-4 sentences)
3. productAnalysis: Nova synthesizes CTO + Infra debate from user's POV — what actually matters for the MVP technically AND commercially? (3-4 sentences)
4. securityAnalysis: Cipher audits ALL prior proposals, flags specific attack vectors, demands concrete mitigations with technical details. (3-4 sentences)
5. nextjsFrontendCode: Complete production-ready React/Next.js 16 App Router component with TypeScript, Tailwind, and proper hooks.
6. routeBackendCode: Complete Next.js API route handler with proper error handling, types, and business logic.`;

  const personas = perspective === 'management' ? managementPersonas : developerPersonas;
  const rules    = perspective === 'management' ? managementRules    : developerRules;

  return `
WAR ROOM BRIEF — PRODUCT: ${prompt}
FOUNDER CONTEXT: ${context || 'None provided'}
PERSPECTIVE MODE: ${perspective.toUpperCase()}

You are simulating a high-stakes war room with 4 distinct co-founder agents. Each agent has a strong, unique voice and MUST reference and debate the other agents' positions by name. This is a real conversation — agents challenge, build on, and sometimes contradict each other.

${personas}

${rules}

7. worthinessScore: Score 0-100 on overall (build-worthiness), technical (feasibility), market (opportunity), security (risk posture). sentiment must be one of: bullish / cautious / neutral / bearish. summary is one sharp, opinionated sentence.

Output ONLY raw, parsable JSON. No markdown fences. No extra text before or after.

{
  "nextjsFrontendCode": "${perspective === 'management' ? 'Business pitch deck / value proposition summary as formatted text' : 'Complete production-ready React/Next.js 16 component'}",
  "routeBackendCode": "${perspective === 'management' ? 'Operations plan / team structure / budget as formatted text' : 'Complete Next.js API route with error handling'}",
  "agentsFeedback": {
    "ctoAnalysis": "${perspective === 'management' ? 'Atlas boardroom strategy — business value, market timing, build-vs-buy verdict' : 'Atlas architectural verdict — stack, design, technical decisions'}",
    "infraAnalysis": "${perspective === 'management' ? 'Rex operational scaling plan — cost model, headcount, SLA commitments' : 'Rex infrastructure response — explicitly addresses Atlas proposal, proposes infra fixes'}",
    "productAnalysis": "${perspective === 'management' ? 'Nova market strategy — segments, pricing, CAC/LTV, competitive moat' : 'Nova product take — references Atlas and Rex debate, bridges tech with market'}",
    "securityAnalysis": "${perspective === 'management' ? 'Cipher business risk — regulations, liability, data protection, continuity plan' : 'Cipher security audit — names specific attack vectors, demands technical mitigations'}"
  },
  "marketFeasibility": {
    "marketSizeStudy": "TAM/SAM/SOM with real numbers and market segments for this specific product",
    "expectedProfitARR": "$X–$Y ARR at Year 1/2/3 with growth assumptions",
    "riskMitigation": "Top 3 specific risks for THIS product with concrete mitigation steps"
  },
  "worthinessScore": {
    "overall": 0,
    "technical": 0,
    "market": 0,
    "security": 0,
    "sentiment": "neutral",
    "summary": "One sharp opinionated sentence on whether to build this"
  }
}
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, optionalContext, history, thinkingMode = false, perspective = 'developer' } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Product prompt is required' }, { status: 400 });
    }

    const structuredQuery = buildWarRoomPrompt(prompt, optionalContext || '', perspective as Perspective);

    const formattedHistory: ChatMessage[] = Array.isArray(history)
      ? history.map((msg: { role: string; content: string }) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }))
      : [];

    const stream = await ragChat(structuredQuery, formattedHistory, thinkingMode);

    let parsedResult = '';
    for await (const chunk of stream) {
      parsedResult += chunk.choices[0]?.delta?.content || '';
    }

    let jsonContent = parsedResult.trim();

    // Strip Qwen3 chain-of-thought thinking tags before parsing JSON
    jsonContent = jsonContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Strip markdown code fences if the model wrapped the JSON
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
    }

    const completedReport: StructuredCoFounderReport = JSON.parse(jsonContent);
    return NextResponse.json(completedReport);

  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown routing error';
    console.error('[CO_FOUNDER_ROUTE_ERROR]:', errMessage);
    return NextResponse.json(
      { error: 'Failed to synthesize structured report. Ensure QWEN_API_KEY is set and the model returned valid JSON.' },
      { status: 500 }
    );
  }
}
