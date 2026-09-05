import { NextRequest, NextResponse } from 'next/server';
import { renderGraphServer } from '@/lib/graphServerRenderer';
import { CartesianGraphSpec } from '@/lib/graphRenderer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const spec: CartesianGraphSpec = await request.json();

    if (!spec) {
      return NextResponse.json(
        { error: 'Graph specification is required in request body.' },
        { status: 400 }
      );
    }

    const svg = await renderGraphServer(spec);

    return NextResponse.json({
      success: true,
      svg,
      theme: spec.theme || 'exam',
    });
  } catch (err: unknown) {
    console.error('Error rendering Cartesian graph:', err);
    const message = err instanceof Error ? err.message : 'Unknown error during Python graph rendering';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
