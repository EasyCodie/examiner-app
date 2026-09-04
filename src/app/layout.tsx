import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/common/AppShell';

export const metadata: Metadata = {
  title: 'IB Examiner',
  description:
    'Authentic IB examination revision, timed mock exams with handwritten working overlays, and Socratic tutoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0c0d0e] text-[#f3f3f2]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
