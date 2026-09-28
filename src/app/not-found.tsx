import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="script-sheet paper-surface max-w-[560px] w-full px-8 py-10 space-y-4">
        <h1 className="font-serif text-[28px] font-semibold text-ink">Page not found</h1>
        <p className="text-[16px] leading-relaxed text-ink-muted">
          There is no page at this address. The link may be mistyped, or the page may have moved.
        </p>
        <Link href="/" className="btn btn-ink">
          Back to your papers
        </Link>
      </div>
    </div>
  );
}
