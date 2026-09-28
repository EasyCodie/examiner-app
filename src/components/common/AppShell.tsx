'use client';

import React, { useState, useEffect, createContext, useContext, useMemo, useRef, useCallback } from 'react';
import { Header } from './Header';
import { AiStudioDrawer, AiStudioTab } from '@/components/workbench/AiStudioDrawer';
import { FormulaBookletDrawer } from '@/components/formula/FormulaBookletDrawer';
import { getFormulaBooklet } from '@/lib/data/formulaBooklets';

interface HeaderInfo {
  paperTitle?: string;
  category?: 'STEM' | 'HUMANITIES';
  mode?: 'TIMED_MOCK' | 'SOCRATIC_LEARN';
  paperId?: string;
  timeRemainingSeconds?: number;
  subjectCode?: string;
  /** An Exam Session owns the top of the screen: the global header steps aside. */
  examMode?: boolean;
}

interface AppShellContextType {
  setHeaderInfo: (info: HeaderInfo) => void;
  openAiStudio: (tab?: AiStudioTab) => void;
  closeAiStudio: () => void;
  openFormulaBooklet: (anchor?: string) => void;
  closeFormulaBooklet: () => void;
  toggleFormulaBooklet: (anchor?: string) => void;
  isFormulaBookletOpen: boolean;
  hasFormulaBooklet: boolean;
  /** Calls the listener each time a Gemini key is saved in Settings, so pages waiting on a key can carry on. Returns an unsubscribe. */
  onAiKeySaved: (listener: () => void) => () => void;
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
  const [aiStudio, setAiStudio] = useState<{ tab: AiStudioTab; opens: number }>({ tab: 'reasoning', opens: 0 });
  const keySavedListeners = useRef(new Set<() => void>());
  const onAiKeySaved = useCallback((listener: () => void) => {
    keySavedListeners.current.add(listener);
    return () => {
      keySavedListeners.current.delete(listener);
    };
  }, []);
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
        openAiStudio: (tab: AiStudioTab = 'reasoning') => {
          setAiStudio((prev) => ({ tab, opens: prev.opens + 1 }));
          setIsAiStudioOpen(true);
        },
        closeAiStudio: () => setIsAiStudioOpen(false),
        openFormulaBooklet,
        closeFormulaBooklet,
        toggleFormulaBooklet,
        isFormulaBookletOpen,
        hasFormulaBooklet,
        onAiKeySaved,
      }}
    >
      <div className="min-h-[100dvh] flex flex-col bg-shell text-shell-ink">
        {!headerInfo.examMode && (
          <Header
            paperTitle={headerInfo.paperTitle}
            category={headerInfo.category}
            mode={headerInfo.mode}
            paperId={headerInfo.paperId}
            timeRemainingSeconds={headerInfo.timeRemainingSeconds}
          />
        )}
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

        {/* Settings drawer */}
        <AiStudioDrawer
          key={aiStudio.opens}
          initialTab={aiStudio.tab}
          isOpen={isAiStudioOpen}
          onClose={() => setIsAiStudioOpen(false)}
          onKeySaved={() => keySavedListeners.current.forEach((listener) => listener())}
        />
      </div>
    </AppShellContext.Provider>
  );
};

