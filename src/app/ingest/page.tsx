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
            className="inline-flex items-center gap-2 text-xs font-medium text-[#54524c] hover:text-[#141413] transition active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Exam Catalog</span>
          </Link>

          <div className="eyebrow-pill bg-[#efe9de] border border-[#e6dfd8] text-[#141413] gap-2 px-3.5 py-1">
            <SpikeMark className="w-3.5 h-3.5 text-[#a94e32]" />
            <span className="font-semibold text-[#a94e32]">Add Past Paper</span>
            <span className="text-[#54524c]">• Question Paper + Markscheme</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="display-lg font-serif-display font-normal text-[#141413] tracking-[-1.5px]">
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
          <div className="double-bezel-outer-cream">
            <div className="double-bezel-inner-cream p-6 sm:p-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Question Paper Dropzone */}
                <div className="p-1 rounded-2xl bg-[#e6dfd8]/60 transition-fluid group/drop">
                  <div
                    onClick={() => paperInputRef.current?.click()}
                    className={`p-6 rounded-[calc(1rem+4px)] border text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[190px] ${
                      paperFile
                        ? 'bg-[#faf9f5] border-[#a94e32] text-[#141413] shadow-xs'
                        : 'bg-[#faf9f5] border-[#e6dfd8] hover:border-[#a94e32]/60 text-[#54524c] hover:text-[#141413]'
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
                      <div className="flex flex-col items-center space-y-1.5 animate-attach-settle">
                        <div className="w-10 h-10 rounded-xl bg-[#a94e32]/10 border border-[#a94e32]/30 flex items-center justify-center text-[#a94e32] mb-1">
                          <FileCheck className="w-5 h-5 text-[#a94e32]" />
                        </div>
                        <span className="text-xs font-mono-code font-semibold text-[#141413] truncate max-w-[240px]">
                          {paperFile.name}
                        </span>
                        <span className="text-[11px] text-[#54524c] font-mono-code">
                          Question Paper • {(paperFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="text-[10px] text-[#5db872] font-mono-code font-semibold pt-1">
                          ✓ Document Attached
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#a94e32] mb-3 group-hover/drop:scale-105 transition-spring">
                          <FileUp className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-[#141413]">1. Question Paper PDF</span>
                        <span className="text-xs text-[#54524c] mt-1">Click to select or drag booklet</span>
                        <span className="text-[10px] text-[#54524c] font-mono-code mt-2">
                          The questions and diagrams for students
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Markscheme Dropzone */}
                <div className="p-1 rounded-2xl bg-[#e6dfd8]/60 transition-fluid group/drop">
                  <div
                    onClick={() => markschemeInputRef.current?.click()}
                    className={`p-6 rounded-[calc(1rem+4px)] border text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[190px] ${
                      markschemeFile
                        ? 'bg-[#faf9f5] border-[#a94e32] text-[#141413] shadow-xs'
                        : 'bg-[#faf9f5] border-[#e6dfd8] hover:border-[#a94e32]/60 text-[#54524c] hover:text-[#141413]'
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
                      <div className="flex flex-col items-center space-y-1.5 animate-attach-settle">
                        <div className="w-10 h-10 rounded-xl bg-[#a94e32]/10 border border-[#a94e32]/30 flex items-center justify-center text-[#a94e32] mb-1">
                          <FileCheck className="w-5 h-5 text-[#a94e32]" />
                        </div>
                        <span className="text-xs font-mono-code font-semibold text-[#141413] truncate max-w-[240px]">
                          {markschemeFile.name}
                        </span>
                        <span className="text-[11px] text-[#54524c] font-mono-code">
                          Markscheme • {(markschemeFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="text-[10px] text-[#5db872] font-mono-code font-semibold pt-1">
                          ✓ Document Attached
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#a94e32] mb-3 group-hover/drop:scale-105 transition-spring">
                          <FileUp className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-[#141413]">2. Official Markscheme PDF</span>
                        <span className="text-xs text-[#54524c] mt-1">Click to select or drag booklet</span>
                        <span className="text-[10px] text-[#54524c] font-mono-code mt-2">
                          The official scoring rubric with mark codes
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-[#c64545]/10 border border-[#c64545]/25 text-[#c64545] text-xs flex items-center gap-2.5 font-mono-code animate-message-enter">
                  <AlertCircle className="w-4 h-4 text-[#c64545] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e6dfd8]">
                <div className="text-xs text-[#54524c] font-mono-code">
                  Ready to read questions, formulas, and mark codes
                </div>

                <button
                  type="button"
                  disabled={!paperFile || !markschemeFile}
                  onClick={handleStartIngest}
                  className="claude-btn-pill-primary w-full sm:w-auto px-6 py-2.5 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>Create Practice Exam</span>
                  <span className="btn-icon-bubble">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: COMPILATION PIPELINE TELEMETRY                       */}
        {/* ============================================================ */}
        {step === 'COMPILING' && (
          <div className="double-bezel-outer-dark animate-message-enter">
            <div className="double-bezel-inner-dark p-6 sm:p-10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <h2 className="font-serif-display text-2xl font-normal text-[#faf9f5]">
                    Preparing Your Exam Paper
                  </h2>
                  <p className="text-xs text-[#a09d96]">
                    Reading formulas, question parts, and marking rules.
                  </p>
                </div>

                <div className="eyebrow-pill bg-white/5 border border-white/10 text-[#cc785c] px-3 py-1">
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-code transition-fluid ${
                        isActive
                          ? 'bg-[#cc785c] text-white font-bold shadow-md ring-2 ring-[#cc785c]/30'
                          : isCompleted
                          ? 'bg-[#252320] text-[#5db872] border border-white/10'
                          : 'bg-[#1f1e1b] text-[#6c6a64]'
                      }`}
                    >
                      {isCompleted && <Check className="w-3 h-3 text-[#5db872] animate-stamp-reveal" />}
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                      <span>{p.pillLabel}</span>
                    </div>
                  );
                })}
              </div>

              {/* Glowing Progress Track */}
              <div className="w-full h-2 bg-[#1f1e1b] rounded-full overflow-hidden border border-white/5 p-0.5 relative">
                <div
                  className="h-full bg-linear-to-r from-[#cc785c] to-[#e8a55a] transition-fluid duration-500 rounded-full shadow-[0_0_12px_rgba(204,120,92,0.4)] relative overflow-hidden"
                  style={{
                    width: `${Math.min(100, ((COMPILATION_PIPELINE.findIndex((s) => s.stage === timelineStage) + 1) / 5) * 100)}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-beam-scan pointer-events-none" />
                </div>
              </div>

              {/* Live Telemetry Log Card */}
              <div className="p-4 rounded-xl bg-[#141413] border border-white/10 space-y-2 font-mono-code text-xs shadow-inner">
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
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: READY STATE & MODE SELECTION                         */}
        {/* ============================================================ */}
        {step === 'READY' && activeManifest && (
          <div className="space-y-6">
            {/* Manifest Summary Bar */}
            <div className="double-bezel-outer-cream">
              <div className="double-bezel-inner-cream p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono-code text-[#54524c]">
                    <span className="text-[#a94e32] font-semibold">{activeManifest.category}</span>
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
                  <p className="text-xs text-[#54524c] font-mono-code">
                    {activeManifest.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="claude-btn-pill-secondary text-xs flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#54524c]" />
                  <span>Add Another Paper</span>
                </button>
              </div>
            </div>

            {/* Mode Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Option 1: Timed Mock Examination */}
              <div className="double-bezel-outer-cream">
                <div className="double-bezel-inner-cream p-7 flex flex-col justify-between space-y-6 h-full">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="eyebrow-pill bg-[#a94e32]/10 text-[#a94e32] border border-[#a94e32]/20 px-2.5 py-0.5">
                        Exam Simulation
                      </span>
                      <span className="text-[#54524c] font-mono-code flex items-center gap-1">
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
                    className="claude-btn-pill-primary w-full justify-between"
                  >
                    <span>Begin Mock Exam</span>
                    <span className="btn-icon-bubble">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </span>
                  </button>
                </div>
              </div>

              {/* Option 2: Socratic Learn Mode */}
              <div className="double-bezel-outer-cream">
                <div className="double-bezel-inner-cream p-7 flex flex-col justify-between space-y-6 h-full">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="eyebrow-pill bg-[#1d6c5f]/10 text-[#1d6c5f] border border-[#1d6c5f]/30 px-2.5 py-0.5">
                        Collaborative Tutor
                      </span>
                      <span className="text-[#54524c] font-mono-code">Step-by-Step Guidance</span>
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
                    className="claude-btn-pill-secondary w-full justify-between"
                  >
                    <span>Start Socratic Tutor</span>
                    <span className="btn-icon-bubble bg-[#efe9de] text-[#a94e32]">
                      <Compass className="w-3.5 h-3.5 text-[#a94e32]" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
