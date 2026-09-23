'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExamManifest, ExamSession, InProgressExamSession } from '@/types/exam';
import {
  getAllManifests,
  getAllExamSessions,
  getInProgressSession,
  deleteExamSession,
  clearAllExamSessions,
} from '@/lib/storage';
import { useAppShell } from '@/components/common/AppShell';
import { MathRenderer } from '@/components/common/MathRenderer';
import { ReportDialog } from '@/components/common/ReportDialog';
import { CriterionMark } from '@/components/common/CriterionMark';
import { formatClock } from '@/components/exam/ExamPageHead';
import { MarkCodeKey } from '@/components/assessment/MarkCodeKey';

/** Sample marking for the first viewport: one slip, carried forward. */
const SAMPLE_LINES: { working: string; code: string; outcome: 'tick' | 'cross'; note: string }[] = [
  { working: '$u = 2x^2 + 1,\\quad du = 4x\\,dx$', code: 'M1', outcome: 'tick', note: 'substitution' },
  { working: '$= \\tfrac14\\int_1^{8} \\sqrt{u}\\,du$', code: 'A1', outcome: 'cross', note: 'upper limit is 9' },
  { working: '$= \\tfrac14 \\cdot \\tfrac23 \\left[u^{3/2}\\right]_1^{8}$', code: 'M1', outcome: 'tick', note: 'integrates' },
  { working: '$= \\tfrac16\\left(16\\sqrt2 - 1\\right)$', code: 'A1FT', outcome: 'tick', note: 'from their 8' },
];

const Tick: React.FC<{ outcome: 'tick' | 'cross' }> = ({ outcome }) => (
  <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 shrink-0" aria-label={outcome === 'tick' ? 'awarded' : 'not awarded'}>
    <path
      d={outcome === 'tick' ? 'M1.5 6.5l3 3 6-7' : 'M2 2l8 8M10 2l-8 8'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

export default function HomePage() {
  const { setHeaderInfo } = useAppShell();

  const [papers, setPapers] = useState<ExamManifest[]>([]);
  const [pastSessions, setPastSessions] = useState<ExamSession[]>([]);
  const [unfinished, setUnfinished] = useState<{ manifest: ExamManifest; session: InProgressExamSession }[]>([]);
  const [pendingDelete, setPendingDelete] = useState<ExamSession | 'all' | null>(null);

  useEffect(() => {
    setHeaderInfo({});
    getAllExamSessions().then(setPastSessions);
    getAllManifests().then(async (all) => {
      setPapers(all);
      const found = await Promise.all(
        all.map(async (manifest) => {
          const session = await getInProgressSession(manifest.id);
          return session ? { manifest, session } : null;
        })
      );
      setUnfinished(found.filter((x): x is { manifest: ExamManifest; session: InProgressExamSession } => x !== null));
    });
  }, [setHeaderInfo]);

  const confirmDelete = async () => {
    if (pendingDelete === 'all') {
      await clearAllExamSessions();
      setPastSessions([]);
    } else if (pendingDelete) {
      await deleteExamSession(pendingDelete.id);
      setPastSessions((prev) => prev.filter((s) => s.id !== pendingDelete.id));
    }
    setPendingDelete(null);
  };

  const hasSessions = pastSessions.length > 0 || unfinished.length > 0;
  const firstPaper = papers[0];

  return (
    <div className="flex-1 w-full shell-surface">
      {/* 1. The mechanism, demonstrated */}
      <section className="max-w-[1280px] mx-auto px-6 pt-14 pb-20 lg:pt-20 lg:pb-24 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] items-center">
        <div className="space-y-7">
          <h1 className="font-serif text-[44px] sm:text-[60px] leading-[1.02] font-semibold text-shell-ink text-balance tracking-[-0.01em]">
            Every mark, given the way an examiner gives it.
          </h1>
          <p className="text-[18px] sm:text-[19px] leading-relaxed text-shell-muted max-w-[52ch]">
            Sit IB-style papers against the clock. Your working is marked line by line against the markscheme: method
            marks, accuracy marks, and error carried forward, so one slip costs you once.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            {firstPaper ? (
              <Link href={`/mock/${firstPaper.id}`} className="btn btn-slip">
                Sit a timed paper
              </Link>
            ) : (
              <Link href="#papers" className="btn btn-slip">
                Sit a timed paper
              </Link>
            )}
            <Link href="/ingest" className="btn btn-quiet-shell">
              Add your own paper
            </Link>
          </div>
        </div>

        <figure className="space-y-3">
          <div className="script-sheet paper-surface px-6 sm:px-9 py-7 sm:py-8">
            <div className="flex items-baseline justify-between border-b border-ink pb-2.5">
              <p className="font-serif text-[18px] font-semibold text-ink tabular">1.</p>
              <p className="font-serif text-[14px] font-semibold text-ink">[Maximum mark: 6]</p>
            </div>
            <div className="mt-3 font-serif text-[16px] leading-relaxed text-ink">
              <MathRenderer content={'Find the exact value of $\\displaystyle\\int_0^2 x\\sqrt{2x^2+1}\\,dx$.'} lightMode={true} />
            </div>

            <ol className="mt-5 border-t border-paper-rule">
              {SAMPLE_LINES.map((line, i) => (
                <li key={i} className="grid grid-cols-[minmax(0,1fr)_9.5rem] border-b border-paper-rule">
                  <div className="py-2.5 pr-4 text-student text-[16px] overflow-x-auto">
                    <MathRenderer content={line.working} lightMode={true} />
                  </div>
                  <div
                    className="animate-ink-in border-l border-examiner/40 pl-3 py-2.5 flex items-center gap-2 text-examiner"
                    style={{ animationDelay: `${400 + i * 260}ms` }}
                  >
                    <span className="tabular font-sans text-[14px] font-bold">{line.code}</span>
                    <Tick outcome={line.outcome} />
                    <span className="font-serif italic text-[13px] leading-tight">{line.note}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p
              className="animate-ink-in mt-3 text-right font-sans text-[15px] font-bold text-examiner tabular"
              style={{ animationDelay: `${400 + SAMPLE_LINES.length * 260}ms` }}
            >
              3 / 4
            </p>
          </div>
          <figcaption className="text-[14px] leading-relaxed text-shell-muted max-w-[60ch]">
            Sample marking. The wrong limit costs one accuracy mark; the method after it still scores, because the error is
            carried forward.
          </figcaption>
        </figure>
      </section>

      {/* 2. Returning students: sessions first */}
      {hasSessions && (
        <section id="sessions" aria-labelledby="sessions-heading" className="max-w-[1280px] mx-auto px-6 py-16 border-t border-shell-line scroll-mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="sessions-heading" className="font-serif text-[32px] font-semibold text-shell-ink">
              Your sessions
            </h2>
            {pastSessions.length > 0 && (
              <button type="button" onClick={() => setPendingDelete('all')} className="btn btn-sm btn-quiet-shell">
                Clear history
              </button>
            )}
          </div>

          <table className="mt-6 w-full border-collapse">
            <thead>
              <tr className="border-t-2 border-b border-shell-ink text-left text-[13px] text-shell-muted">
                <th scope="col" className="py-2 pr-4 font-semibold">Paper</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Date</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Result</th>
                <th scope="col" className="py-2 font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {unfinished.map(({ manifest, session }) => (
                <tr key={`unfinished-${manifest.id}`} className="border-b border-shell-line align-middle">
                  <th scope="row" className="py-3 pr-4 text-left">
                    <span className="block text-[15px] font-semibold text-shell-ink">{manifest.title}</span>
                    <span className="block text-[13px] text-shell-muted">{manifest.subtitle}</span>
                  </th>
                  <td className="py-3 pr-4 tabular text-[14px] text-shell-muted whitespace-nowrap">
                    {new Date(session.savedAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 pr-4 tabular text-[14px] text-shell-ink whitespace-nowrap">
                    Unfinished, {formatClock(session.timeRemainingSeconds)} left
                  </td>
                  <td className="py-2 text-right">
                    <Link href={`/mock/${manifest.id}`} className="btn btn-sm btn-slip">
                      Resume
                    </Link>
                  </td>
                </tr>
              ))}
              {pastSessions.map((sess) => {
                const res = sess.gradingResults;
                return (
                  <tr key={sess.id} className="border-b border-shell-line align-middle">
                    <th scope="row" className="py-3 pr-4 text-left">
                      <span className="block text-[15px] font-semibold text-shell-ink">{sess.paperTitle}</span>
                    </th>
                    <td className="py-3 pr-4 tabular text-[14px] text-shell-muted whitespace-nowrap">
                      {new Date(sess.submittedAt || sess.startedAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3 pr-4 tabular text-[14px] whitespace-nowrap">
                      {res ? (
                        <span className="text-shell-ink">
                          <span className="font-semibold">Grade {res.predictedGrade}</span>
                          <span className="text-shell-muted"> · {res.totalMarksAwarded}/{res.totalPossibleMarks}</span>
                        </span>
                      ) : (
                        <span className="text-shell-muted">Not yet marked</span>
                      )}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <Link href={`/results/${sess.id}`} className="btn btn-sm btn-quiet-shell">
                        {res ? 'Open report' : 'Mark it'}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(sess)}
                        className="ml-2 min-h-9 px-2 text-[14px] text-shell-muted hover:text-shell-ink underline underline-offset-4 decoration-shell-line"
                      >
                        Delete
                        <span className="sr-only"> session for {sess.paperTitle}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* 3. The papers */}
      <section id="papers" aria-labelledby="papers-heading" className="max-w-[1280px] mx-auto px-6 py-16 border-t border-shell-line scroll-mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="papers-heading" className="font-serif text-[32px] font-semibold text-shell-ink">
            Papers
          </h2>
          <Link href="/ingest" className="text-[15px] font-medium text-shell-ink underline underline-offset-4 decoration-shell-line hover:decoration-shell-ink">
            Add a paper and its markscheme
          </Link>
        </div>

        <table className="mt-6 w-full border-collapse">
          <thead>
            <tr className="border-t-2 border-b border-shell-ink text-left text-[13px] text-shell-muted">
              <th scope="col" className="py-2 pr-4 font-semibold">Paper</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-right">Time</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-right">Marks</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-right">Questions</th>
              <th scope="col" className="py-2 font-semibold"><span className="sr-only">Start</span></th>
            </tr>
          </thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p.id} className="border-b border-shell-line align-middle">
                <th scope="row" className="py-4 pr-4 text-left">
                  <span className="block font-serif text-[18px] font-semibold text-shell-ink">{p.title}</span>
                  <span className="block text-[14px] text-shell-muted">{p.subtitle}</span>
                </th>
                <td className="py-4 pr-4 text-right tabular text-[15px] text-shell-ink whitespace-nowrap">{p.durationMinutes} min</td>
                <td className="py-4 pr-4 text-right tabular text-[15px] text-shell-ink">{p.totalMarks}</td>
                <td className="py-4 pr-4 text-right tabular text-[15px] text-shell-ink">{p.questions.length}</td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Link href={`/mock/${p.id}`} className="btn btn-sm btn-slip">
                    Timed exam
                    <span className="sr-only">: {p.title}, {p.subtitle}</span>
                  </Link>
                  <Link href={`/learn/${p.id}`} className="ml-2 btn btn-sm btn-quiet-shell">
                    Guided practice
                    <span className="sr-only">: {p.title}, {p.subtitle}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 4. The key to the marks */}
      <section aria-labelledby="key-heading" className="max-w-[1280px] mx-auto px-6 py-16 border-t border-shell-line grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          <h2 id="key-heading" className="font-serif text-[32px] font-semibold text-shell-ink">
            How your script is marked
          </h2>
          <p className="text-[16px] leading-relaxed text-shell-muted max-w-[42ch]">
            Every question is marked against its markscheme with the same codes an IB examiner writes in the margin.
          </p>
        </div>
        <MarkCodeKey variant="full" />
      </section>

      <footer className="border-t border-shell-line">
        <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-[14px] text-shell-muted">
          <span className="flex items-center gap-2 text-shell-ink">
            <CriterionMark className="w-4 h-4" />
            Criterion
          </span>
          <span>IB-style practice papers and marking. Not affiliated with or endorsed by the International Baccalaureate.</span>
        </div>
      </footer>

      <ReportDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={pendingDelete === 'all' ? 'Clear all session history?' : 'Delete this session?'}
      >
        <p className="text-[16px] leading-relaxed text-ink">
          {pendingDelete === 'all'
            ? `This deletes ${pastSessions.length} ${pastSessions.length === 1 ? 'session' : 'sessions'} and their reports from this device. It cannot be undone.`
            : 'This deletes the session and its report from this device. It cannot be undone.'}
        </p>
        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <button type="button" onClick={() => setPendingDelete(null)} className="btn btn-quiet-paper" autoFocus>
            Keep
          </button>
          <button type="button" onClick={confirmDelete} className="btn btn-destructive">
            {pendingDelete === 'all' ? 'Clear history' : 'Delete session'}
          </button>
        </div>
      </ReportDialog>
    </div>
  );
}
