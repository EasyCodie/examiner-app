'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ExamManifest } from '@/types/exam';
import { saveManifest, savePdfBlob, getAiConfig } from '@/lib/storage';
import { useAppShell } from '@/components/common/AppShell';
import { PdfField } from '@/components/ingest/PdfField';
import { MissingKeyError, NO_KEY } from '@/lib/aiKey';

type FlowStep = 'UPLOAD' | 'COMPILING' | 'READY';

const formatElapsed = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

export default function IngestPage() {
  const { setHeaderInfo, openAiStudio } = useAppShell();

  const [step, setStep] = useState<FlowStep>('UPLOAD');
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [markschemeFile, setMarkschemeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [hasClientKey, setHasClientKey] = useState<boolean | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [activeManifest, setActiveManifest] = useState<ExamManifest | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setHeaderInfo({});
    getAiConfig().then((cfg) => setHasClientKey(Boolean(cfg.apiKey)));
  }, [setHeaderInfo]);

  // Honest progress: how long the examiner has been reading, not scripted stages
  useEffect(() => {
    if (step !== 'COMPILING') return;
    const started = Date.now();
    const interval = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleStartIngest = async () => {
    if (!paperFile || !markschemeFile) {
      setError('Add both PDFs: the question paper and its markscheme.');
      return;
    }

    setError(null);
    setNeedsKey(false);
    setElapsed(0);
    setStep('COMPILING');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const formData = new FormData();
      formData.append('paperFile', paperFile);
      formData.append('markschemeFile', markschemeFile);

      const cfg = await getAiConfig();
      if (!cfg.apiKey) throw new MissingKeyError();
      const response = await fetch('/api/ingest', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          ...(cfg.apiKey ? { 'x-gemini-key': cfg.apiKey } : {}),
          ...(cfg.zaiApiKey ? { 'x-zai-key': cfg.zaiApiKey } : {}),
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.code === NO_KEY) throw new MissingKeyError();
        throw new Error(data.error || `The server returned ${response.status}.`);
      }

      const manifest: ExamManifest = data.manifest;
      await saveManifest(manifest);
      try {
        await savePdfBlob(manifest.id, 'paper', paperFile);
        await savePdfBlob(manifest.id, 'markscheme', markschemeFile);
      } catch (blobErr) {
        console.warn('Non-fatal warning: failed to store raw PDF blobs in IndexedDB:', blobErr);
      }

      setActiveManifest(manifest);
      setStep('READY');
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        setStep('UPLOAD');
        return;
      }
      setError(err instanceof Error ? err.message : 'The PDFs could not be read.');
      setNeedsKey(err instanceof MissingKeyError);
      setStep('UPLOAD');
    }
  };

  const resetForm = () => {
    setPaperFile(null);
    setMarkschemeFile(null);
    setError(null);
    setNeedsKey(false);
    setActiveManifest(null);
    setStep('UPLOAD');
  };

  return (
    <div className="flex-1 w-full px-3 sm:px-5 py-10 sm:py-14">
      <article className="script-sheet paper-surface mx-auto max-w-[816px] px-6 sm:px-14 py-10 sm:py-12 space-y-10">
        <header className="space-y-3">
          <h1 className="font-serif text-[36px] sm:text-[40px] leading-[1.1] font-semibold text-ink">Add a paper</h1>
          <p className="text-[17px] leading-relaxed text-ink max-w-[60ch]">
            Upload a question paper and its markscheme as PDFs. Gemini reads both and turns them into a timed exam and a
            guided practice session. The finished paper is saved in this browser.
          </p>
        </header>

        {step === 'UPLOAD' && (
          <>
            {hasClientKey === false && (
              <div className="border-t border-b border-ink py-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[15px] leading-relaxed text-ink max-w-[52ch]">
                  Reading PDFs needs your own Gemini API key. None is saved in this browser yet.
                </p>
                <button type="button" onClick={() => openAiStudio('apiKey')} className="btn btn-sm btn-quiet-paper">
                  Add an API key
                </button>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <PdfField
                label="Question paper"
                hint="The paper students sit, with its diagrams."
                file={paperFile}
                onChange={(f) => {
                  setPaperFile(f);
                  setError(null);
                }}
                onReject={setError}
              />
              <PdfField
                label="Markscheme"
                hint="The matching markscheme, with its mark codes."
                file={markschemeFile}
                onChange={(f) => {
                  setMarkschemeFile(f);
                  setError(null);
                }}
                onReject={setError}
              />
            </div>

            {error && (
              <div role="alert" className="border border-lost px-5 py-4 space-y-3">
                <p className="text-[15px] leading-relaxed text-ink">
                  {needsKey ? 'Gemini rejected the request: an API key is missing or not valid.' : error}
                </p>
                {needsKey && (
                  <button type="button" onClick={() => openAiStudio('apiKey')} className="btn btn-sm btn-ink">
                    Add an API key
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-paper-rule pt-6">
              <p className="text-[14px] text-ink-muted">
                {paperFile && markschemeFile ? 'Both files are ready.' : 'Add both files to continue.'}
              </p>
              <button type="button" disabled={!paperFile || !markschemeFile} onClick={handleStartIngest} className="btn btn-ink">
                Build the paper
              </button>
            </div>
          </>
        )}

        {step === 'COMPILING' && (
          <section role="status" aria-live="polite" className="space-y-5">
            <h2 className="font-serif text-[24px] font-semibold text-ink">Reading your paper</h2>
            <p className="text-[16px] leading-relaxed text-ink max-w-[60ch]">
              Gemini is reading <span className="font-semibold">{paperFile?.name}</span> and{' '}
              <span className="font-semibold">{markschemeFile?.name}</span>: the questions, their parts and marks, and every
              mark code in the markscheme. A long paper can take a few minutes.
            </p>
            <p className="tabular text-[15px] text-ink-muted">
              <span aria-hidden="true">Elapsed </span>
              <span className="sr-only">Time elapsed: </span>
              {formatElapsed(elapsed)}
            </p>
            <button type="button" onClick={() => abortRef.current?.abort()} className="btn btn-quiet-paper">
              Cancel
            </button>
          </section>
        )}

        {step === 'READY' && activeManifest && (
          <section className="space-y-8" aria-labelledby="ready-heading">
            <div className="space-y-2">
              <h2 id="ready-heading" className="font-serif text-[28px] font-semibold text-ink">
                {activeManifest.title}
              </h2>
              <p className="text-[16px] text-ink-muted">{activeManifest.subtitle}</p>
            </div>
            <dl className="grid grid-cols-3 gap-px bg-paper-rule border-t border-b border-ink tabular">
              {[
                ['Writing time', `${activeManifest.durationMinutes} min`],
                ['Total marks', String(activeManifest.totalMarks)],
                ['Questions', String(activeManifest.questions.length)],
              ].map(([term, value]) => (
                <div key={term} className="bg-paper p-4">
                  <dt className="text-[13px] text-ink-muted">{term}</dt>
                  <dd className="mt-1 text-[22px] font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[15px] leading-relaxed text-ink-muted max-w-[60ch]">
              Check the first question against your PDF before relying on the marking; automatic reading can misplace a mark
              or a diagram.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/mock/${activeManifest.id}`} className="btn btn-ink">
                Sit it as a timed exam
              </Link>
              <Link href={`/learn/${activeManifest.id}`} className="btn btn-quiet-paper">
                Practise with the tutor
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="min-h-11 px-2 text-[15px] text-ink underline underline-offset-4"
              >
                Add another paper
              </button>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
