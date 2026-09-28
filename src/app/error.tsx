'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div role="alert" className="script-sheet paper-surface max-w-[560px] w-full px-8 py-10 space-y-4">
        <h1 className="font-serif text-[28px] font-semibold text-ink">Something went wrong</h1>
        <p className="text-[16px] leading-relaxed text-ink-muted">
          This page ran into an error. Work already saved in this browser is kept.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => retry()} className="btn btn-ink">
            Try again
          </button>
          <Link href="/" className="btn btn-quiet-paper">
            Back to your papers
          </Link>
        </div>
      </div>
    </div>
  );
}
