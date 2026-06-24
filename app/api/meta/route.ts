import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ProductMeta } from '@/app/models/ProductMeta';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  const db = await connectDB();
  if (!db) return NextResponse.json({ meta: null });
  const meta = await ProductMeta.findOne({ sessionId }).lean();
  return NextResponse.json({ meta });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, productName, founderName, context, worthinessScore } = body;
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = req.headers.get('user-agent') || '';

  const db = await connectDB();
  if (!db) return NextResponse.json({ ok: true });

  await ProductMeta.findOneAndUpdate(
    { sessionId },
    {
      $set: {
        ...(productName   !== undefined && { productName }),
        ...(founderName   !== undefined && { founderName }),
        ...(context       !== undefined && { context }),
        ...(worthinessScore !== undefined && { worthinessScore }),
        ip,
        userAgent,
      },
      $inc: { promptCount: body.incrementPrompt ? 1 : 0 },
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
  await ProductMeta.deleteOne({ sessionId });
  return NextResponse.json({ ok: true });
}
