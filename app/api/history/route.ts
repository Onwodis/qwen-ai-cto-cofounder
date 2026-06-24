import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ChatHistory } from '@/app/models/ChatHistory';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const db = await connectDB();
  if (!db) return NextResponse.json({ messages: [], productName: '', perspective: 'developer', lastReport: null });

  const history = await ChatHistory.findOne({ sessionId }).lean() as {
    messages?: unknown[];
    productName?: string;
    perspective?: string;
    lastReport?: unknown;
  } | null;

  return NextResponse.json({
    messages:    history?.messages    ?? [],
    productName: history?.productName ?? '',
    perspective: history?.perspective ?? 'developer',
    lastReport:  history?.lastReport  ?? null,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, messages, productName, perspective, lastReport } = body;
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const db = await connectDB();
  if (!db) return NextResponse.json({ ok: true });

  await ChatHistory.findOneAndUpdate(
    { sessionId },
    {
      $set: {
        messages,
        ...(productName  !== undefined && { productName }),
        ...(perspective  !== undefined && { perspective }),
        ...(lastReport   !== undefined && { lastReport }),
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const db = await connectDB();
  if (!db) return NextResponse.json({ ok: true });

  await ChatHistory.deleteOne({ sessionId });
  return NextResponse.json({ ok: true });
}
