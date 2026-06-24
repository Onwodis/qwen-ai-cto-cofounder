import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ChatHistory } from '@/app/models/ChatHistory';

export async function GET() {
  const db = await connectDB();
  if (!db) return NextResponse.json({ sessions: [] });

  const docs = await ChatHistory.find({})
    .select('sessionId updatedAt messages productName perspective lastReport')
    .sort({ updatedAt: -1 })
    .limit(30)
    .lean() as Array<{
      sessionId: string;
      updatedAt: Date;
      messages: Array<{ content: string; role: string }>;
      productName?: string;
      perspective?: string;
      lastReport?: Record<string, unknown> | null;
    }>;

  return NextResponse.json({
    sessions: docs.map(d => {
      // Use first user message as preview
      const firstUser = d.messages?.find(m => m.role === 'user');
      return {
        id:          d.sessionId,
        updatedAt:   d.updatedAt,
        productName: d.productName || '',
        perspective: d.perspective || 'developer',
        preview:     firstUser?.content?.slice(0, 60) || d.productName || 'New Session',
        count:       d.messages?.length ?? 0,
        hasReport:   !!d.lastReport,
      };
    }),
  });
}
