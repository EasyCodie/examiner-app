'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExamManifest, ExamSession } from '@/types/exam';
import {
  saveManifest,
  savePdfBlob,
  getAllExamSessions,
  deleteExamSession,
  clearAllExamSessions,
  getAiConfig,
} from '@/lib/storage';
import { BUNDLED_MATH_AA_HL, BUNDLED_ECONOMICS_HL, MAY_2021_MATH_AA_HL_P1 } from '@/lib/samplePapers';
import { useAppShell } from '@/components/common/AppShell';
import { SpikeMark } from '@/components/common/SpikeMark';
import {
  FileUp,
  FileCheck,
  ArrowRight,
  Clock,
  AlertCircle,
  History,
  ChevronRight,
  Check,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileCode,
  Compass,
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
    pillLabel: 'Binary Ingestion',
    pastelBg: '#e6dfd8',
    pastelText: '#141413',
    substeps: [
      'Reading PDF binary streams & byte buffers...',
      'Verifying document structure & page geometry...',
      'Initializing multimodal Gemini context...',
    ],
  },
  {
    stage: 'READING',
    pillLabel: 'OCR Extraction',
    pastelBg: '#5db8a6',
    pastelText: '#141413',
    substeps: [
      'Scanning Question Paper & Markscheme...',
      'Extracting mathematical formulas & diagrams...',
      'Tokenizing multi-part question structures...',
    ],
  },
  {
    stage: 'INDEXING',
    pillLabel: 'Question Alignment',
    pastelBg: '#e8a55a',
    pastelText: '#141413',
    substeps: [
      'Indexing question hierarchy (1, 2(a), 2(b)...)...',
      'Mapping command terms and mark allocations...',
      'Filtering non-question introductory pages...',
    ],
  },
  {
    stage: 'CODES',
    pillLabel: 'ECF Rubrics',
    pastelBg: '#7c6fcd',
    pastelText: '#faf9f5',
    substeps: [
      'Parsing official markscheme breakdown (M, A, R, N)...',
      'Compiling Error Carried Forward (ECF) rules...',
      'Structuring 4-tier pedagogical scaffolds...',
    ],
  },
  {
    stage: 'DONE',
    pillLabel: 'Ready',
    pastelBg: '#cc785c',
    pastelText: '#ffffff',
    substeps: [
      'Assembling authentic exam booklet...',
      'Caching documents in local storage...',
      'Examination paper ready!',
    ],
  },
];

type FlowStep = 'UPLOAD' | 'COMPILING' | 'READY';

export default function HomePage() {
  const router = useRouter();
  const { setHeaderInfo } = useAppShell();

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

  // Session History
  const [pastSessions, setPastSessions] = useState<ExamSession[]>([]);

  useEffect(() => {
    setHeaderInfo({});
    getAllExamSessions().then(setPastSessions);
  }, [setHeaderInfo]);

  const handleSelectSpecimen = async (specimenManifest: ExamManifest) => {
    await saveManifest(specimenManifest);
    setActiveManifest(specimenManifest);
    setStep('READY');
  };

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
            'Synthesizing structured exam manifest...',
            'Linking ECF dependency rules across parts...',
            'Structuring mark criteria & guidance tiers...',
            'Finalizing mathematical LaTeX formatting...',
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
      setCompilingLog('Assembling authentic exam booklet...');
      await new Promise((r) => setTimeout(r, 450));

      await saveManifest(manifest);
      try {
        await savePdfBlob(manifest.id, 'paper', paperFile);
        await savePdfBlob(manifest.id, 'markscheme', markschemeFile);
      } catch (blobErr) {
        console.warn('Non-fatal warning: failed to store raw PDF blobs in IndexedDB:', blobErr);
      }

      setCompilingLog('Examination paper ready!');
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

  return (
    <div className="flex-1 w-full bg-[#faf9f5] text-[#141413]">
      {/* ============================================================ */}
      {/* 1. EDITORIAL HERO SECTION (Claude 6/6 Split)                  */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column (Editorial Voice) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efe9de] border border-[#e6dfd8] text-xs font-mono-code text-[#141413]">
              <SpikeMark className="w-3.5 h-3.5 text-[#cc785c]" />
              <span className="font-semibold text-[#cc785c]">Senior Examiner Intelligence</span>
              <span className="text-[#8e8b82]">• Official IB Ground Truth</span>
            </div>

            <h1 className="display-xl font-serif-display font-normal text-[#141413] tracking-[-1.5px] leading-[1.05]">
              Meet your Senior Examiner.
            </h1>

            <p className="body-md text-[#3d3d3a] max-w-xl text-base sm:text-lg leading-relaxed">
              Authentic International Baccalaureate examination simulation with dual-document markscheme ingestion, method-level scoring, and Error Carried Forward (ECF) protection.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => handleSelectSpecimen(MAY_2021_MATH_AA_HL_P1)}
                className="claude-btn-primary"
              >
                <span>Take Official Specimen Exam</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const element = document.getElementById('upload-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="claude-btn-secondary"
              >
                <span>Upload Dual-PDF</span>
              </button>
            </div>

            {/* Micro-assurances */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#e6dfd8] text-xs text-[#6c6a64]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#5db872]" />
                <span>Zero Hallucinations</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#cc785c]" />
                <span>ECF Method Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#e8a55a]" />
                <span>Timed Exam Simulation</span>
              </div>
            </div>
          </div>

          {/* Right Column (Claude Code-Window Product Card Mockup) */}
          <div className="lg:col-span-5">
            <div className="claude-card-dark p-6 shadow-2xl space-y-4 relative overflow-hidden">
              {/* Card Window Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#c64545]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#d4a017]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#5db872]" />
                  <span className="text-xs font-mono-code text-[#a09d96] ml-2 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-[#cc785c]" />
                    math_aa_hl_markscheme.json
                  </span>
                </div>
                <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-[#252320] text-[#5db8a6] border border-white/10">
                  Verified Ingest
                </span>
              </div>

              {/* Code Snippet in JetBrains Mono */}
              <div className="font-mono-code text-xs space-y-1 text-[#a09d96] leading-relaxed overflow-x-auto bg-[#1f1e1b] p-3.5 rounded-lg border border-white/5">
                <p className="text-[#a09d96]">{'// Senior Examiner Question Evaluation Schema'}</p>
                <p>
                  <span className="text-[#cc785c]">const</span> <span className="text-[#faf9f5]">evaluation</span> = &#123;
                </p>
                <p className="pl-4">
                  <span className="text-[#faf9f5]">question</span>: <span className="text-[#5db8a6]">&quot;Question 12(b)&quot;</span>,
                </p>
                <p className="pl-4">
                  <span className="text-[#faf9f5]">markBreakdown</span>: [
                </p>
                <p className="pl-8 text-[#faf9f5]">
                  &#123; <span className="text-[#e8a55a]">code</span>: <span className="text-[#5db8a6]">&quot;M1&quot;</span>, <span className="text-[#e8a55a]">desc</span>: <span className="text-[#a09d96]">&quot;Substitution into Maclaurin series&quot;</span> &#125;,
                </p>
                <p className="pl-8 text-[#faf9f5]">
                  &#123; <span className="text-[#e8a55a]">code</span>: <span className="text-[#5db8a6]">&quot;A1&quot;</span>, <span className="text-[#e8a55a]">desc</span>: <span className="text-[#a09d96]">&quot;Correct algebraic simplification&quot;</span> &#125;,
                </p>
                <p className="pl-4">],</p>
                <p className="pl-4">
                  <span className="text-[#faf9f5]">ecfProtection</span>: <span className="text-[#5db872]">true</span>, <span className="text-[#a09d96]">{'// No double penalty'}</span>
                </p>
                <p className="pl-4">
                  <span className="text-[#faf9f5]">predictedGrade</span>: <span className="text-[#cc785c]">7</span> <span className="text-[#a09d96]">{'// Boundary: 82%'}</span>
                </p>
                <p>&#125;;</p>
              </div>

              {/* Status Footer inside card */}
              <div className="flex items-center justify-between text-[11px] font-mono-code text-[#a09d96] pt-1">
                <span>Multimodal Vision OCR</span>
                <span className="text-[#5db8a6] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5db8a6] animate-pulse" />
                  Gemini 2.5 Flash Engine
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. DUAL-DOCUMENT UPLOAD BAND (Surface Mode: Light Cream Card) */}
      {/* ============================================================ */}
      <section id="upload-section" className="py-16 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="mb-8 text-center space-y-2">
          <h2 className="display-md font-serif-display font-normal text-[#141413]">
            Ground truth from two documents.
          </h2>
          <p className="body-md text-[#6c6a64] max-w-lg mx-auto text-sm leading-relaxed">
            Upload an official Question Paper PDF and matching Markscheme PDF. The multimodal engine extracts rubric criteria and ECF rules into an immutable exam booklet.
          </p>
        </div>

        {step === 'UPLOAD' && (
          <div className="claude-card-cream p-6 sm:p-10 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Question Paper Dropzone */}
              <div
                onClick={() => paperInputRef.current?.click()}
                className={`p-6 rounded-xl border text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[160px] ${
                  paperFile
                    ? 'bg-[#faf9f5] border-[#cc785c] text-[#141413]'
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
                  <div className="flex flex-col items-center space-y-1">
                    <FileCheck className="w-6 h-6 text-[#cc785c] mb-1" />
                    <span className="text-xs font-mono-code font-semibold text-[#141413] truncate max-w-[220px]">
                      {paperFile.name}
                    </span>
                    <span className="text-[10px] text-[#8e8b82] font-mono-code">
                      Question Paper • {(paperFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#cc785c] mb-2.5">
                      <FileUp className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-[#141413]">1. Question Paper PDF</span>
                    <span className="text-[11px] text-[#8e8b82] mt-0.5">Click or drag exam booklet</span>
                  </>
                )}
              </div>

              {/* Markscheme Dropzone */}
              <div
                onClick={() => markschemeInputRef.current?.click()}
                className={`p-6 rounded-xl border text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[160px] ${
                  markschemeFile
                    ? 'bg-[#faf9f5] border-[#cc785c] text-[#141413]'
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
                  <div className="flex flex-col items-center space-y-1">
                    <FileCheck className="w-6 h-6 text-[#cc785c] mb-1" />
                    <span className="text-xs font-mono-code font-semibold text-[#141413] truncate max-w-[220px]">
                      {markschemeFile.name}
                    </span>
                    <span className="text-[10px] text-[#8e8b82] font-mono-code">
                      Markscheme • {(markschemeFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#cc785c] mb-2.5">
                      <FileUp className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-[#141413]">2. Official Markscheme PDF</span>
                    <span className="text-[11px] text-[#8e8b82] mt-0.5">Click or drag matching rubric</span>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-[#c64545]/10 border border-[#c64545]/30 text-[#c64545] text-xs flex items-center gap-2 font-mono-code">
                <AlertCircle className="w-4 h-4 text-[#c64545] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {paperFile && markschemeFile && (
              <button
                type="button"
                onClick={handleStartIngest}
                className="w-full claude-btn-primary py-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
              >
                <span>Compile Official Exam Booklet</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* COMPILATION TIMELINE (Surface Mode: Dark Product Card)       */}
        {/* ============================================================ */}
        {step === 'COMPILING' && (
          <div className="claude-card-dark p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-serif-display text-2xl font-normal text-[#faf9f5]">
                Compiling Ground-Truth Manifest
              </h3>
              <p className="text-xs text-[#a09d96]">
                Parsing question boundaries, command terms, and ECF dependency chains.
              </p>
            </div>

            {/* 5 Phase Pills */}
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-white/10">
              {COMPILATION_PIPELINE.map((p, idx) => {
                const currentIdx = COMPILATION_PIPELINE.findIndex((s) => s.stage === timelineStage);
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;

                return (
                  <div
                    key={p.stage}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono-code transition-all ${
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

            {/* Telemetry Status Line */}
            <div className="flex items-center justify-between text-xs font-mono-code">
              <div className="flex items-center gap-2.5 text-[#faf9f5]">
                <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-pulse shrink-0" />
                <span>{compilingLog}</span>
              </div>
              <span className="text-[11px] text-[#a09d96]">
                Phase {Math.min(5, COMPILATION_PIPELINE.findIndex((s) => s.stage === timelineStage) + 1)}/5
              </span>
            </div>

            {/* Glowing Progress Track */}
            <div className="w-full h-1.5 bg-[#1f1e1b] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#cc785c] transition-all duration-500 rounded-full"
                style={{
                  width: `${Math.min(100, ((COMPILATION_PIPELINE.findIndex((s) => s.stage === timelineStage) + 1) / 5) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* READY STATE: MODE SELECTION                                   */}
        {/* ============================================================ */}
        {step === 'READY' && activeManifest && (
          <div className="space-y-6">
            <div className="claude-card-cream p-5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-mono-code text-[#6c6a64]">
                  <span className="text-[#cc785c] font-semibold">{activeManifest.category}</span>
                  <span>•</span>
                  <span>{activeManifest.durationMinutes} mins</span>
                  <span>•</span>
                  <span>{activeManifest.totalMarks} marks</span>
                  <span>•</span>
                  <span>{activeManifest.questions.length} questions</span>
                </div>
                <h3 className="font-serif-display text-xl font-normal text-[#141413]">
                  {activeManifest.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('UPLOAD');
                  setPaperFile(null);
                  setMarkschemeFile(null);
                }}
                className="claude-btn-secondary text-xs"
              >
                Change Paper
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Timed Mock */}
              <div className="claude-card-cream p-6 flex flex-col justify-between space-y-4 hover:border-[#cc785c] transition">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="caption-uppercase text-[#cc785c] font-bold">Exam Simulation</span>
                    <span className="text-[#6c6a64] font-mono-code flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {activeManifest.durationMinutes}m
                    </span>
                  </div>
                  <h4 className="font-serif-display text-2xl font-normal text-[#141413]">
                    Timed Mock Exam
                  </h4>
                  <p className="body-md text-[#3d3d3a] text-xs leading-relaxed">
                    Practice under authentic countdown conditions with drawing canvas support. Method marking and ECF protocol applied.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/mock/${activeManifest.id}`)}
                  className="claude-btn-primary w-full"
                >
                  <span>Begin Mock Exam</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Option 2: Socratic Learn */}
              <div className="claude-card-cream p-6 flex flex-col justify-between space-y-4 hover:border-[#cc785c] transition">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="caption-uppercase text-[#5db8a6] font-bold">Collaborative Tutor</span>
                    <span className="text-[#6c6a64] font-mono-code">4-Tier Scaffold</span>
                  </div>
                  <h4 className="font-serif-display text-2xl font-normal text-[#141413]">
                    Socratic Learn Mode
                  </h4>
                  <p className="body-md text-[#3d3d3a] text-xs leading-relaxed">
                    Solve problems step-by-step with command term anchors and formula hints without premature solution leaks.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/learn/${activeManifest.id}`)}
                  className="claude-btn-secondary w-full"
                >
                  <span>Begin Socratic Tutoring</span>
                  <Compass className="w-4 h-4 text-[#cc785c]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 3. AUTHENTIC SPECIMEN PAPERS (Surface Mode: Dark + Cream)     */}
      {/* ============================================================ */}
      <section className="py-16 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
        <div className="space-y-1">
          <div className="caption-uppercase text-[#cc785c] font-semibold">Pre-Loaded Bundles</div>
          <h2 className="display-md font-serif-display font-normal text-[#141413]">
            Authentic Examination Papers
          </h2>
          <p className="body-md text-[#6c6a64] text-sm">
            Zero-token instant mock exams with verified official markschemes and diagrams.
          </p>
        </div>

        {/* Featured May 2021 Math AA HL P1 in Dark Product Card */}
        <div
          onClick={() => handleSelectSpecimen(MAY_2021_MATH_AA_HL_P1)}
          className="claude-card-dark p-6 sm:p-8 cursor-pointer hover:border-[#cc785c] transition group shadow-xl"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <span className="text-[11px] font-mono-code uppercase font-semibold text-[#cc785c] bg-[#cc785c]/15 px-3 py-0.5 rounded-full border border-[#cc785c]/30 flex items-center gap-1.5">
              <SpikeMark className="w-3 h-3 text-[#cc785c]" />
              Official Specimen Paper • 12 Questions (Section A &amp; B)
            </span>
            <span className="text-xs font-mono-code text-[#a09d96]">
              120 mins • 110 marks • Higher Level
            </span>
          </div>

          <h3 className="font-serif-display text-2xl sm:text-3xl font-normal text-[#faf9f5] group-hover:text-[#cc785c] transition">
            Mathematics: Analysis &amp; Approaches HL (May 2021 TZ1)
          </h3>
          <p className="text-xs text-[#a09d96] mt-2 max-w-2xl leading-relaxed">
            Authentic 12-question examination covering rational curves, piecewise functions, integration, Maclaurin expansions, complex numbers, and proof by mathematical induction.
          </p>

          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/10 text-xs font-mono-code text-[#a09d96]">
            <span>M1/A1/R1 Mark Codes</span>
            <span>•</span>
            <span>Cartesian Graph Integration</span>
            <span>•</span>
            <span className="text-[#5db872]">ECF Guaranteed</span>
          </div>
        </div>

        {/* 2-up Grid of Secondary Bundles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => handleSelectSpecimen(BUNDLED_MATH_AA_HL)}
            className="claude-card-cream p-5 cursor-pointer hover:border-[#cc785c] transition group"
          >
            <div className="flex items-center justify-between text-xs font-mono-code text-[#8e8b82] mb-1.5">
              <span className="text-[#5db8a6] font-semibold">STEM Track</span>
              <span>120m • 50 marks</span>
            </div>
            <h4 className="font-serif-display text-lg text-[#141413] group-hover:text-[#cc785c] transition font-normal">
              Mathematics: Analysis &amp; Approaches HL
            </h4>
            <p className="text-xs text-[#6c6a64] mt-1">
              Paper 1 Specimen • Calculus, Vectors, Complex Roots &amp; Mathematical Induction.
            </p>
          </div>

          <div
            onClick={() => handleSelectSpecimen(BUNDLED_ECONOMICS_HL)}
            className="claude-card-cream p-5 cursor-pointer hover:border-[#cc785c] transition group"
          >
            <div className="flex items-center justify-between text-xs font-mono-code text-[#8e8b82] mb-1.5">
              <span className="text-[#e8a55a] font-semibold">Humanities Track</span>
              <span>75m • 50 marks</span>
            </div>
            <h4 className="font-serif-display text-lg text-[#141413] group-hover:text-[#cc785c] transition font-normal">
              Economics Higher Level (HL)
            </h4>
            <p className="text-xs text-[#6c6a64] mt-1">
              Paper 1 Specimen • Extended response essay with inline economic supply/demand sketchpad.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. PAST SESSIONS TABLE                                        */}
      {/* ============================================================ */}
      {pastSessions.length > 0 && (
        <section className="py-12 px-4 sm:px-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#6c6a64]" />
              <h3 className="font-serif-display text-xl font-normal text-[#141413]">
                Past Examination Sessions ({pastSessions.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={async () => {
                await clearAllExamSessions();
                setPastSessions([]);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono-code text-[#6c6a64] hover:text-[#c64545] hover:bg-[#c64545]/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="divide-y divide-[#e6dfd8] rounded-xl bg-[#efe9de] border border-[#e6dfd8] overflow-hidden">
            {pastSessions.map((sess) => {
              const res = sess.gradingResults;
              return (
                <div
                  key={sess.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-[#e8e0d2] transition group"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[10px] font-mono-code text-[#8e8b82]">
                      {new Date(sess.startedAt).toLocaleDateString()}
                    </span>
                    <h4 className="text-xs font-medium text-[#141413] line-clamp-1">
                      {sess.paperTitle}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {res ? (
                      <div className="text-right">
                        <span className="text-xs font-mono-code font-bold text-[#cc785c] block">
                          Grade {res.predictedGrade}
                        </span>
                        <span className="text-[10px] font-mono-code text-[#6c6a64]">
                          {res.totalMarksAwarded}/{res.totalPossibleMarks} ({res.percentage}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono-code text-[#e8a55a]">
                        In Progress
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await deleteExamSession(sess.id);
                          setPastSessions((prev) => prev.filter((s) => s.id !== sess.id));
                        }}
                        className="p-1.5 rounded text-[#8e8b82] hover:text-[#c64545] transition"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={res ? `/results/${sess.id}` : `/mock/${sess.paperId}`}
                        className="p-1 rounded text-[#141413] hover:text-[#cc785c] transition"
                        title="View session results"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 5. PRE-FOOTER FULL-BLEED CORAL CALLOUT CARD (Claude Signature)*/}
      {/* ============================================================ */}
      <section className="py-16 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="claude-card-coral p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="display-md font-serif-display font-normal text-white">
              Master your IB exams with examiner precision.
            </h2>
            <p className="text-sm text-white/90 max-w-lg leading-relaxed">
              Experience the rigor of official senior examiners with ECF protection and Socratic guidance before exam day.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSelectSpecimen(MAY_2021_MATH_AA_HL_P1)}
            className="claude-btn-secondary px-6 py-3 shrink-0 text-sm font-semibold"
          >
            <span>Start Practice Exam</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. DARK NAVY FOOTER (Claude Footer Standard)                 */}
      {/* ============================================================ */}
      <footer className="bg-[#181715] text-[#a09d96] border-t border-white/10 py-12 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <SpikeMark className="w-4 h-4 text-[#cc785c]" />
            <span className="font-serif-display text-base text-[#faf9f5] font-normal">
              IB Examiner
            </span>
            <span className="text-xs text-[#a09d96]">
              • Ground-Truth Markscheme Evaluation Engine
            </span>
          </div>

          <p className="text-xs text-[#a09d96] font-mono-code text-center sm:text-right">
            Designed to authentic International Baccalaureate Diploma standards.
          </p>
        </div>
      </footer>
    </div>
  );
}
