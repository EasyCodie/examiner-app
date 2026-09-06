'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExamManifest } from '@/types/exam';
import {
  saveManifest,
  savePdfBlob,
  getAiConfig,
} from '@/lib/storage';
import { SpikeMark } from '@/components/common/SpikeMark';
import {
  FileUp,
  FileCheck,
  ArrowRight,
  Clock,
  AlertCircle,
  Check,
  Compass,
  ArrowLeft,
  FileCode,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface CompilationStep {
  stage: 'THINKING' | 'READING' | 'INDEXING' | 'CODES' | 'DONE';
  pillLabel: string;
  pastelBg: string;
  pastelText: string;
  substeps: string[];
}

const COMPILATION_PIPELINE: CompilationStep[] = [
  {
    stage: 'THINKING',
    pillLabel: 'Reading Files',
    pastelBg: '#e6dfd8',
    pastelText: '#141413',
    substeps: [
      'Reading PDF files...',
      'Checking page numbers and layout...',
      'Preparing questions...',
    ],
  },
  {
    stage: 'READING',
    pillLabel: 'Scanning Questions',
    pastelBg: '#5db8a6',
    pastelText: '#141413',
    substeps: [
      'Reading question prompts and markscheme...',
      'Recognizing formulas and diagrams...',
      'Organizing question parts...',
    ],
  },
  {
    stage: 'INDEXING',
    pillLabel: 'Matching Markscheme',
    pastelBg: '#e8a55a',
    pastelText: '#141413',
    substeps: [
      'Linking questions to their marks...',
      'Identifying command terms and point totals...',
      'Skipping cover and formula pages...',
    ],
  },
  {
    stage: 'CODES',
    pillLabel: 'Setting Up Rules',
    pastelBg: '#7c6fcd',
    pastelText: '#faf9f5',
    substeps: [
      'Reading method, accuracy, and reasoning criteria...',
      'Configuring follow-through mark protection...',
      'Setting up step-by-step tutor hints...',
    ],
  },
  {
    stage: 'DONE',
    pillLabel: 'Ready',
    pastelBg: '#cc785c',
    pastelText: '#ffffff',
    substeps: [
      'Assembling your practice exam...',
      'Saving to your browser...',
      'Your exam is ready!',
    ],
  },
];

type FlowStep = 'UPLOAD' | 'COMPILING' | 'READY';

export default function IngestPage() {
  const router = useRouter();

  const [step, setStep] = useState<FlowStep>('UPLOAD');

  // Dual Dropzone State
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [markschemeFile, setMarkschemeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paperInputRef = useRef<HTMLInputElement>(null);
  const markschemeInputRef = useRef<HTMLInputElement>(null);

  // Compilation Pipeline State
  const [timelineStage, setTimelineStage] = useState<CompilationStep['stage']>('THINKING');
  const [compilingLog, setCompilingLog] = useState<string>(COMPILATION_PIPELINE[0].substeps[0]);

  // Ready State
  const [activeManifest, setActiveManifest] = useState<ExamManifest | null>(null);

  const handleStartIngest = async () => {
    if (!paperFile || !markschemeFile) {
      setError('Please provide both the Question Paper PDF and the matching Markscheme PDF.');
      return;
    }

    setError(null);
    setStep('COMPILING');
    setTimelineStage('THINKING');
    setCompilingLog(COMPILATION_PIPELINE[0].substeps[0]);

    let stageIdx = 0;
    let substepIdx = 0;
    let isFinished = false;

    const progressTimer = setInterval(() => {
      if (isFinished) return;
      substepIdx++;
      const currentPhase = COMPILATION_PIPELINE[stageIdx];

      if (currentPhase && substepIdx < currentPhase.substeps.length) {
        setCompilingLog(currentPhase.substeps[substepIdx]);
      } else {
        substepIdx = 0;
        stageIdx++;
        if (stageIdx < COMPILATION_PIPELINE.length - 1) {
          const nextPhase = COMPILATION_PIPELINE[stageIdx];
          setTimelineStage(nextPhase.stage);
          setCompilingLog(nextPhase.substeps[0]);
        } else {
          const waitingTelemetry = [
            'Assembling questions and mark schemes...',
            'Connecting follow-through rules...',
            'Preparing hints and tutor guidance...',
            'Polishing math formulas...',
          ];
          setCompilingLog(waitingTelemetry[substepIdx % waitingTelemetry.length]);
        }
      }
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('paperFile', paperFile);
      formData.append('markschemeFile', markschemeFile);

      const cfg = await getAiConfig();
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          ...(cfg.apiKey ? { 'x-gemini-key': cfg.apiKey } : {}),
          ...(cfg.zaiApiKey ? { 'x-zai-key': cfg.zaiApiKey } : {}),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to ingest documents.');
      }

      isFinished = true;
      clearInterval(progressTimer);

      const manifest: ExamManifest = data.manifest;

      setTimelineStage('DONE');
      setCompilingLog('Assembling your practice exam...');
      await new Promise((r) => setTimeout(r, 450));

      await saveManifest(manifest);
      try {
        await savePdfBlob(manifest.id, 'paper', paperFile);
        await savePdfBlob(manifest.id, 'markscheme', markschemeFile);
      } catch (blobErr) {
        console.warn('Non-fatal warning: failed to store raw PDF blobs in IndexedDB:', blobErr);
      }

      setCompilingLog('Your exam is ready!');
      setActiveManifest(manifest);

      await new Promise((r) => setTimeout(r, 500));
      setStep('READY');
    } catch (err: unknown) {
      isFinished = true;
      clearInterval(progressTimer);
      const msg = err instanceof Error ? err.message : 'Error processing documents.';
      setError(msg);
      setStep('UPLOAD');
    }
  };

  const resetForm = () => {
    setPaperFile(null);
    setMarkschemeFile(null);
    setError(null);
    setActiveManifest(null);
    setStep('UPLOAD');
  };

  return (
    <div className="flex-1 w-full bg-[#faf9f5] text-[#141413] py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#6c6a64] hover:text-[#141413] transition active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Exam Catalog</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efe9de] border border-[#e6dfd8] text-xs font-mono-code text-[#141413]">
            <SpikeMark className="w-3.5 h-3.5 text-[#cc785c]" />
            <span className="font-semibold text-[#cc785c]">Add Past Paper</span>
            <span className="text-[#8e8b82]">• Question Paper + Markscheme</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="display-lg font-serif-display font-normal text-[#141413] tracking-[-1px]">
            Add Past Exam Papers
          </h1>
          <p className="body-md text-[#3d3d3a] text-sm sm:text-base max-w-2xl leading-relaxed">
            Upload an official IB Question Paper and its matching Markscheme PDF. We will turn them into an interactive exam with step-by-step method marking and follow-through protection.
          </p>
        </div>

        {/* ============================================================ */}
        {/* STEP 1: UPLOAD STATE                                         */}
        {/* ============================================================ */}
        {step === 'UPLOAD' && (
          <div className="claude-card-cream p-6 sm:p-10 space-y-6 shadow-sm border border-[#e6dfd8]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Question Paper Dropzone */}
              <div
                onClick={() => paperInputRef.current?.click()}
                className={`p-6 rounded-xl border text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[190px] ${
                  paperFile
                    ? 'bg-[#faf9f5] border-[#cc785c] text-[#141413] shadow-xs'
                    : 'bg-[#faf9f5] border-[#e6dfd8] hover:border-[#cc785c]/60 text-[#6c6a64] hover:text-[#141413]'
                }`}
              >
                <input
                  ref={paperInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setPaperFile(e.target.files[0]);
                  }}
                />
                {paperFile ? (
                  <div className="flex flex-col items-center space-y-1.5">
                    <div className="w-10 h-10 rounded-lg bg-[#cc785c]/10 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c] mb-1">
                      <FileCheck className="w-5 h-5 text-[#cc785c]" />
                    </div>
                    <span className="text-xs font-mono-code font-semibold text-[#141413] truncate max-w-[240px]">
                      {paperFile.name}
                    </span>
                    <span className="text-[11px] text-[#8e8b82] font-mono-code">
                      Question Paper • {(paperFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span className="text-[10px] text-[#5db872] font-mono-code font-semibold pt-1">
                      ✓ Document Attached
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#cc785c] mb-3">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-[#141413]">1. Question Paper PDF</span>
                    <span className="text-xs text-[#8e8b82] mt-1">Click to select or drag booklet</span>
                    <span className="text-[10px] text-[#a09d96] font-mono-code mt-2">
                      The questions and diagrams for students
                    </span>
                  </>
                )}
              </div>

              {/* 2. Markscheme Dropzone */}
              <div
                onClick={() => markschemeInputRef.current?.click()}
                className={`p-6 rounded-xl border text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[190px] ${
                  markschemeFile
                    ? 'bg-[#faf9f5] border-[#cc785c] text-[#141413] shadow-xs'
                    : 'bg-[#faf9f5] border-[#e6dfd8] hover:border-[#cc785c]/60 text-[#6c6a64] hover:text-[#141413]'
                }`}
              >
                <input
                  ref={markschemeInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setMarkschemeFile(e.target.files[0]);
                  }}
                />
                {markschemeFile ? (
                  <div className="flex flex-col items-center space-y-1.5">
                    <div className="w-10 h-10 rounded-lg bg-[#cc785c]/10 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c] mb-1">
                      <FileCheck className="w-5 h-5 text-[#cc785c]" />
                    </div>
                    <span className="text-xs font-mono-code font-semibold text-[#141413] truncate max-w-[240px]">
                      {markschemeFile.name}
                    </span>
                    <span className="text-[11px] text-[#8e8b82] font-mono-code">
                      Markscheme • {(markschemeFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span className="text-[10px] text-[#5db872] font-mono-code font-semibold pt-1">
                      ✓ Document Attached
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#cc785c] mb-3">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-[#141413]">2. Official Markscheme PDF</span>
                    <span className="text-xs text-[#8e8b82] mt-1">Click to select or drag rubric</span>
                    <span className="text-[10px] text-[#a09d96] font-mono-code mt-2">
                      The official marking criteria and answers
                    </span>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-[#c64545]/10 border border-[#c64545]/30 text-[#c64545] text-xs flex items-center gap-2.5 font-mono-code">
                <AlertCircle className="w-4 h-4 text-[#c64545] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#e6dfd8]">
              <div className="flex items-center gap-4 text-xs font-mono-code text-[#6c6a64]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#5db872]" />
                  <span>Saved securely in your browser</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#cc785c]" />
                  <span>Smart formula recognition</span>
                </div>
              </div>

              <button
                type="button"
                disabled={!paperFile || !markschemeFile}
                onClick={handleStartIngest}
                className="claude-btn-primary w-full sm:w-auto px-6 py-2.5 disabled:opacity-40 transition active:scale-[0.98]"
              >
                <span>Create Practice Exam</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: COMPILATION PIPELINE TELEMETRY                       */}
        {/* ============================================================ */}
        {step === 'COMPILING' && (
          <div className="claude-card-dark p-6 sm:p-10 space-y-6 shadow-2xl rounded-2xl border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <h2 className="font-serif-display text-2xl font-normal text-[#faf9f5]">
                  Preparing Your Exam Paper
                </h2>
                <p className="text-xs text-[#a09d96]">
                  Reading formulas, question parts, and marking rules.
                </p>
              </div>

              <div className="text-right font-mono-code text-xs text-[#cc785c]">
                <span>Phase {Math.min(5, COMPILATION_PIPELINE.findIndex((s) => s.stage === timelineStage) + 1)}/5</span>
              </div>
            </div>

            {/* 5 Phase Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {COMPILATION_PIPELINE.map((p, idx) => {
                const currentIdx = COMPILATION_PIPELINE.findIndex((s) => s.stage === timelineStage);
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;

                return (
                  <div
                    key={p.stage}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-code transition-all ${
                      isActive
                        ? 'bg-[#cc785c] text-white font-bold shadow-md'
                        : isCompleted
                        ? 'bg-[#252320] text-[#5db872] border border-white/10'
                        : 'bg-[#1f1e1b] text-[#6c6a64]'
                    }`}
                  >
                    {isCompleted && <Check className="w-3 h-3 text-[#5db872]" />}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                    <span>{p.pillLabel}</span>
                  </div>
                );
              })}
            </div>

            {/* Glowing Progress Track */}
            <div className="w-full h-2 bg-[#1f1e1b] rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-[#cc785c] transition-all duration-500 rounded-full"
                style={{
                  width: `${Math.min(100, ((COMPILATION_PIPELINE.findIndex((s) => s.stage === timelineStage) + 1) / 5) * 100)}%`,
                }}
              />
            </div>

            {/* Live Telemetry Log Card */}
            <div className="p-4 rounded-xl bg-[#1f1e1b] border border-white/5 space-y-2 font-mono-code text-xs">
              <div className="flex items-center justify-between text-[#8e8b82] border-b border-white/5 pb-2">
                <span className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>Exam Preparation Progress</span>
                </span>
                <span className="text-[#5db8a6]">AI Examiner</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#faf9f5] pt-1">
                <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-pulse shrink-0" />
                <span>{compilingLog}</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: READY STATE & MODE SELECTION                         */}
        {/* ============================================================ */}
        {step === 'READY' && activeManifest && (
          <div className="space-y-6">
            {/* Manifest Summary Bar */}
            <div className="claude-card-cream p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#e6dfd8] shadow-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono-code text-[#6c6a64]">
                  <span className="text-[#cc785c] font-semibold">{activeManifest.category}</span>
                  <span>•</span>
                  <span>{activeManifest.durationMinutes} mins</span>
                  <span>•</span>
                  <span>{activeManifest.totalMarks} marks</span>
                  <span>•</span>
                  <span>{activeManifest.questions.length} questions</span>
                </div>
                <h2 className="font-serif-display text-2xl font-normal text-[#141413]">
                  {activeManifest.title}
                </h2>
                <p className="text-xs text-[#6c6a64] font-mono-code">
                  {activeManifest.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="claude-btn-secondary text-xs flex items-center gap-1.5 active:scale-[0.98]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#6c6a64]" />
                <span>Add Another Paper</span>
              </button>
            </div>

            {/* Mode Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Option 1: Timed Mock Examination */}
              <div className="claude-card-cream p-7 flex flex-col justify-between space-y-5 rounded-2xl border border-[#e6dfd8] hover:border-[#cc785c] transition group shadow-xs">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="caption-uppercase text-[#cc785c] font-bold">Exam Simulation</span>
                    <span className="text-[#6c6a64] font-mono-code flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {activeManifest.durationMinutes}m
                    </span>
                  </div>
                  <h3 className="font-serif-display text-2xl font-normal text-[#141413]">
                    Timed Mock Exam
                  </h3>
                  <p className="body-md text-[#3d3d3a] text-xs leading-relaxed">
                    Practice under real exam conditions with a built-in notepad and canvas. Your working is marked step-by-step with follow-through protection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/mock/${activeManifest.id}`)}
                  className="claude-btn-primary w-full active:scale-[0.98]"
                >
                  <span>Begin Mock Exam</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Option 2: Socratic Learn Mode */}
              <div className="claude-card-cream p-7 flex flex-col justify-between space-y-5 rounded-2xl border border-[#e6dfd8] hover:border-[#cc785c] transition group shadow-xs">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="caption-uppercase text-[#5db8a6] font-bold">Collaborative Tutor</span>
                    <span className="text-[#6c6a64] font-mono-code">Step-by-Step Guidance</span>
                  </div>
                  <h3 className="font-serif-display text-2xl font-normal text-[#141413]">
                    Socratic Learn Mode
                  </h3>
                  <p className="body-md text-[#3d3d3a] text-xs leading-relaxed">
                    Work through problems step by step with targeted hints, formula booklet reminders, and guided feedback.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/learn/${activeManifest.id}`)}
                  className="claude-btn-secondary w-full active:scale-[0.98]"
                >
                  <span>Start Socratic Tutor</span>
                  <Compass className="w-4 h-4 text-[#cc785c]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
