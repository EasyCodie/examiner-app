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
      <body className="min-h-full flex flex-col bg-shell text-shell-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
