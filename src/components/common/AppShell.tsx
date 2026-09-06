'use client';

import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Header } from './Header';
import { AiStudioDrawer } from '@/components/workbench/AiStudioDrawer';
import { FormulaBookletDrawer } from '@/components/formula/FormulaBookletDrawer';
import { getFormulaBooklet } from '@/lib/data/formulaBooklets';

interface HeaderInfo {
  paperTitle?: string;
  category?: 'STEM' | 'HUMANITIES';
  mode?: 'TIMED_MOCK' | 'SOCRATIC_LEARN';
  paperId?: string;
  timeRemainingSeconds?: number;
  subjectCode?: string;
}

interface AppShellContextType {
  setHeaderInfo: (info: HeaderInfo) => void;
  openAiStudio: () => void;
  closeAiStudio: () => void;
  openFormulaBooklet: (anchor?: string) => void;
  closeFormulaBooklet: () => void;
  toggleFormulaBooklet: (anchor?: string) => void;
  isFormulaBookletOpen: boolean;
  hasFormulaBooklet: boolean;
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
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [isFormulaBookletOpen, setIsFormulaBookletOpen] = useState(false);
  const [formulaBookletAnchor, setFormulaBookletAnchor] = useState<string | null>(null);

  const [headerInfo, setHeaderInfo] = useState<HeaderInfo>({});

  // Check if active subject has an official Formula Booklet
  const hasFormulaBooklet = useMemo(() => {
    return getFormulaBooklet(headerInfo.subjectCode, headerInfo.paperTitle) !== null;
  }, [headerInfo.subjectCode, headerInfo.paperTitle]);

  const openFormulaBooklet = (anchor?: string) => {
    if (anchor) setFormulaBookletAnchor(anchor);
    setIsFormulaBookletOpen(true);
  };

  const closeFormulaBooklet = () => {
    setIsFormulaBookletOpen(false);
    setFormulaBookletAnchor(null);
  };

  const toggleFormulaBooklet = (anchor?: string) => {
    if (isFormulaBookletOpen) {
      closeFormulaBooklet();
    } else {
      openFormulaBooklet(anchor);
    }
  };

  // Keyboard shortcut: Ctrl+B / Cmd+B to toggle Formula Booklet
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        if (hasFormulaBooklet) {
          e.preventDefault();
          setIsFormulaBookletOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [hasFormulaBooklet]);

  return (
    <AppShellContext.Provider
      value={{
        setHeaderInfo,
        openAiStudio: () => setIsAiStudioOpen(true),
        closeAiStudio: () => setIsAiStudioOpen(false),
        openFormulaBooklet,
        closeFormulaBooklet,
        toggleFormulaBooklet,
        isFormulaBookletOpen,
        hasFormulaBooklet,
      }}
    >
      <div className="min-h-[100dvh] flex flex-col bg-[#faf9f5] text-[#141413]">
        <Header
          paperTitle={headerInfo.paperTitle}
          category={headerInfo.category}
          mode={headerInfo.mode}
          paperId={headerInfo.paperId}
          timeRemainingSeconds={headerInfo.timeRemainingSeconds}
        />
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Global Formula Booklet Drawer */}
        <FormulaBookletDrawer
          isOpen={isFormulaBookletOpen}
          onClose={closeFormulaBooklet}
          subjectCode={headerInfo.subjectCode}
          paperTitle={headerInfo.paperTitle}
          targetAnchor={formulaBookletAnchor}
          onAnchorHandled={() => setFormulaBookletAnchor(null)}
        />

        {/* Global Workbench / Telemetry Drawer */}
        <AiStudioDrawer isOpen={isAiStudioOpen} onClose={() => setIsAiStudioOpen(false)} />
      </div>
    </AppShellContext.Provider>
  );
};

