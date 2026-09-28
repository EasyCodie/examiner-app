// Client-safe: the ingest page checks a PDF pair before uploading, and /api/ingest checks it again.

/** Vercel refuses request bodies over 4.5 MB; this leaves room for the multipart envelope. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const toMb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

/** Returns a message for the student when the pair is too large to upload, or null when it fits. */
export function checkUploadPair(paper: { size: number }, markscheme: { size: number }): string | null {
  const total = paper.size + markscheme.size;
  if (total <= MAX_UPLOAD_BYTES) return null;
  return `These PDFs are ${toMb(total)} MB together, over the ${toMb(MAX_UPLOAD_BYTES)} MB limit. Upload smaller copies, for example by compressing the PDFs or removing pages you don't need.`;
}

/** True when the bytes start with the PDF signature "%PDF-". */
export function isPdfBytes(bytes: Uint8Array): boolean {
  const signature = [0x25, 0x50, 0x44, 0x46, 0x2d];
  return bytes.length >= signature.length && signature.every((b, i) => bytes[i] === b);
}
