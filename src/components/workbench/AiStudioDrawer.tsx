'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AiStudioConfig } from '@/types/exam';
import { getAiConfig, saveAiConfig } from '@/lib/storage';
import {
  X,
  Sliders,
  Key,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CriterionMark } from '@/components/common/CriterionMark';

export type AiStudioTab = 'reasoning' | 'apiKey';

interface AiStudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AiStudioTab;
  /** Called after a Gemini key is saved. */
  onKeySaved?: () => void;
}

type KeyTestResult = { tone: 'ok' | 'warn' | 'error'; message: string };

/** The outcome of a key test: a glyph and a word as well as the colour. */
const KeyTestNotice: React.FC<{ result: KeyTestResult }> = ({ result }) => {
  const look = {
    ok: { label: 'Saved', Icon: CheckCircle2, className: 'border-awarded-on-shell/40 text-awarded-on-shell' },
    warn: { label: 'Saved, not confirmed', Icon: AlertCircle, className: 'border-shell-line text-shell-ink' },
    error: { label: 'Not saved', Icon: AlertCircle, className: 'border-lost-on-shell/40 text-lost-on-shell' },
  }[result.tone];
  return (
    <div role="status" className={`p-3 border text-[14px] leading-relaxed flex items-start gap-2 ${look.className}`}>
      <look.Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">{look.label}.</span> {result.message}
      </p>
    </div>
  );
};

export const AiStudioDrawer: React.FC<AiStudioDrawerProps> = ({ isOpen, onClose, initialTab = 'reasoning', onKeySaved }) => {
  const [activeTab, setActiveTab] = useState<AiStudioTab>(initialTab);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Native modal: traps focus and handles Esc; focus returns to the opener on close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      opener?.focus?.();
    };
  }, [isOpen]);
  const [config, setConfig] = useState<AiStudioConfig | null>(null);
  const [tempApiKey, setTempApiKey] = useState('');
  const [testResult, setTestResult] = useState<KeyTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [tempZaiKey, setTempZaiKey] = useState('');
  const [testZaiResult, setTestZaiResult] = useState<KeyTestResult | null>(null);
  const [isTestingZai, setIsTestingZai] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getAiConfig().then((cfg) => {
        setConfig(cfg);
        if (cfg.apiKey) setTempApiKey(cfg.apiKey);
        else setActiveTab('apiKey'); // Nothing works without a key, so that's where Settings opens
        if (cfg.zaiApiKey) setTempZaiKey(cfg.zaiApiKey);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveBudget = async (key: 'thinkingBudgetGrading' | 'thinkingBudgetSocratic', val: number) => {
    if (!config) return;
    const updated = await saveAiConfig({ [key]: val });
    setConfig(updated);
  };

  const handleTestKey = async () => {
    const key = tempApiKey.trim();
    if (!key) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, provider: 'gemini' }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.valid) {
        await saveAiConfig({ apiKey: key });
        setTestResult({ tone: 'ok', message: 'Marking and the tutor are ready.' });
        onKeySaved?.();
      } else if (data.code === 'GEMINI_UNAVAILABLE') {
        // Gemini being busy says nothing about the key, so keep it
        await saveAiConfig({ apiKey: key });
        setTestResult({
          tone: 'warn',
          message: "Gemini is busy and couldn't confirm the key just now. If marking says the key is wrong, check it here.",
        });
        onKeySaved?.();
      } else if (data.code === 'INVALID_KEY') {
        setTestResult({ tone: 'error', message: 'Gemini rejected this key. Copy it again from Google AI Studio.' });
      } else {
        setTestResult({ tone: 'error', message: data.message || "The key couldn't be tested. Try again." });
      }
    } catch {
      setTestResult({ tone: 'error', message: "Couldn't reach Criterion to test the key. Check your connection and try again." });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestZaiKey = async () => {
    const key = tempZaiKey.trim();
    if (!key) return;
    setIsTestingZai(true);
    setTestZaiResult(null);
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, provider: 'zai' }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.valid) {
        await saveAiConfig({ zaiApiKey: key });
        setTestZaiResult({ tone: 'ok', message: 'Z.AI will read your handwriting and PDFs too.' });
      } else {
        setTestZaiResult({ tone: 'error', message: data.message || "Couldn't test this key. Try again." });
      }
    } catch {
      setTestZaiResult({ tone: 'error', message: "Couldn't reach Criterion to test the key. Check your connection and try again." });
    } finally {
      setIsTestingZai(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Settings"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="drawer shell-surface fixed m-0 ml-auto h-dvh max-h-none w-full max-w-2xl p-0 border-0 border-l border-shell-line bg-shell text-shell-ink backdrop:bg-[rgba(10,12,15,0.6)]"
    >
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 bg-shell-raised border-b border-shell-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-shell border border-shell-line flex items-center justify-center text-shell-ink">
              <CriterionMark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-serif font-semibold text-shell-ink">Settings</h2>
              <p className="text-[13px] text-shell-muted">Your API key and how deeply the examiner and tutor think</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings drawer"
            className="min-h-11 min-w-11 flex items-center justify-center text-shell-muted hover:text-shell-ink transition"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div role="tablist" aria-label="Settings sections" className="flex items-center px-4 py-2.5 bg-shell border-b border-shell-line">
          {(
            [
              { tab: 'reasoning', label: 'Marking depth', Icon: Sliders },
              { tab: 'apiKey', label: 'API key', Icon: Key },
            ] as const
          ).map(({ tab, label, Icon }) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`wipe min-h-11 flex items-center gap-1.5 px-3 text-[14px] font-medium border border-shell-line -ml-px first:ml-0 ${
                activeTab === tab ? 'text-ink' : 'text-shell-muted hover:text-shell-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div role="tabpanel" className="flex-1 p-6 overflow-y-auto space-y-6 select-text">
          {/* 1. REASONING MODULATION */}
          {activeTab === 'reasoning' && (
            <div className="space-y-6">
              <p className="text-[14px] leading-relaxed text-shell-muted">
                The thinking budget is how much the model may reason before it answers. More thinking checks multi-step
                working and follow-through marks more carefully, but takes longer.
              </p>

              {/* Grading Reasoning Slider */}
              <div className="p-4 bg-shell-raised border border-shell-line space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label htmlFor="grading-budget" className="text-[15px] font-semibold text-shell-ink block">
                      Marking depth
                    </label>
                    <p id="grading-budget-hint" className="text-[13px] text-shell-muted">
                      How thoroughly working steps and follow-through marks are checked
                    </p>
                  </div>
                  <span className="text-[14px] tabular font-semibold text-shell-ink whitespace-nowrap">
                    {Math.min(config?.thinkingBudgetGrading || 8192, 8192)} tokens
                  </span>
                </div>

                <input
                  id="grading-budget"
                  aria-describedby="grading-budget-hint"
                  type="range"
                  min={1024}
                  max={8192}
                  step={1024}
                  value={Math.min(config?.thinkingBudgetGrading || 8192, 8192)}
                  onChange={(e) => handleSaveBudget('thinkingBudgetGrading', Number(e.target.value))}
                  className="w-full accent-paper cursor-pointer"
                />

                <div className="flex justify-between text-[13px] tabular text-shell-muted">
                  <span>Quicker (1024)</span>
                  <span>Most thorough, recommended (8192)</span>
                </div>
              </div>

              {/* Socratic Dialogue Reasoning Slider */}
              <div className="p-4 bg-shell-raised border border-shell-line space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label htmlFor="tutor-budget" className="text-[15px] font-semibold text-shell-ink block">
                      Tutor thinking
                    </label>
                    <p id="tutor-budget-hint" className="text-[13px] text-shell-muted">
                      How carefully the tutor reviews your steps before it hints
                    </p>
                  </div>
                  <span className="text-[14px] tabular font-semibold text-shell-ink whitespace-nowrap">
                    {config?.thinkingBudgetSocratic === 0 ? 'None' : `${config?.thinkingBudgetSocratic ?? 2048} tokens`}
                  </span>
                </div>

                <input
                  id="tutor-budget"
                  aria-describedby="tutor-budget-hint"
                  type="range"
                  min={0}
                  max={4096}
                  step={256}
                  value={config?.thinkingBudgetSocratic ?? 2048}
                  onChange={(e) => handleSaveBudget('thinkingBudgetSocratic', Number(e.target.value))}
                  className="w-full accent-paper cursor-pointer"
                />

                <div className="flex justify-between text-[13px] tabular text-shell-muted">
                  <span>Fastest (0)</span>
                  <span>Recommended (2048)</span>
                  <span>Most careful (4096)</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. API KEYS */}
          {activeTab === 'apiKey' && (
            <div className="space-y-5">
              <div className="p-4 bg-shell-raised border border-shell-line space-y-3">
                <label htmlFor="gemini-key" className="text-[15px] font-semibold text-shell-ink block">
                  Your Gemini API key
                </label>
                <p className="text-[14px] leading-relaxed text-shell-muted">
                  Criterion marks your scripts and runs the tutor with Google&rsquo;s Gemini, using your own key. It&rsquo;s
                  free. The key stays in this browser and is sent with your marking and tutor requests, which pass it straight
                  to Google; Criterion doesn&rsquo;t keep it anywhere else.
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-[14px] leading-relaxed text-shell-ink">
                  <li>
                    Open{' '}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-shell-muted"
                    >
                      Google AI Studio
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>{' '}
                    and sign in with a Google account.
                  </li>
                  <li>Choose Create API key, then copy the key.</li>
                  <li>Paste it here and choose Test and save.</li>
                </ol>

                <div className="flex gap-2">
                  <input
                    id="gemini-key"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="Paste your key"
                    className="flex-1 min-h-11 bg-shell border border-shell-line px-3.5 text-[14px] text-shell-ink placeholder:text-shell-muted"
                  />
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={isTesting || !tempApiKey.trim()}
                    className="btn btn-sm btn-slip"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>{isTesting ? 'Testing…' : 'Test and save'}</span>
                  </button>
                </div>

                {testResult && <KeyTestNotice result={testResult} />}
              </div>

              {/* Z.AI / GLM-OCR API KEY */}
              <div className="p-4 bg-shell-raised border border-shell-line space-y-3">
                <label htmlFor="zai-key" className="text-[15px] font-semibold text-shell-ink block">
                  Z.AI key (optional)
                </label>
                <p className="text-[14px] leading-relaxed text-shell-muted">
                  You don&rsquo;t need this. With a Z.AI key, its GLM-OCR model also reads your handwriting and the PDFs you
                  upload, alongside Gemini.{' '}
                  <a
                    href="https://z.ai/manage-apikey/apikey-list"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-shell-ink underline underline-offset-2 hover:text-shell-muted"
                  >
                    Get a Z.AI key
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </p>

                <div className="flex gap-2">
                  <input
                    id="zai-key"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={tempZaiKey}
                    onChange={(e) => setTempZaiKey(e.target.value)}
                    placeholder="Paste your Z.AI key"
                    className="flex-1 min-h-11 bg-shell border border-shell-line px-3.5 text-[14px] text-shell-ink placeholder:text-shell-muted"
                  />
                  <button
                    type="button"
                    onClick={handleTestZaiKey}
                    disabled={isTestingZai || !tempZaiKey.trim()}
                    className="btn btn-sm btn-slip"
                  >
                    {isTestingZai ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>{isTestingZai ? 'Testing…' : 'Test and save'}</span>
                  </button>
                </div>

                {testZaiResult && <KeyTestNotice result={testZaiResult} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};
