import type { Metadata } from 'next';
import { Public_Sans, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/common/AppShell';

const publicSans = Public_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-public-sans' });
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-source-serif',
});
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono' });

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
    <html
      lang="en"
      className={`${publicSans.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-shell text-shell-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
