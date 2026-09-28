import Link from 'next/link';

export const STORAGE_ERROR_MESSAGE =
  'Criterion keeps your papers, scripts and reports in this browser, and it could not read them. This usually happens in a private window or when site data is blocked. Reload the page, or open Criterion in a normal window.';

/** Shown in place of a page whose saved work could not be read from this browser (IndexedDB). */
export function StorageErrorNotice() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div role="alert" className="script-sheet paper-surface max-w-[560px] w-full px-8 py-10 space-y-4">
        <h1 className="font-serif text-[28px] font-semibold text-ink">Your saved work couldn&rsquo;t be opened</h1>
        <p className="text-[16px] leading-relaxed text-ink-muted">{STORAGE_ERROR_MESSAGE}</p>
        <Link href="/" className="btn btn-ink">
          Back to your papers
        </Link>
      </div>
    </div>
  );
}
