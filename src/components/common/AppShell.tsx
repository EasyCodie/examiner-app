'use client';

import React, { useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';

interface AppShellContextType {
  setHeaderInfo: (info: {
    paperTitle?: string;
    category?: 'STEM' | 'HUMANITIES';
    mode?: 'TIMED_MOCK' | 'SOCRATIC_LEARN';
    paperId?: string;
    timeRemainingSeconds?: number;
  }) => void;
}

const AppShellContext = createContext<AppShellContextType | null>(null);

export const useAppShell = () => {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error('useAppShell must be used within an AppShell');
  }
  return ctx;
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const [headerInfo, setHeaderInfo] = useState<{
    paperTitle?: string;
    category?: 'STEM' | 'HUMANITIES';
    mode?: 'TIMED_MOCK' | 'SOCRATIC_LEARN';
    paperId?: string;
    timeRemainingSeconds?: number;
  }>({});

  return (
    <AppShellContext.Provider value={{ setHeaderInfo }}>
      <div className="min-h-screen flex flex-col bg-[var(--cursor-canvas)] text-[var(--cursor-text-strong)]">
        {!isHomePage && (
          <Header
            paperTitle={headerInfo.paperTitle}
            category={headerInfo.category}
            mode={headerInfo.mode}
            paperId={headerInfo.paperId}
            timeRemainingSeconds={headerInfo.timeRemainingSeconds}
          />
        )}
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </AppShellContext.Provider>
  );
};
