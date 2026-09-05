import { NextRequest, NextResponse } from 'next/server';
import { compileExamManifest } from '@/lib/ingestion/compiler';

export const dynamic = 'force-dynamic';
export const maxDuration = 180; // 3 minute maximum for dual PDF multimodal extraction

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const paperFile = formData.get('paperFile') as File | null;
    const markschemeFile = formData.get('markschemeFile') as File | null;

    if (!paperFile || !markschemeFile) {
      return NextResponse.json(
        { error: 'Both Question Paper and Markscheme PDFs are required.' },
        { status: 400 }
      );
    }

    const clientKey = req.headers.get('x-gemini-key') || undefined;
    const clientZaiKey = req.headers.get('x-zai-key') || undefined;

    const paperBuffer = Buffer.from(await paperFile.arrayBuffer());
    const markschemeBuffer = Buffer.from(await markschemeFile.arrayBuffer());

    const manifest = await compileExamManifest(paperBuffer, markschemeBuffer, {
      geminiKey: clientKey,
      zaiKey: clientZaiKey,
    });

    return NextResponse.json({ manifest });
  } catch (error: unknown) {
    console.error('Ingestion Route Adapter Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error during document ingestion.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
