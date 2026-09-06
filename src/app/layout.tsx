import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/common/AppShell';

export const metadata: Metadata = {
  title: 'Criterion • Senior Examiner Assessment & Socratic Tutoring',
  description:
    'Authentic IB examination revision, timed mock exams with handwritten working overlays, and Socratic tutoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#181715] text-[#faf9f5] selection:bg-[#cc785c]/30 selection:text-[#faf9f5]">
        <AppShell>{children}</AppShell>
      {/* impeccable-live-start */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="http://localhost:8400/live.js?token=f5d0a83e-f5bc-4fd8-845b-03284e8d3bf1"></script>
      {/* impeccable-live-end */}
</body>
    </html>
  );
}
