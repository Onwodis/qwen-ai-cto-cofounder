import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ProjectSummary } from '@/app/models/ProjectSummary';
import { directChat } from '@/app/ai/rag';
import type { ConversationContext, ContextEntry } from '@/app/types';

// ── GET: Retrieve current context for a session ───────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ context: null }, { status: 200 });

    await connectDB();
    const doc = await ProjectSummary.findOne({ sessionId });
    if (!doc) return NextResponse.json({ context: null });

    const context: ConversationContext = {
      sessionId: doc.sessionId,
      projectName: doc.projectName,
      founderName: doc.founderName,
      mode: doc.mode as ConversationContext['mode'],
      lastUpdated: doc.lastUpdated.toISOString(),
      roundCount: doc.roundCount,
      richSummary: doc.richSummary,
      entries: JSON.parse(doc.entriesJson || '[]'),
      openQuestions: JSON.parse(doc.openQuestionsJson || '[]'),
      keyDecisions: JSON.parse(doc.keyDecisionsJson || '[]'),
    };

    return NextResponse.json({ context });
  } catch (err) {
    console.error('[SUMMARY_GET]:', err);
    return NextResponse.json({ context: null });
  }
}

// ── POST: Generate and save a new context summary ────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, projectName, founderName, mode, messages, existingContext } = body;

    if (!sessionId || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'sessionId and messages required' }, { status: 400 });
    }

    const summaryPrompt = buildSummaryPrompt(messages, projectName, founderName, existingContext);
    const rawSummary = await directChat(summaryPrompt, [], 'Generate the summary JSON now.', false);

    let summaryData: {
      richSummary: string;
      keyInsights: string[];
      openQuestions: string[];
      keyDecisions: string[];
      nextSteps: string[];
    };

    try {
      let json = rawSummary.trim();
      if (json.startsWith('```json')) json = json.split('```json')[1].split('```')[0].trim();
      else if (json.startsWith('```')) json = json.split('```')[1].split('```')[0].trim();
      const brace = json.indexOf('{');
      if (brace > 0) json = json.slice(brace);
      summaryData = JSON.parse(json);
    } catch {
      summaryData = {
        richSummary: rawSummary.slice(0, 800),
        keyInsights: [],
        openQuestions: [],
        keyDecisions: [],
        nextSteps: [],
      };
    }

    // Build the new context entry
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const newEntry: ContextEntry = {
      timestamp: new Date().toISOString(),
      round: (existingContext?.roundCount ?? 0) + 1,
      userMessage: lastUserMsg?.content?.slice(0, 200) ?? '',
      keyInsights: summaryData.keyInsights ?? [],
      openQuestions: summaryData.openQuestions ?? [],
      decisions: summaryData.keyDecisions ?? [],
    };

    const existingEntries: ContextEntry[] = existingContext?.entries ?? [];
    const updatedEntries = [...existingEntries, newEntry].slice(-10); // Keep last 10 rounds
    const updatedQuestions = summaryData.openQuestions ?? [];
    const updatedDecisions = [
      ...(existingContext?.keyDecisions ?? []),
      ...(summaryData.keyDecisions ?? []),
    ].slice(-20);

    await connectDB();
    await ProjectSummary.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        projectName: projectName || '',
        founderName: founderName || '',
        mode: mode || 'board',
        roundCount: newEntry.round,
        richSummary: summaryData.richSummary || '',
        entriesJson: JSON.stringify(updatedEntries),
        openQuestionsJson: JSON.stringify(updatedQuestions),
        keyDecisionsJson: JSON.stringify(updatedDecisions),
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    const updatedContext: ConversationContext = {
      sessionId,
      projectName: projectName || '',
      founderName: founderName || '',
      mode,
      lastUpdated: new Date().toISOString(),
      roundCount: newEntry.round,
      richSummary: summaryData.richSummary || '',
      entries: updatedEntries,
      openQuestions: updatedQuestions,
      keyDecisions: updatedDecisions,
    };

    return NextResponse.json({ context: updatedContext });
  } catch (err: unknown) {
    console.error('[SUMMARY_POST]:', err);
    return NextResponse.json({ error: 'Failed to generate context summary' }, { status: 500 });
  }
}

// ── DELETE: Clear context for a session ──────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ ok: false });
    await connectDB();
    await ProjectSummary.deleteOne({ sessionId });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

// ── Summary prompt builder ────────────────────────────────────────────────────
function buildSummaryPrompt(
  messages: { role: string; content: string; agent?: string }[],
  projectName: string,
  founderName: string,
  existingContext?: ConversationContext
): string {
  const recentMessages = messages
    .slice(-12)
    .map(m => {
      const speaker = m.role === 'user' ? founderName : (m.agent ?? 'Advisor');
      return `[${speaker}]: ${m.content.slice(0, 300)}`;
    })
    .join('\n\n');

  const priorContext = existingContext?.richSummary
    ? `\nPRIOR CONTEXT SUMMARY:\n${existingContext.richSummary}\n\nPRIOR OPEN QUESTIONS:\n${existingContext.openQuestions.join('\n')}\n`
    : '';

  return `You are generating a rich, structured conversation summary for an AI advisory platform.

PROJECT: ${projectName || 'Untitled'}
FOUNDER: ${founderName}
${priorContext}
LATEST CONVERSATION EXCHANGE:
${recentMessages}

Generate a dense, actionable JSON summary. Include real data points, market insights, and strategic notes that were discussed.

Respond ONLY with raw JSON (no markdown):
{
  "richSummary": "2-4 sentence dense summary of the FULL conversation so far, including key decisions, recommendations, concerns, and open threads. Include specific numbers, market data, or strategies mentioned.",
  "keyInsights": ["3-5 specific insights from this exchange, with concrete data if mentioned"],
  "openQuestions": ["2-4 questions that were asked OR that need founder clarification"],
  "keyDecisions": ["Any firm recommendations or decisions made in this exchange"],
  "nextSteps": ["1-3 concrete action items that emerged from this discussion"]
}`.trim();
}
