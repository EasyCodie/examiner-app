'use client';

import React, { useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { AiStudioDrawer } from '@/components/workbench/AiStudioDrawer';

interface AppShellContextType {
  setHeaderInfo: (info: {
    paperTitle?: string;
    category?: 'STEM' | 'HUMANITIES';
    mode?: 'TIMED_MOCK' | 'SOCRATIC_LEARN';
    paperId?: string;
    timeRemainingSeconds?: number;
  }) => void;
  openAiStudio: () => void;
  closeAiStudio: () => void;
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
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);

  const [headerInfo, setHeaderInfo] = useState<{
    paperTitle?: string;
    category?: 'STEM' | 'HUMANITIES';
    mode?: 'TIMED_MOCK' | 'SOCRATIC_LEARN';
    paperId?: string;
    timeRemainingSeconds?: number;
  }>({});

  return (
    <AppShellContext.Provider
      value={{
        setHeaderInfo,
        openAiStudio: () => setIsAiStudioOpen(true),
        closeAiStudio: () => setIsAiStudioOpen(false),
      }}
    >
      <div className="min-h-screen flex flex-col bg-[#faf9f5] text-[#141413]">
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

        {/* Global Workbench / Telemetry Drawer */}
        <AiStudioDrawer isOpen={isAiStudioOpen} onClose={() => setIsAiStudioOpen(false)} />
      </div>
    </AppShellContext.Provider>
  );
};
