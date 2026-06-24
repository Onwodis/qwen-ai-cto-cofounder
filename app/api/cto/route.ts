import { NextRequest, NextResponse } from 'next/server';
import { ragChat } from '@/app/ai/rag';
import type { StructuredReport } from '@/app/types';

type Perspective = 'management' | 'developer';

function buildWarRoomPrompt(prompt: string, context: string, perspective: Perspective): string {
  const managementPersonas = `AGENT PERSONAS (MANAGEMENT MODE — zero technical jargon):
- Atlas (CTO): Business value, competitive advantage, time-to-market. Never mentions code or infra.
- Rex (Infra): Operational scalability — headcount, cost-per-user, vendor contracts, SLA. Challenges Atlas on budget.
- Nova (Product): Customer segments, revenue models, churn, NPS, CAC/LTV, go-to-market strategy.
- Cipher (Security): Regulatory liability, GDPR/CCPA, cyber insurance, reputational risk, business continuity.`;

  const developerPersonas = `AGENT PERSONAS (DEVELOPER MODE — technical + business):
- Atlas (CTO): Full-stack architect. Stack choice, system design, API architecture, scalability patterns. Frames in business ROI.
- Rex (Infra): Cloud infrastructure, distributed systems. Challenges CTO on scale, latency, cost with real numbers.
- Nova (Product): Bridges engineering and market. Pushes back on over-engineering. PLG metrics, NPS, CAC.
- Cipher (Security): Threat modeling. Names OWASP risks, CVEs, compliance requirements. Demands concrete mitigations.`;

  const managementOutput = `OUTPUT RULES (MANAGEMENT):
- ctoAnalysis: Atlas boardroom verdict — business value, market timing, build-vs-buy. NO code. (3-5 sentences)
- infraAnalysis: Rex operational plan — cost model, headcount, SLA commitments. Challenges Atlas. (3-5 sentences)
- productAnalysis: Nova market synthesis — segments, pricing, CAC/LTV, competitive moat. Names Atlas and Rex. (3-5 sentences)
- securityAnalysis: Cipher business risk — regulations, liability, data obligations, continuity. Names specific laws. (3-5 sentences)
- nextjsFrontendCode: PITCH DECK as rich formatted text (## headers, bullet points) — value prop, market, revenue model, competitive advantage.
- routeBackendCode: OPERATIONS PLAN as rich formatted text — team structure, vendor stack, 90-day milestones, budget, KPIs.`;

  const developerOutput = `OUTPUT RULES (DEVELOPER):
- ctoAnalysis: Atlas architectural verdict — stack, system design, key technical decisions. (3-5 sentences)
- infraAnalysis: Rex infra response to Atlas — agrees/challenges with real numbers and tools. (3-5 sentences)
- productAnalysis: Nova synthesis of CTO + Infra debate — MVP priorities tech and commercial. (3-5 sentences)
- securityAnalysis: Cipher audit — names attack vectors (OWASP, CVEs), demands technical mitigations. (3-5 sentences)
- nextjsFrontendCode: Complete production React/Next.js 16 App Router component with TypeScript and Tailwind.
- routeBackendCode: Complete Next.js API route handler with error handling and TypeScript types.`;

  return `WAR ROOM BRIEF
PRODUCT: ${prompt}
FOUNDER CONTEXT: ${context || 'None provided'}
PERSPECTIVE: ${perspective.toUpperCase()}

${perspective === 'management' ? managementPersonas : developerPersonas}

${perspective === 'management' ? managementOutput : developerOutput}

AGENTS MUST: reference each other by name, debate each other's points, challenge assumptions. This is a real adversarial war room.

CURRENCY RULE: Match the founder's country/currency; show USD equivalent in parentheses.

Output ONLY raw parsable JSON, no markdown fences:

{
  "nextjsFrontendCode": "...",
  "routeBackendCode": "...",
  "agentsFeedback": {
    "ctoAnalysis": "...",
    "infraAnalysis": "...",
    "productAnalysis": "...",
    "securityAnalysis": "..."
  },
  "marketFeasibility": {
    "marketSizeStudy": "TAM/SAM/SOM with real numbers for this product...",
    "expectedProfitARR": "Year 1/2/3 ARR projections with growth assumptions...",
    "riskMitigation": "Top 3 risks with concrete mitigation steps..."
  },
  "worthinessScore": {
    "overall": 0,
    "technical": 0,
    "market": 0,
    "security": 0,
    "sentiment": "neutral",
    "summary": "One sharp opinionated sentence on whether to build this"
  }
}`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, optionalContext, history, thinkingMode = false, perspective = 'management' } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Product prompt is required' }, { status: 400 });
    }

    const structuredQuery = buildWarRoomPrompt(prompt, optionalContext || '', perspective as Perspective);

    const formattedHistory = Array.isArray(history)
      ? history.map((msg: { role: string; content: string }) => ({
          role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: msg.content,
        }))
      : [];

    const stream = await ragChat(structuredQuery, formattedHistory, thinkingMode);

    let raw = '';
    for await (const chunk of stream) {
      raw += chunk.choices[0]?.delta?.content || '';
    }

    let json = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    if (json.startsWith('```json')) json = json.split('```json')[1].split('```')[0].trim();
    else if (json.startsWith('```')) json = json.split('```')[1].split('```')[0].trim();
    const firstBrace = json.indexOf('{');
    if (firstBrace > 0) json = json.slice(firstBrace);

    const report: StructuredReport = JSON.parse(json);
    return NextResponse.json(report);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WAR_ROOM_ROUTE_ERROR]:', msg);
    return NextResponse.json(
      { error: 'Failed to synthesize war room report. Check QWEN_API_KEY.' },
      { status: 500 }
    );
  }
}
