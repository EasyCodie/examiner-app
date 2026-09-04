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
} from '@/lib/storage';
import { BUNDLED_MATH_AA_HL, BUNDLED_ECONOMICS_HL, MAY_2021_MATH_AA_HL_P1 } from '@/lib/samplePapers';
import { useAppShell } from '@/components/common/AppShell';
import {
  FileUp,
  FileCheck,
  ArrowRight,
  Clock,
  AlertCircle,
  History,
  ChevronRight,
  Sparkles,
  Check,
  Trash2,
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
    pillLabel: 'Loading',
    pastelBg: '#dfa88f',
    pastelText: '#0c0d0e',
    substeps: [
      'Reading PDF binary streams...',
      'Verifying document structure & integrity...',
      'Initializing multimodal Gemini context...',
    ],
  },
  {
    stage: 'READING',
    pillLabel: 'Reading',
    pastelBg: '#9fbbe0',
    pastelText: '#0c0d0e',
    substeps: [
      'Scanning Question Paper & Markscheme...',
      'Extracting mathematical formulas & diagrams...',
      'Tokenizing multi-part question structures...',
    ],
  },
  {
    stage: 'INDEXING',
    pillLabel: 'Indexing',
    pastelBg: '#9fc9a2',
    pastelText: '#0c0d0e',
    substeps: [
      'Indexing question hierarchy (1, 2(a), 2(b)...)...',
      'Mapping command terms and mark allocations...',
      'Filtering non-question introductory pages...',
    ],
  },
  {
    stage: 'CODES',
    pillLabel: 'Rubrics',
    pastelBg: '#c0a8dd',
    pastelText: '#0c0d0e',
    substeps: [
      'Parsing official markscheme breakdown (M, A, R, N)...',
      'Compiling Error Carried Forward (ECF) rules...',
      'Structuring 4-tier pedagogical scaffolds...',
    ],
  },
  {
    stage: 'DONE',
    pillLabel: 'Ready',
    pastelBg: '#c08532',
    pastelText: '#0c0d0e',
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
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [markschemeFile, setMarkschemeFile] = useState<File | null>(null);
  const [activeManifest, setActiveManifest] = useState<ExamManifest | null>(null);

  // Timeline stages
  const [timelineStage, setTimelineStage] = useState<
    'THINKING' | 'READING' | 'INDEXING' | 'CODES' | 'DONE'
  >('THINKING');
  const [compilingLog, setCompilingLog] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<ExamSession[]>([]);

  const paperInputRef = useRef<HTMLInputElement>(null);
  const markschemeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHeaderInfo({ paperTitle: undefined, mode: undefined });
    const hasPurged = typeof window !== 'undefined' && localStorage.getItem('examiner_purged_past_sessions_v1');
    if (!hasPurged) {
      clearAllExamSessions().then(() => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('examiner_purged_past_sessions_v1', 'true');
        }
        setPastSessions([]);
      });
    } else {
      getAllExamSessions().then(setPastSessions);
    }
  }, [setHeaderInfo]);

  // Handle Specimen Selection
  const handleSelectSpecimen = async (specimen: ExamManifest) => {
    setError(null);
    setDirection('forward');
    setStep('COMPILING');
    setActiveManifest(specimen);

    await saveManifest(specimen);

    setTimelineStage('THINKING');
    setCompilingLog('Loading examination paper...');
    await new Promise((r) => setTimeout(r, 450));

    setTimelineStage('READING');
    setCompilingLog(`Reading ${specimen.title}...`);
    await new Promise((r) => setTimeout(r, 550));

    setTimelineStage('INDEXING');
    setCompilingLog(`Indexing ${specimen.questions.length} questions...`);
    await new Promise((r) => setTimeout(r, 500));

    setTimelineStage('CODES');
    setCompilingLog('Indexing mark schemes and rubrics...');
    await new Promise((r) => setTimeout(r, 500));

    setTimelineStage('DONE');
    setCompilingLog('Paper ready.');
    await new Promise((r) => setTimeout(r, 400));

    setStep('READY');
  };

  // Handle Custom Dual-PDF Ingestion with Continuous Multi-Phase Progression
  const handleStartIngest = async () => {
    if (!paperFile || !markschemeFile) {
      setError('Please provide both the Question Paper PDF and the matching Markscheme PDF.');
      return;
    }

    setError(null);
    setDirection('forward');
    setStep('COMPILING');
    setTimelineStage('THINKING');
    setCompilingLog('Reading PDF binary streams...');

    // Continuous progress step simulator while waiting on Gemini API
    let phaseIdx = 0;
    let substepIdx = 0;
    let isFinished = false;

    const progressTimer = setInterval(() => {
      if (isFinished) return;

      substepIdx++;
      const currentPhase = COMPILATION_PIPELINE[phaseIdx];
      if (!currentPhase) return;

      if (substepIdx < currentPhase.substeps.length) {
        setCompilingLog(currentPhase.substeps[substepIdx]);
      } else {
        // Advance to next phase (cap at CODES before server returns)
        if (phaseIdx < 3) {
          phaseIdx++;
          substepIdx = 0;
          const nextPhase = COMPILATION_PIPELINE[phaseIdx];
          setTimelineStage(nextPhase.stage);
          setCompilingLog(nextPhase.substeps[0]);
        } else {
          // Keep cycling with active telemetry so it never feels stalled
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

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to ingest documents.');
      }

      isFinished = true;
      clearInterval(progressTimer);

      const manifest: ExamManifest = data.manifest;

      // Final step transition
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
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 max-w-3xl mx-auto w-full min-h-[90vh]">
      {/* Brand Anchor (Quiet standalone emblem on home screen) */}
      <div className="flex items-center gap-2 mb-10 select-none">
        <div className="w-7 h-7 rounded-lg bg-[#141517] border border-white/[0.08] flex items-center justify-center text-[#f54e00]">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-medium tracking-tight text-[#f3f3f2]">
          IB Examiner
        </span>
      </div>

      {/* ============================================================ */}
      {/* STEP 1: UPLOAD (Initial Onboarding Step)                      */}
      {/* ============================================================ */}
      {step === 'UPLOAD' && (
        <div
          key="upload-step"
          className={`w-full space-y-8 ${direction === 'forward' ? 'animate-step-forward' : 'animate-step-back'}`}
        >
          <div className="space-y-2 text-center">
            <h1 className="text-3xl sm:text-4xl text-[#f3f3f2] tracking-tight">
              Upload your exam paper.
            </h1>
            <p className="text-sm text-[#9b9a95] max-w-md mx-auto leading-relaxed">
              Upload an official Question Paper and its matching Markscheme to begin.
            </p>
          </div>

          {/* Dual Dropzone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Question Paper Dropzone */}
            <div
              onClick={() => paperInputRef.current?.click()}
              className={`p-6 rounded-xl border text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.18] active:scale-[0.99] flex flex-col items-center justify-center min-h-[150px] ${
                paperFile
                  ? 'bg-[#18191d] border-[#f54e00]/60 text-[#f3f3f2]'
                  : 'bg-[#141517] border-white/[0.08] text-[#9b9a95] hover:text-[#f3f3f2]'
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
                <div className="animate-step-enter flex flex-col items-center">
                  <FileCheck className="w-5 h-5 text-[#f54e00] mb-2" />
                  <span className="text-xs font-mono-code font-medium text-[#f3f3f2] truncate max-w-[220px]">
                    {paperFile.name}
                  </span>
                  <span className="text-[10px] text-[#686763] font-mono-code mt-0.5">
                    Question Paper • {(paperFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-lg bg-[#1a1b1e] border border-white/[0.08] flex items-center justify-center text-[#9b9a95] mb-2.5 transition-transform group-hover:scale-105">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#f3f3f2]">1. Question Paper PDF</span>
                  <span className="text-[11px] text-[#686763] mt-0.5">Click or drag PDF</span>
                </>
              )}
            </div>

            {/* Markscheme Dropzone */}
            <div
              onClick={() => markschemeInputRef.current?.click()}
              className={`p-6 rounded-xl border text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.18] active:scale-[0.99] flex flex-col items-center justify-center min-h-[150px] ${
                markschemeFile
                  ? 'bg-[#18191d] border-[#f54e00]/60 text-[#f3f3f2]'
                  : 'bg-[#141517] border-white/[0.08] text-[#9b9a95] hover:text-[#f3f3f2]'
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
                <div className="animate-step-enter flex flex-col items-center">
                  <FileCheck className="w-5 h-5 text-[#f54e00] mb-2" />
                  <span className="text-xs font-mono-code font-medium text-[#f3f3f2] truncate max-w-[220px]">
                    {markschemeFile.name}
                  </span>
                  <span className="text-[10px] text-[#686763] font-mono-code mt-0.5">
                    Markscheme • {(markschemeFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-lg bg-[#1a1b1e] border border-white/[0.08] flex items-center justify-center text-[#9b9a95] mb-2.5 transition-transform group-hover:scale-105">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#f3f3f2]">2. Markscheme PDF</span>
                  <span className="text-[11px] text-[#686763] mt-0.5">Click or drag PDF</span>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#cf2d56]/15 border border-[#cf2d56]/30 text-[#f3f3f2] text-xs flex items-center gap-2 font-mono-code">
              <AlertCircle className="w-4 h-4 text-[#cf2d56] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Action */}
          {paperFile && markschemeFile && (
            <button
              type="button"
              onClick={handleStartIngest}
              className="w-full py-2.5 px-4 cursor-btn-primary text-xs font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform animate-step-enter"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Specimen Papers */}
          <div className="pt-4 border-t border-white/[0.08] space-y-3">
            <span className="text-xs text-[#686763] block font-normal">Or choose a preloaded authentic paper:</span>

            {/* Featured Full 12-Question Exam Paper */}
            <div
              onClick={() => handleSelectSpecimen(MAY_2021_MATH_AA_HL_P1)}
              className="p-4 rounded-xl bg-[#18191d] border border-[#f54e00]/40 hover:border-[#f54e00] hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer transition-all duration-200 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-[11px] font-mono-code mb-1.5">
                <span className="text-[#f54e00] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f54e00] animate-pulse" />
                  AUTHENTIC IB EXAM • 12 QUESTIONS (SEC A &amp; B)
                </span>
                <span className="text-[#9b9a95]">120m • 110 marks</span>
              </div>
              <h3 className="text-sm font-medium text-[#f3f3f2] group-hover:text-white transition">
                Mathematics: Analysis &amp; Approaches HL (May 2021 TZ1)
              </h3>
              <p className="text-xs text-[#9b9a95] mt-0.5">
                Full 12-question official paper with function graphs, calculus, vectors, Maclaurin series &amp; induction.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Specimen 1: Math AA HL */}
              <div
                onClick={() => handleSelectSpecimen(BUNDLED_MATH_AA_HL)}
                className="p-4 rounded-xl bg-[#141517] border border-white/[0.08] hover:border-white/[0.18] hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono-code text-[#686763] mb-1.5">
                  <span className="text-[#9fbbe0]">STEM</span>
                  <span>120m • 50 marks</span>
                </div>
                <h3 className="text-xs font-medium text-[#f3f3f2] group-hover:text-white transition">
                  Mathematics: Analysis &amp; Approaches HL
                </h3>
                <p className="text-xs text-[#686763] mt-0.5 line-clamp-1">
                  Paper 1 • Calculus, Vectors, Induction
                </p>
              </div>

              {/* Specimen 2: Economics HL */}
              <div
                onClick={() => handleSelectSpecimen(BUNDLED_ECONOMICS_HL)}
                className="p-4 rounded-xl bg-[#141517] border border-white/[0.08] hover:border-white/[0.18] hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono-code text-[#686763] mb-1.5">
                  <span className="text-[#c0a8dd]">Humanities</span>
                  <span>75m • 50 marks</span>
                </div>
                <h3 className="text-xs font-medium text-[#f3f3f2] group-hover:text-white transition">
                  Economics Higher Level
                </h3>
                <p className="text-xs text-[#686763] mt-0.5 line-clamp-1">
                  Paper 1 • Micro &amp; Macro Extended Response
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: COMPILING TIMELINE                                   */}
      {/* ============================================================ */}
      {step === 'COMPILING' && (
        <div key="compiling-step" className="w-full max-w-lg space-y-6 py-6 animate-step-forward">
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl sm:text-3xl text-[#f3f3f2] tracking-tight font-normal">
              Loading Paper
            </h2>
            <p className="text-xs text-[#9b9a95]">
              Parsing questions and mark schemes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#141517] border border-white/[0.08] space-y-5 shadow-2xl relative overflow-hidden">
            {/* Top 5 Phase Pills */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-4 border-b border-white/[0.08]">
              {COMPILATION_PIPELINE.map((p, idx) => {
                const currentIdx = COMPILATION_PIPELINE.findIndex((s) => s.stage === timelineStage);
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;

                return (
                  <div
                    key={p.stage}
                    className={`timeline-pill transition-all duration-300 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-code ${
                      isActive
                        ? 'scale-105 shadow-md ring-1 ring-white/20'
                        : isCompleted
                        ? 'opacity-90'
                        : 'opacity-40'
                    }`}
                    style={{
                      backgroundColor: isActive ? p.pastelBg : isCompleted ? '#1e2024' : '#141517',
                      color: isActive ? p.pastelText : isCompleted ? '#9b9a95' : '#686763',
                      border: isCompleted ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
                    }}
                  >
                    {isCompleted && <Check className="w-3 h-3 text-[#1f8a65]" />}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#0c0d0e] animate-ping" />}
                    <span>{p.pillLabel}</span>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Status Log with Smooth Animation */}
            <div className="flex items-center justify-between text-xs font-mono-code pt-1">
              <div className="flex items-center gap-2.5 text-[#f3f3f2] min-h-[24px]">
                <span className="w-2 h-2 rounded-full bg-[#f54e00] animate-pulse shrink-0" />
                <span key={compilingLog} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                  {compilingLog}
                </span>
              </div>
              <span className="text-[11px] text-[#686763] shrink-0 font-medium">
                Phase {Math.min(5, COMPILATION_PIPELINE.findIndex((s) => s.stage === timelineStage) + 1)}/5
              </span>
            </div>

            {/* Continuous Glowing Progress Track */}
            <div className="w-full h-1 bg-[#0c0d0e] rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#f54e00]/40 via-[#f54e00] to-[#dfa88f] transition-all duration-500 rounded-full"
                style={{
                  width: `${Math.min(100, ((COMPILATION_PIPELINE.findIndex((s) => s.stage === timelineStage) + 1) / 5) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: READY / MODE SELECT                                  */}
      {/* ============================================================ */}
      {step === 'READY' && activeManifest && (
        <div key="ready-step" className="w-full space-y-6 animate-step-forward">
          <div className="space-y-1.5 text-center">
            <h2 className="text-2xl sm:text-3xl text-[#f3f3f2] tracking-tight">
              Select your mode.
            </h2>
            <p className="text-xs text-[#9b9a95]">
              Choose between a timed mock exam or Socratic study.
            </p>
          </div>

          {/* Paper Summary Pill */}
          <div className="p-4 rounded-xl bg-[#141517] border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-mono-code text-[#686763]">
                <span className="text-[#f54e00] font-medium">{activeManifest.category}</span>
                <span>•</span>
                <span>{activeManifest.durationMinutes}m</span>
                <span>•</span>
                <span>{activeManifest.totalMarks} marks</span>
                <span>•</span>
                <span>{activeManifest.questions.length} questions</span>
              </div>
              <h3 className="text-xs font-medium text-[#f3f3f2]">{activeManifest.title}</h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setDirection('back');
                setStep('UPLOAD');
                setPaperFile(null);
                setMarkschemeFile(null);
              }}
              className="px-2.5 py-1.5 rounded-md bg-[#1a1b1e] hover:bg-[#222428] border border-white/[0.08] text-xs font-mono-code text-[#9b9a95] hover:text-[#f3f3f2] active:scale-[0.98] transition shrink-0"
            >
              Change
            </button>
          </div>

          {/* Two Mode Cards with Staggered Entrance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Mode 1: Timed Mock */}
            <div className="animate-card-1 p-5 rounded-xl bg-[#141517] border border-white/[0.08] hover:border-white/[0.18] hover:-translate-y-0.5 flex flex-col justify-between space-y-4 transition-all duration-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono-code text-[#f54e00] uppercase font-semibold">
                    Exam Practice
                  </span>
                  <span className="text-[#686763] font-mono-code flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {activeManifest.durationMinutes}m
                  </span>
                </div>

                <div>
                  <h3 className="text-base text-[#f3f3f2] font-normal">
                    Timed Mock Exam
                  </h3>
                  <p className="text-xs text-[#9b9a95] mt-1.5 leading-relaxed">
                    Practice under authentic countdown conditions.
                    {activeManifest.category === 'STEM'
                      ? ' Write calculations directly on the canvas.'
                      : ' Write structured essays in the split editor.'}
                  </p>
                </div>

                <div className="text-[10px] font-mono-code text-[#686763] pt-0.5">
                  Error Carried Forward (ECF) grading applied
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/mock/${activeManifest.id}`)}
                className="w-full py-2.5 px-3.5 cursor-btn-primary text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
              >
                <span>Start Mock Exam</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode 2: Socratic Learn */}
            <div className="animate-card-2 p-5 rounded-xl bg-[#141517] border border-white/[0.08] hover:border-white/[0.18] hover:-translate-y-0.5 flex flex-col justify-between space-y-4 transition-all duration-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono-code text-[#9fbbe0] uppercase font-semibold">
                    Interactive Tutor
                  </span>
                </div>

                <div>
                  <h3 className="text-base text-[#f3f3f2] font-normal">
                    Socratic Learn Mode
                  </h3>
                  <p className="text-xs text-[#9b9a95] mt-1.5 leading-relaxed">
                    Work through each question step-by-step. Get hints and formula guidance without spoiling the solution.
                  </p>
                </div>

                <div className="text-[10px] font-mono-code text-[#686763] pt-0.5">
                  4-Tier hints &amp; formula assistance
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/learn/${activeManifest.id}`)}
                className="w-full py-2.5 px-3.5 cursor-btn-secondary text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
              >
                <span>Start Socratic Learn</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PAST SESSIONS                                                */}
      {/* ============================================================ */}
      {pastSessions.length > 0 && (
        <div className="w-full mt-12 pt-6 border-t border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-[#686763]" />
              <span className="text-xs font-mono-code text-[#9b9a95] uppercase tracking-wider">
                Past Sessions ({pastSessions.length})
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                await clearAllExamSessions();
                setPastSessions([]);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono-code text-[#686763] hover:text-[#cf2d56] hover:bg-[#cf2d56]/10 border border-transparent hover:border-[#cf2d56]/20 transition active:scale-95"
              title="Delete all past exam sessions"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="divide-y divide-white/[0.06] rounded-xl bg-[#141517] border border-white/[0.08] overflow-hidden">
            {pastSessions.map((sess) => {
              const res = sess.gradingResults;
              return (
                <div
                  key={sess.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#1a1b1e] transition group"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[10px] font-mono-code text-[#686763]">
                      {new Date(sess.startedAt).toLocaleDateString()}
                    </span>
                    <h4 className="text-xs text-[#f3f3f2] font-medium line-clamp-1">
                      {sess.paperTitle}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {res ? (
                      <div className="text-right">
                        <span className="text-xs font-mono-code font-semibold text-[#f54e00] block">
                          Grade {res.predictedGrade}
                        </span>
                        <span className="text-[10px] font-mono-code text-[#686763]">
                          {res.totalMarksAwarded}/{res.totalPossibleMarks} ({res.percentage}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono-code text-[#dfa88f]">
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
                        title="Delete session"
                        className="p-1.5 rounded text-[#686763] hover:text-[#cf2d56] hover:bg-[#cf2d56]/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={res ? `/results/${sess.id}` : `/mock/${sess.paperId}`}
                        className="p-1 rounded text-[#9b9a95] hover:text-[#f3f3f2] transition"
                        title="View session results"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
