import { NextRequest, NextResponse } from 'next/server';
import { compileExamManifest, IngestionError } from '@/lib/ingestion/compiler';
import { checkUploadPair, isPdfBytes, MAX_UPLOAD_BYTES } from '@/lib/ingestion/uploadLimits';
import { missingKeyBody, readClientKeys } from '@/lib/aiKey';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Vercel Hobby's ceiling; the pipeline stops itself at 270 s

const INGESTION_ERRORS: Record<IngestionError['code'], { status: number; error: string }> = {
  INVALID_KEY: { status: 401, error: 'Gemini rejected your API key. Check it in Settings and try again.' },
  MODELS_UNAVAILABLE: { status: 502, error: "Gemini couldn't read the PDFs right now. Try again in a few minutes." },
  UNREADABLE_OUTPUT: {
    status: 422,
    error: "The PDFs were read, but they couldn't be turned into a paper. Check that they are a question paper and its matching markscheme, then try again.",
  },
};

export async function POST(req: NextRequest) {
  const { geminiKey: clientKey, zaiKey: clientZaiKey } = readClientKeys(req.headers);
  if (!clientKey) {
    return NextResponse.json(missingKeyBody, { status: 401 });
  }

  // Refuse an oversize body before reading it; the multipart envelope adds a little over the files
  if (Number(req.headers.get('content-length')) > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json(
      { error: 'These PDFs are too large to upload. Upload smaller copies.', code: 'TOO_LARGE' },
      { status: 413 }
    );
  }

  try {
    const formData = await req.formData();
    const paperFile = formData.get('paperFile');
    const markschemeFile = formData.get('markschemeFile');

    if (!(paperFile instanceof File) || !(markschemeFile instanceof File)) {
      return NextResponse.json(
        { error: 'Add both PDFs: the question paper and its markscheme.', code: 'MISSING_FILES' },
        { status: 400 }
      );
    }

    const tooLarge = checkUploadPair(paperFile, markschemeFile);
    if (tooLarge) {
      return NextResponse.json({ error: tooLarge, code: 'TOO_LARGE' }, { status: 413 });
    }

    const paperBuffer = Buffer.from(await paperFile.arrayBuffer());
    const markschemeBuffer = Buffer.from(await markschemeFile.arrayBuffer());
    if (!isPdfBytes(paperBuffer) || !isPdfBytes(markschemeBuffer)) {
      return NextResponse.json(
        { error: 'Both files must be PDFs. Export the paper and markscheme as PDF and try again.', code: 'NOT_PDF' },
        { status: 400 }
      );
    }

    const manifest = await compileExamManifest(paperBuffer, markschemeBuffer, {
      geminiKey: clientKey,
      zaiKey: clientZaiKey,
    });

    return NextResponse.json({ manifest });
  } catch (error: unknown) {
    console.error('Ingestion Route Adapter Error:', error);
    if (error instanceof IngestionError) {
      const { status, error: message } = INGESTION_ERRORS[error.code];
      return NextResponse.json({ error: message, code: error.code }, { status });
    }
    return NextResponse.json(
      { error: 'Something went wrong while reading the PDFs. Try again.', code: 'INGEST_FAILED' },
      { status: 500 }
    );
  }
}
