'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ExamManifest, ExamSession } from '@/types/exam';
import {
  saveManifest,
  getAllExamSessions,
  deleteExamSession,
  clearAllExamSessions,
} from '@/lib/storage';
import { BUNDLED_MATH_AA_HL, BUNDLED_ECONOMICS_HL, MAY_2021_MATH_AA_HL_P1 } from '@/lib/samplePapers';
import { useAppShell } from '@/components/common/AppShell';
import { SpikeMark } from '@/components/common/SpikeMark';
import {
  ArrowRight,
  Clock,
  History,
  ChevronRight,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileCode,
  Compass,
  FileUp,
  FileCheck,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { setHeaderInfo } = useAppShell();

  // Session History State
  const [pastSessions, setPastSessions] = useState<ExamSession[]>([]);

  useEffect(() => {
    setHeaderInfo({});
    getAllExamSessions().then(setPastSessions);
  }, [setHeaderInfo]);

  const handleLaunchSpecimen = async (specimenManifest: ExamManifest, mode: 'mock' | 'learn' = 'mock') => {
    await saveManifest(specimenManifest);
    if (mode === 'learn') {
      router.push(`/learn/${specimenManifest.id}`);
    } else {
      router.push(`/mock/${specimenManifest.id}`);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#faf9f5] text-[#141413]">
      {/* ============================================================ */}
      {/* 1. EDITORIAL HERO SECTION (Claude 6/6 Split)                  */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column (Editorial Voice & Restrained Stack) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efe9de] border border-[#e6dfd8] text-xs font-mono-code text-[#141413]">
              <SpikeMark className="w-3.5 h-3.5 text-[#cc785c]" />
              <span className="font-semibold text-[#cc785c]">Official IB Exam Standards</span>
              <span className="text-[#8e8b82]">• Step-by-Step Marking</span>
            </div>

            <h1 className="display-xl font-serif-display font-normal text-[#141413] tracking-[-1.5px] leading-[1.05]">
              Meet your Senior Examiner.
            </h1>

            <p className="body-md text-[#3d3d3a] max-w-xl text-base sm:text-lg leading-relaxed">
              Practice real International Baccalaureate past papers with step-by-step method marking, follow-through protection, and guided tutor hints.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => handleLaunchSpecimen(MAY_2021_MATH_AA_HL_P1, 'mock')}
                className="claude-btn-primary active:scale-[0.98]"
              >
                <span>Start Specimen Exam</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/ingest"
                className="claude-btn-secondary active:scale-[0.98]"
              >
                <FileUp className="w-4 h-4 text-[#cc785c]" />
                <span>Add Your Own Past Paper</span>
              </Link>
            </div>
          </div>

          {/* Right Column (Editorial Photography + Live Code Product Chrome) */}
          <div className="lg:col-span-5">
            <div className="claude-card-dark rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
              {/* Tactile Real Examination Visual Window */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden border-b border-white/10 bg-[#1f1e1b]">
                <Image
                  src="/images/ib_exam_hero.jpg"
                  alt="Authentic International Baccalaureate examination paper booklet with examiner annotations"
                  fill
                  priority
                  className="object-cover object-center transform hover:scale-[1.02] transition duration-500"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181715] via-transparent to-transparent opacity-85 pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <span className="text-[11px] font-mono-code px-2.5 py-0.5 rounded-full bg-[#181715]/90 backdrop-blur-sm text-[#faf9f5] border border-white/15">
                    Authentic Specimen Booklet
                  </span>
                  <span className="text-[11px] font-mono-code px-2.5 py-0.5 rounded-full bg-[#cc785c] text-white font-medium shadow-xs">
                    Verified Markscheme
                  </span>
                </div>
              </div>

              {/* Interactive Rubric & Code Inspector */}
              <div className="p-5 space-y-3 bg-[#181715]">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
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
                    Multimodal OCR
                  </span>
                </div>

                <div className="font-mono-code text-xs space-y-1 text-[#a09d96] leading-relaxed overflow-x-auto bg-[#1f1e1b] p-3 rounded-lg border border-white/5">
                  <p className="text-[#a09d96]">{'// Step-by-step method marks & follow-through'}</p>
                  <p>
                    <span className="text-[#cc785c]">const</span> <span className="text-[#faf9f5]">evaluation</span> = &#123;
                  </p>
                  <p className="pl-4">
                    <span className="text-[#faf9f5]">question</span>: <span className="text-[#5db8a6]">&quot;Question 12(b)&quot;</span>,
                  </p>
                  <p className="pl-4">
                    <span className="text-[#faf9f5]">markCodes</span>: [
                  </p>
                  <p className="pl-8 text-[#faf9f5]">
                    &#123; <span className="text-[#e8a55a]">code</span>: <span className="text-[#5db8a6]">&quot;M1&quot;</span>, <span className="text-[#e8a55a]">type</span>: <span className="text-[#5db8a6]">&quot;Method&quot;</span>, <span className="text-[#e8a55a]">marks</span>: <span className="text-[#cc785c]">2</span> &#125;,
                  </p>
                  <p className="pl-8 text-[#faf9f5]">
                    &#123; <span className="text-[#e8a55a]">code</span>: <span className="text-[#5db8a6]">&quot;A1&quot;</span>, <span className="text-[#e8a55a]">type</span>: <span className="text-[#5db872]">&quot;Accuracy&quot;</span>, <span className="text-[#e8a55a]">marks</span>: <span className="text-[#cc785c]">1</span> &#125;,
                  </p>
                  <p className="pl-4">],</p>
                  <p className="pl-4">
                    <span className="text-[#faf9f5]">ecfProtection</span>: <span className="text-[#5db872]">true</span>, <span className="text-[#faf9f5]">predictedGrade</span>: <span className="text-[#cc785c]">7</span>
                  </p>
                  <p>&#125;;</p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono-code text-[#a09d96] pt-0.5">
                  <span>Marking Criteria</span>
                  <span className="text-[#5db8a6] font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5db8a6] animate-pulse" />
                    Gemini 2.5 Flash
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* DEDICATED TRUST & ACCREDITATION STRIP                        */}
      {/* ============================================================ */}
      <div className="w-full border-y border-[#e6dfd8] bg-[#efe9de]/50 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-6 text-xs text-[#6c6a64] font-mono-code">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#5db872] shrink-0" />
            <span>Official Markschemes • Exact Criteria</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#cc785c] shrink-0" />
            <span>Method Marks • Follow-Through Protection</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#e8a55a] shrink-0" />
            <span>Timed Exam Mode • Built-in Canvas</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DUAL-DOCUMENT INGESTION STUDIO TEASER                      */}
      {/* ============================================================ */}
      <section className="py-14 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="claude-card-cream p-7 sm:p-9 rounded-2xl border border-[#e6dfd8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono-code text-[#cc785c] font-semibold">
              <FileCheck className="w-4 h-4 text-[#cc785c]" />
              <span>Add Past Papers</span>
            </div>
            <h2 className="display-sm font-serif-display font-normal text-[#141413]">
              Have past exam papers you want to practice?
            </h2>
            <p className="body-md text-[#3d3d3a] text-xs sm:text-sm leading-relaxed">
              Upload any IB Question Paper and Markscheme PDF. We will turn them into an interactive exam with full method marks and helpful tutor hints.
            </p>
          </div>

          <Link
            href="/ingest"
            className="claude-btn-primary shrink-0 px-6 py-3 text-xs font-medium flex items-center gap-2 active:scale-[0.98]"
          >
            <span>Add Past Papers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. AUTHENTIC SPECIMEN PAPERS (Surface Mode: Dark + Cream)     */}
      {/* ============================================================ */}
      <section id="specimens-section" className="py-12 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="display-md font-serif-display font-normal text-[#141413]">
            Practice Past Papers
          </h2>
          <p className="body-md text-[#6c6a64] text-sm">
            Ready-to-practice past papers with complete markschemes, diagrams, and formulas.
          </p>
        </div>

        {/* Featured May 2021 Math AA HL P1 in Dark Product Card */}
        <div className="claude-card-dark p-6 sm:p-8 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-[11px] font-mono-code uppercase font-semibold text-[#cc785c] bg-[#cc785c]/15 px-3 py-0.5 rounded-full border border-[#cc785c]/30 flex items-center gap-1.5">
              <SpikeMark className="w-3 h-3 text-[#cc785c]" />
              Official Past Paper • 12 Questions (Section A &amp; B)
            </span>
            <span className="text-xs font-mono-code text-[#a09d96]">
              120 mins • 110 marks • Higher Level
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif-display text-2xl sm:text-3xl font-normal text-[#faf9f5]">
              Mathematics: Analysis &amp; Approaches HL (May 2021 TZ1)
            </h3>
            <p className="text-xs text-[#a09d96] max-w-2xl leading-relaxed">
              Complete 12-question exam covering rational curves, piecewise functions, integration, Maclaurin expansions, complex numbers, and proof by induction.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-white/10 text-xs font-mono-code text-[#a09d96]">
            <span>M1/A1/R1 Mark Codes</span>
            <span>•</span>
            <span>Cartesian Graph Integration</span>
            <span>•</span>
            <span className="text-[#5db872]">Follow-Through Protected</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleLaunchSpecimen(MAY_2021_MATH_AA_HL_P1, 'mock')}
              className="claude-btn-primary text-xs active:scale-[0.98]"
            >
              <span>Start Timed Exam</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleLaunchSpecimen(MAY_2021_MATH_AA_HL_P1, 'learn')}
              className="claude-btn-secondary-on-dark text-xs active:scale-[0.98]"
            >
              <Compass className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>Step-by-Step Practice</span>
            </button>
          </div>
        </div>

        {/* 2-up Grid of Secondary Bundles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="claude-card-cream p-5 rounded-2xl border border-[#e6dfd8] flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code text-[#8e8b82]">
                <span className="text-[#5db8a6] font-semibold">STEM Track</span>
                <span>120m • 50 marks</span>
              </div>
              <h4 className="font-serif-display text-lg text-[#141413] font-normal">
                Mathematics: Analysis &amp; Approaches HL
              </h4>
              <p className="text-xs text-[#6c6a64]">
                Paper 1 • Calculus, Vectors, Complex Roots &amp; Mathematical Induction.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#e6dfd8]">
              <button
                type="button"
                onClick={() => handleLaunchSpecimen(BUNDLED_MATH_AA_HL, 'mock')}
                className="claude-btn-primary text-xs py-2 px-3.5 active:scale-[0.98]"
              >
                <span>Timed Exam</span>
              </button>
              <button
                type="button"
                onClick={() => handleLaunchSpecimen(BUNDLED_MATH_AA_HL, 'learn')}
                className="claude-btn-secondary text-xs py-2 px-3.5 active:scale-[0.98]"
              >
                <span>Guided Practice</span>
              </button>
            </div>
          </div>

          <div className="claude-card-cream p-5 rounded-2xl border border-[#e6dfd8] flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code text-[#8e8b82]">
                <span className="text-[#e8a55a] font-semibold">Humanities Track</span>
                <span>75m • 50 marks</span>
              </div>
              <h4 className="font-serif-display text-lg text-[#141413] font-normal">
                Economics Higher Level (HL)
              </h4>
              <p className="text-xs text-[#6c6a64]">
                Paper 1 • Extended response essay with an interactive diagram sketchpad.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#e6dfd8]">
              <button
                type="button"
                onClick={() => handleLaunchSpecimen(BUNDLED_ECONOMICS_HL, 'mock')}
                className="claude-btn-primary text-xs py-2 px-3.5 active:scale-[0.98]"
              >
                <span>Timed Exam</span>
              </button>
              <button
                type="button"
                onClick={() => handleLaunchSpecimen(BUNDLED_ECONOMICS_HL, 'learn')}
                className="claude-btn-secondary text-xs py-2 px-3.5 active:scale-[0.98]"
              >
                <span>Guided Practice</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. PAST SESSIONS TABLE                                        */}
      {/* ============================================================ */}
      {pastSessions.length > 0 && (
        <section id="history-section" className="py-12 px-4 sm:px-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#6c6a64]" />
              <h3 className="font-serif-display text-xl font-normal text-[#141413]">
                Past Exam Attempts ({pastSessions.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={async () => {
                await clearAllExamSessions();
                setPastSessions([]);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono-code text-[#6c6a64] hover:text-[#c64545] hover:bg-[#c64545]/10 transition active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="divide-y divide-[#e6dfd8] rounded-2xl bg-[#efe9de] border border-[#e6dfd8] overflow-hidden shadow-xs">
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
                        className="p-1.5 rounded text-[#8e8b82] hover:text-[#c64545] transition active:scale-[0.95]"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={res ? `/results/${sess.id}` : `/mock/${sess.paperId}`}
                        className="p-1 rounded text-[#141413] hover:text-[#cc785c] transition active:scale-[0.95]"
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
        <div className="claude-card-coral p-8 sm:p-12 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="display-md font-serif-display font-normal text-white">
              Prepare for your IB exams with confidence.
            </h2>
            <p className="text-sm text-white/90 max-w-lg leading-relaxed">
              Practise with official markscheme standards, receive full credit for your working steps, and get step-by-step guidance whenever you need it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleLaunchSpecimen(MAY_2021_MATH_AA_HL_P1, 'mock')}
              className="claude-btn-secondary px-6 py-3 text-sm font-semibold active:scale-[0.98]"
            >
              <span>Start Practice Exam</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
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
              • Interactive Past Paper Practice
            </span>
          </div>

          <p className="text-xs text-[#a09d96] font-mono-code text-center sm:text-right">
            Built for International Baccalaureate Diploma students.
          </p>
        </div>
      </footer>
    </div>
  );
}
