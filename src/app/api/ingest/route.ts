import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, INGESTION_MODELS, generateWithTimeout } from '@/lib/gemini';
import { INGESTION_SYSTEM_PROMPT } from '@/lib/prompts';
import { MANIFEST_RESPONSE_SCHEMA } from '@/lib/schemas';

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
    const ai = getGeminiClient(clientKey);

    if (!ai) {
      return NextResponse.json(
        { error: 'Gemini API key is missing or not configured.' },
        { status: 401 }
      );
    }

    const paperBuffer = Buffer.from(await paperFile.arrayBuffer());
    const markschemeBuffer = Buffer.from(await markschemeFile.arrayBuffer());

    const paperPart = {
      inlineData: {
        data: paperBuffer.toString('base64'),
        mimeType: 'application/pdf',
      },
    };

    const markschemePart = {
      inlineData: {
        data: markschemeBuffer.toString('base64'),
        mimeType: 'application/pdf',
      },
    };

    const prompt = `Ingest these two official IB examination documents:
Document 1: Official IB Question Paper PDF
Document 2: Matching Official IB Markscheme PDF

CRITICAL INGESTION REQUIREMENTS:
1. Verify the total marks indicated on the cover page (e.g. 110 marks for HL, 90 marks for SL). The sum of all question marks in your output MUST match this total.
2. You MUST extract EVERY question from Section A AND Section B (typically 9 to 12 questions in total). Do NOT stop after Section A or after the first 2 questions.
3. Extract complete exam metadata, subject category (STEM or HUMANITIES), official instructions, grade boundaries, and all questions with exact mark codes (M, A, R, N, AG, FT), page mappings, command terms, syllabus subtopics, and Error Carried Forward (ECF) rules.`;

    let responseText: string | undefined;
    let lastError: unknown;

    for (const modelName of INGESTION_MODELS) {
      try {
        console.log(`Attempting document ingestion with model: ${modelName}...`);
        const response = await generateWithTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: [paperPart, markschemePart, prompt],
            config: {
              systemInstruction: INGESTION_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: MANIFEST_RESPONSE_SCHEMA,
              temperature: 0.1,
              maxOutputTokens: 16384,
            },
          }),
          120000,
          modelName
        );

        if (response.text) {
          responseText = response.text;
          console.log(`Document ingestion successfully completed using model: ${modelName}`);
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        console.warn(`Ingestion model ${modelName} encountered error, trying fallback...`, err);
        // Wait 500ms before attempting fallback model
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (!responseText) {
      const errMsg = lastError instanceof Error ? lastError.message : 'All Gemini models experienced capacity issues.';
      throw new Error(`Ingestion failed across available models: ${errMsg}`);
    }

    const manifestData = JSON.parse(responseText);
    manifestData.id = `custom-${Date.now()}`;
    manifestData.createdAt = new Date().toISOString();

    // Ensure instructions array
    if (!Array.isArray(manifestData.instructions) || manifestData.instructions.length === 0) {
      manifestData.instructions = [
        'A clean copy of the mathematics formula booklet is required for this paper.',
        'Unless otherwise stated in the question, all numerical answers should be given exactly or correct to three significant figures.',
        'Full marks are not necessarily awarded for a correct answer with no working. Answers must be supported by working and/or explanations.',
      ];
    }

    // Normalize question numbers, subparts, and re-index pages strictly 1..N containing questions
    if (Array.isArray(manifestData.questions)) {
      const rawPages: number[] = Array.from(
        new Set<number>(
          manifestData.questions.map((q: { pageNumber: number }) => Number(q.pageNumber) || 1)
        )
      ).sort((a: number, b: number) => a - b);

      const pageMap = new Map<number, number>();
      rawPages.forEach((origPage: number, idx: number) => {
        pageMap.set(origPage, idx + 1);
      });

      manifestData.questions = manifestData.questions.map((q: {
        id?: string;
        number: string;
        pageNumber: number;
        subparts?: Array<{ id?: string; partLetter: string; [key: string]: unknown }>;
        [key: string]: unknown;
      }, idx: number) => {
        const cleanNumber = q.number.replace(/^Question\s*/i, '').trim();
        const questionId = q.id || `q${idx + 1}`;

        let normalizedSubparts = undefined;
        if (Array.isArray(q.subparts) && q.subparts.length > 0) {
          normalizedSubparts = q.subparts.map((sub, sIdx) => {
            const cleanLetter = sub.partLetter || `(${String.fromCharCode(97 + sIdx)})`;
            const cleanSuffix = cleanLetter.replace(/[^a-z0-9]/gi, '').toLowerCase() || `${sIdx + 1}`;
            return {
              ...sub,
              id: sub.id || `${questionId}_${cleanSuffix}`,
              partLetter: cleanLetter,
            };
          });
        }

        return {
          ...q,
          id: questionId,
          number: cleanNumber,
          pageNumber: pageMap.get(q.pageNumber) || 1,
          subparts: normalizedSubparts,
        };
      });
    }

    return NextResponse.json({ manifest: manifestData });
  } catch (error: unknown) {
    console.error('Ingestion API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error during document ingestion.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
