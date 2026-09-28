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
  getAiConfig,
} from '@/lib/storage';
import { useAppShell } from '@/components/common/AppShell';
import { MathRenderer } from '@/components/common/MathRenderer';
import { ReportDialog } from '@/components/common/ReportDialog';
import { CriterionMark } from '@/components/common/CriterionMark';
import { formatClock } from '@/components/exam/ExamPageHead';
import { MarkCodeKey } from '@/components/assessment/MarkCodeKey';
import { STORAGE_ERROR_MESSAGE } from '@/components/common/StorageErrorNotice';
import { CountUp, motionDelay, prefersReducedMotion, useRevealOnView } from '@/components/common/motion';

/** Sample marking for the first viewport: one slip, carried forward. */
const SAMPLE_LINES: { working: string; code: string; outcome: 'tick' | 'cross'; note: string }[] = [
  { working: '$u = 2x^2 + 1,\\quad du = 4x\\,dx$', code: 'M1', outcome: 'tick', note: 'substitution' },
  { working: '$= \\tfrac14\\int_1^{8} \\sqrt{u}\\,du$', code: 'A1', outcome: 'cross', note: 'upper limit is 9' },
  { working: '$= \\tfrac14 \\cdot \\tfrac23 \\left[u^{3/2}\\right]_1^{8}$', code: 'M1', outcome: 'tick', note: 'integrates' },
  { working: '$= \\tfrac16\\left(16\\sqrt2 - 1\\right)$', code: 'A1FT', outcome: 'tick', note: 'from their 8' },
];

const Tick: React.FC<{ outcome: 'tick' | 'cross'; delay: number }> = ({ outcome, delay }) => (
  <svg
    viewBox="0 0 12 12"
    className="draw-stroke w-3.5 h-3.5 shrink-0"
    style={motionDelay(delay)}
    aria-label={outcome === 'tick' ? 'awarded' : 'not awarded'}
  >
    {outcome === 'tick' ? (
      <path d="M1.5 6.5l3 3 6-7" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.8" />
    ) : (
      <>
        <path d="M2 2l8 8" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 2l-8 8" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.8" style={motionDelay(delay + 140)} />
      </>
    )}
  </svg>
);

/**
 * The sample marking plays as one sitting: the candidate writes, the examiner
 * rules the margin, marks each line, underlines the slip, carries it forward, and totals.
 */
const SAMPLE_TIMING = {
  questionRule: 260,
  working: (i: number) => 460 + i * 200,
  margin: 1260,
  mark: [1460, 1760, 2060, 2840],
  slipUnderline: 1920,
  carry: [2200, 2360, 2580],
  total: 3160,
};

export default function HomePage() {
  const { setHeaderInfo, openAiStudio, onAiKeySaved } = useAppShell();

  const [papers, setPapers] = useState<ExamManifest[]>([]);
  const [pastSessions, setPastSessions] = useState<ExamSession[]>([]);
  const [unfinished, setUnfinished] = useState<{ manifest: ExamManifest; session: InProgressExamSession }[]>([]);
  const [pendingDelete, setPendingDelete] = useState<ExamSession | 'all' | null>(null);
  // Sessions being crossed out before they leave the table
  const [striking, setStriking] = useState<string[]>([]);
  // Bumped to play the sample marking again
  const [sampleRun, setSampleRun] = useState(0);
  const revealOnView = useRevealOnView<HTMLTableElement>();
  const [storageError, setStorageError] = useState(false);
  // Unknown until the saved config is read, so the key callout never flashes for someone who has a key
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    getAiConfig()
      .then((cfg) => setHasKey(Boolean(cfg.apiKey)))
      .catch(() => setHasKey(null));
    return onAiKeySaved(() => setHasKey(true));
  }, [onAiKeySaved]);

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
    }).catch(() => setStorageError(true));
  }, [setHeaderInfo]);

  const confirmDelete = async () => {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);
    const ids = target === 'all' ? pastSessions.map((s) => s.id) : [target.id];
    // The strike runs the full width of each row
    ids.forEach((id) => {
      const row = document.querySelector<HTMLTableRowElement>(`tr[data-session-row="${id}"]`);
      row?.style.setProperty('--row-w', `${row.offsetWidth}px`);
    });
    setStriking(ids);
    const struckThrough = new Promise((resolve) =>
      setTimeout(resolve, prefersReducedMotion() ? 0 : 520 + Math.min(ids.length - 1, 10) * 60)
    );
    await Promise.all([target === 'all' ? clearAllExamSessions() : deleteExamSession(target.id), struckThrough]);
    setPastSessions((prev) => prev.filter((s) => !ids.includes(s.id)));
    setStriking([]);
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
            <div className="relative flex items-baseline justify-between pb-2.5">
              <p className="font-serif text-[18px] font-semibold text-ink tabular">1.</p>
              <p className="font-serif text-[14px] font-semibold text-ink">[Maximum mark: 6]</p>
              <span
                aria-hidden="true"
                className="animate-rule-draw absolute inset-x-0 bottom-0 h-px bg-ink"
                style={motionDelay(SAMPLE_TIMING.questionRule)}
              />
            </div>
            <div className="mt-3 font-serif text-[16px] leading-relaxed text-ink">
              <MathRenderer content={'Find the exact value of $\\displaystyle\\int_0^2 x\\sqrt{2x^2+1}\\,dx$.'} lightMode={true} />
            </div>

            <ol key={sampleRun} className="relative mt-5 border-t border-paper-rule">
              {/* The examiner rules the margin before marking */}
              <span
                aria-hidden="true"
                className="animate-rule-draw-y absolute top-0 bottom-0 right-[9.5rem] w-px bg-examiner/40"
                style={motionDelay(SAMPLE_TIMING.margin)}
              />
              {SAMPLE_LINES.map((line, i) => {
                const markAt = SAMPLE_TIMING.mark[i];
                const isSlip = i === 1;
                return (
                  <li key={i} className="grid grid-cols-[minmax(0,1fr)_9.5rem] border-b border-paper-rule">
                    <div
                      className="animate-ink-in py-2.5 pr-4 text-student text-[16px] overflow-x-auto"
                      style={motionDelay(SAMPLE_TIMING.working(i))}
                    >
                      <span className="relative inline-block">
                        <MathRenderer content={line.working} lightMode={true} />
                        {isSlip && (
                          // The examiner underlines the slip
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 100 6"
                            preserveAspectRatio="none"
                            className="draw-stroke absolute left-0 -bottom-1.5 w-full h-1.5 text-examiner overflow-visible"
                            style={motionDelay(SAMPLE_TIMING.slipUnderline)}
                          >
                            <path
                              d="M0 3 Q 6.25 0 12.5 3 T 25 3 T 37.5 3 T 50 3 T 62.5 3 T 75 3 T 87.5 3 T 100 3"
                              pathLength={1}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                        )}
                      </span>
                    </div>
                    <div className="relative pl-3 py-2.5 text-examiner">
                      {/* Error carried forward: the slip in line 2 is followed down to the mark it earns in line 4 */}
                      {i === 1 && (
                        <span
                          aria-hidden="true"
                          className="animate-rule-draw-y absolute left-[3px] top-1/2 -bottom-px w-[1.5px] bg-ecf [animation-duration:170ms] [animation-timing-function:linear]"
                          style={motionDelay(SAMPLE_TIMING.carry[0])}
                        />
                      )}
                      {i === 2 && (
                        <span
                          aria-hidden="true"
                          className="animate-rule-draw-y absolute left-[3px] top-0 -bottom-px w-[1.5px] bg-ecf [animation-duration:230ms] [animation-timing-function:linear]"
                          style={motionDelay(SAMPLE_TIMING.carry[1])}
                        />
                      )}
                      {i === 3 && (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 10 20"
                          className="draw-stroke absolute left-[2.75px] top-0 w-2.5 h-1/2 text-ecf overflow-visible"
                          preserveAspectRatio="none"
                          style={motionDelay(SAMPLE_TIMING.carry[2])}
                        >
                          <path d="M1 0 V20 H9 M6 17 L9 20 L6 23" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        </svg>
                      )}
                      <div className="animate-ink-in flex items-center gap-2" style={motionDelay(markAt)}>
                        <span className="tabular font-sans text-[14px] font-bold">{line.code}</span>
                        <Tick outcome={line.outcome} delay={markAt + 140} />
                        <span className={`font-serif italic text-[13px] leading-tight ${i === 3 ? 'text-ecf' : ''}`}>
                          {line.note}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p
              key={`total-${sampleRun}`}
              className="animate-ink-in mt-3 text-right font-sans text-[15px] font-bold text-examiner tabular"
              style={motionDelay(SAMPLE_TIMING.total)}
            >
              <CountUp value={3} delay={SAMPLE_TIMING.total + 120} duration={420} /> / 4
            </p>
          </div>
          <figcaption className="text-[14px] leading-relaxed text-shell-muted max-w-[60ch]">
            Sample marking. The wrong limit costs one accuracy mark; the method after it still scores, because the error is
            carried forward.{' '}
            <button
              type="button"
              onClick={() => setSampleRun((n) => n + 1)}
              className="min-h-9 text-shell-ink underline underline-offset-4 decoration-shell-line hover:decoration-shell-ink transition-colors"
            >
              Mark it again
            </button>
          </figcaption>
        </figure>
      </section>

      {/* First visit: nothing is marked without the student's own key */}
      {hasKey === false && (
        <section aria-labelledby="gemini-key-heading" className="max-w-[1280px] mx-auto px-6 py-16 border-t border-shell-line grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="space-y-3">
            <h2 id="gemini-key-heading" className="font-serif text-[32px] font-semibold text-shell-ink">
              Add your free Gemini key
            </h2>
            <p className="text-[16px] leading-relaxed text-shell-muted max-w-[42ch]">
              You can sit a paper without one, but the examiner and the tutor use Google&rsquo;s Gemini with your own key.
              It takes about a minute.
            </p>
          </div>
          <div className="space-y-6">
            <ol className="border-t-2 border-shell-ink">
              {[
                <>
                  Open{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-shell-muted"
                  >
                    Google AI Studio
                  </a>{' '}
                  and sign in with a Google account.
                </>,
                <>Choose Create API key, then copy the key.</>,
                <>Paste it into Settings and choose Test and save. It stays in this browser.</>,
              ].map((step, i) => (
                <li key={i} className="flex items-baseline gap-5 py-3.5 border-b border-shell-line">
                  <span className="font-serif text-[20px] font-semibold text-shell-ink tabular w-5 shrink-0">{i + 1}</span>
                  <span className="text-[16px] leading-relaxed text-shell-ink">{step}</span>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => openAiStudio('apiKey')} className="btn btn-slip">
              Add your key
            </button>
          </div>
        </section>
      )}

      {/* 2. Returning students: sessions first */}
      {storageError && (
        <section role="alert" aria-labelledby="storage-heading" className="max-w-[1280px] mx-auto px-6 py-16 border-t border-shell-line">
          <h2 id="storage-heading" className="font-serif text-[32px] font-semibold text-shell-ink">
            Your saved work couldn&rsquo;t be opened
          </h2>
          <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-shell-muted">{STORAGE_ERROR_MESSAGE}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 btn btn-quiet-shell">
            Reload
          </button>
        </section>
      )}

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

          <table ref={revealOnView} className="mt-6 w-full border-collapse">
            <thead>
              <tr className="border-t-2 border-b border-shell-ink text-left text-[13px] text-shell-muted">
                <th scope="col" className="py-2 pr-4 font-semibold">Paper</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Date</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Result</th>
                <th scope="col" className="py-2 font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {unfinished.map(({ manifest, session }, i) => (
                <tr
                  key={`unfinished-${manifest.id}`}
                  className="reveal-item border-b border-shell-line align-middle"
                  style={{ '--i': i } as React.CSSProperties}
                >
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
              {pastSessions.map((sess, i) => {
                const res = sess.gradingResults;
                const strikeIndex = striking.indexOf(sess.id);
                return (
                  <tr
                    key={sess.id}
                    data-session-row={sess.id}
                    className="reveal-item border-b border-shell-line align-middle"
                    style={{ '--i': unfinished.length + i } as React.CSSProperties}
                  >
                    <th scope="row" className="relative py-3 pr-4 text-left">
                      <span className="block text-[15px] font-semibold text-shell-ink">{sess.paperTitle}</span>
                      {strikeIndex >= 0 && (
                        <span aria-hidden="true" className="strike-rule" style={motionDelay(Math.min(strikeIndex, 10) * 60)} />
                      )}
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

        <table ref={revealOnView} className="mt-6 w-full border-collapse">
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
            {papers.map((p, i) => (
              <tr key={p.id} className="reveal-item border-b border-shell-line align-middle" style={{ '--i': i } as React.CSSProperties}>
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
