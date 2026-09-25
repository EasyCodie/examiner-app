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
}

export const AiStudioDrawer: React.FC<AiStudioDrawerProps> = ({ isOpen, onClose, initialTab = 'reasoning' }) => {
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
  const [testResult, setTestResult] = useState<{ valid?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [tempZaiKey, setTempZaiKey] = useState('');
  const [testZaiResult, setTestZaiResult] = useState<{ valid?: boolean; message?: string } | null>(null);
  const [isTestingZai, setIsTestingZai] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getAiConfig().then((cfg) => {
        setConfig(cfg);
        if (cfg.apiKey) setTempApiKey(cfg.apiKey);
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
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: tempApiKey, provider: 'gemini' }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.valid) {
        await saveAiConfig({ apiKey: tempApiKey });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network test error';
      setTestResult({ valid: false, message: msg });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestZaiKey = async () => {
    setIsTestingZai(true);
    setTestZaiResult(null);
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: tempZaiKey, provider: 'zai' }),
      });
      const data = await res.json();
      setTestZaiResult(data);
      if (data.valid) {
        await saveAiConfig({ zaiApiKey: tempZaiKey });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network test error';
      setTestZaiResult({ valid: false, message: msg });
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
      className="shell-surface fixed m-0 ml-auto h-dvh max-h-none w-full max-w-2xl p-0 border-0 border-l border-shell-line bg-shell text-shell-ink backdrop:bg-[rgba(10,12,15,0.6)]"
    >
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 bg-shell-raised border-b border-shell-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-shell border border-shell-line flex items-center justify-center text-examiner-on-shell">
              <CriterionMark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-normal text-shell-ink flex items-center gap-2">
                <span>Examiner Settings &amp; AI Controls</span>
              </h2>
              <p className="text-xs text-shell-muted">
                Configure marking depth and manage API keys
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings drawer"
            className="p-1.5 text-shell-muted hover:text-shell-ink rounded-sm hover:bg-shell transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2.5 bg-shell border-b border-shell-line text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('reasoning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition font-medium ${
              activeTab === 'reasoning'
                ? 'bg-paper text-ink '
                : 'text-shell-muted hover:text-shell-ink hover:bg-shell-raised'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Marking Depth</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apiKey')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition font-medium ${
              activeTab === 'apiKey'
                ? 'bg-paper text-ink '
                : 'text-shell-muted hover:text-shell-ink hover:bg-shell-raised'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Settings</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 select-text">
          {/* 1. REASONING MODULATION */}
          {activeTab === 'reasoning' && (
            <div className="space-y-6">
              <div className="p-4 bg-shell-raised border border-shell-line rounded-sm text-xs text-shell-muted">
                <span className="font-semibold text-examiner-on-shell block mb-1 font-mono">
                  AI Thinking Budget &amp; Depth:
                </span>
                <p className="leading-relaxed">
                  The examiner dynamically adjusts how deeply it thinks depending on the task. A higher thinking budget is used when marking complete exam papers (checking multi-step algebra and calculating follow-through marks), while a balanced budget helps the tutor provide step-by-step guidance.
                </p>
              </div>

              {/* Grading Reasoning Slider */}
              <div className="p-4 bg-shell-raised border border-shell-line rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-shell-ink uppercase tracking-wider font-mono">
                      Exam Marking Depth
                    </h3>
                    <p className="text-[12px] text-shell-muted">
                      Controls how thoroughly working steps and follow-through marks are checked
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-examiner-on-shell bg-shell px-2.5 py-1 rounded-sm border border-shell-line">
                    {config?.thinkingBudgetGrading || 8192} tokens
                  </span>
                </div>

                <input
                  type="range"
                  min={1024}
                  max={8192}
                  step={1024}
                  value={config?.thinkingBudgetGrading || 8192}
                  onChange={(e) => handleSaveBudget('thinkingBudgetGrading', Number(e.target.value))}
                  className="w-full accent-paper cursor-pointer h-2 bg-shell rounded-sm appearance-none"
                />

                <div className="flex justify-between text-[12px] font-mono text-shell-muted">
                  <span>Standard (1024)</span>
                  <span className="text-examiner-on-shell font-semibold">Maximum, recommended (8192)</span>
                </div>
              </div>

              {/* Socratic Dialogue Reasoning Slider */}
              <div className="p-4 bg-shell-raised border border-shell-line rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-shell-ink uppercase tracking-wider font-mono">
                      Tutor Thinking Budget
                    </h3>
                    <p className="text-[12px] text-shell-muted">
                      Helps the tutor review your steps and offer tailored hints
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-awarded-on-shell bg-shell px-2.5 py-1 rounded-sm border border-shell-line">
                    {config?.thinkingBudgetSocratic === 0 ? 'Zero / Sub-Second' : `${config?.thinkingBudgetSocratic ?? 2048} tokens`}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={4096}
                  step={256}
                  value={config?.thinkingBudgetSocratic ?? 2048}
                  onChange={(e) => handleSaveBudget('thinkingBudgetSocratic', Number(e.target.value))}
                  className="w-full accent-paper cursor-pointer h-2 bg-shell rounded-sm appearance-none"
                />

                <div className="flex justify-between text-[12px] font-mono text-shell-muted">
                  <span>Instant / Zero (0)</span>
                  <span className="text-awarded-on-shell font-semibold">Recommended (2048)</span>
                  <span>Deep Proofs (4096)</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. API SETTINGS */}
          {activeTab === 'apiKey' && (
            <div className="space-y-5">
              <div className="p-4 bg-shell-raised border border-shell-line rounded-sm space-y-3">
                <label className="text-xs font-semibold text-shell-ink uppercase tracking-wider block font-mono">
                  Gemini API Key Override
                </label>
                <p className="text-[12px] text-shell-muted">
                  By default, the application reads <code className="text-examiner-on-shell font-mono">GEMINI_API_KEY</code> from your server environment. You can also supply a temporary key below for local browser testing.
                </p>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 bg-shell border border-shell-line rounded-sm px-3.5 py-2 text-xs font-mono text-shell-ink placeholder:text-shell-muted outline-none focus:border-examiner-on-shell"
                  />
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-sm btn btn-sm btn-slip disabled:opacity-40 text-xs font-medium transition"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>Test &amp; Save</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-sm border text-xs flex items-center gap-2 font-mono ${
                      testResult.valid
                        ? 'bg-awarded-on-shell/10 border-awarded-on-shell/30 text-awarded-on-shell'
                        : 'bg-lost-on-shell/10 border-lost-on-shell/30 text-lost-on-shell'
                    }`}
                  >
                    {testResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-awarded-on-shell shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-lost-on-shell shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Z.AI / GLM-OCR API KEY */}
              <div className="p-4 bg-shell-raised border border-shell-line rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-shell-ink uppercase tracking-wider block font-mono">
                    Z.AI / GLM-OCR API Key (SOTA Math &amp; Layout OCR)
                  </label>
                  <span className="text-[12px] font-mono text-awarded-on-shell bg-awarded-on-shell/10 px-2 py-0.5 rounded border border-awarded-on-shell/20">
                    GLM-OCR 0.9B
                  </span>
                </div>
                <p className="text-[12px] text-shell-muted">
                  GLM-OCR is the primary OCR engine for dual-PDF ingestion (tables, LaTeX math, diagrams) and student canvas handwriting recognition. Reads <code className="text-examiner-on-shell font-mono">ZAI_API_KEY</code> from <code className="text-examiner-on-shell font-mono">.env.local</code> or local browser storage.
                </p>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tempZaiKey}
                    onChange={(e) => setTempZaiKey(e.target.value)}
                    placeholder="Enter Z.AI API key..."
                    className="flex-1 bg-shell border border-shell-line rounded-sm px-3.5 py-2 text-xs font-mono text-shell-ink placeholder:text-shell-muted outline-none focus:border-examiner-on-shell"
                  />
                  <button
                    type="button"
                    onClick={handleTestZaiKey}
                    disabled={isTestingZai}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-sm btn btn-sm btn-slip disabled:opacity-40 text-xs font-medium transition"
                  >
                    {isTestingZai ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>Test &amp; Save</span>
                  </button>
                </div>

                {testZaiResult && (
                  <div
                    className={`p-3 rounded-sm border text-xs flex items-center gap-2 font-mono ${
                      testZaiResult.valid
                        ? 'bg-awarded-on-shell/10 border-awarded-on-shell/30 text-awarded-on-shell'
                        : 'bg-lost-on-shell/10 border-lost-on-shell/30 text-lost-on-shell'
                    }`}
                  >
                    {testZaiResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-awarded-on-shell shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-lost-on-shell shrink-0" />
                    )}
                    <span>{testZaiResult.message}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-shell-raised border border-shell-line rounded-sm text-xs text-shell-muted flex items-center justify-between">
                  <span>Google AI Studio:</span>
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-examiner-on-shell hover:text-shell-ink font-mono transition"
                  >
                    <span>aistudio.google.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 bg-shell-raised border border-shell-line rounded-sm text-xs text-shell-muted flex items-center justify-between">
                  <span>Z.AI Developer Portal:</span>
                  <a
                    href="https://z.ai/manage-apikey/apikey-list"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-awarded-on-shell hover:text-shell-ink font-mono transition"
                  >
                    <span>z.ai/manage-apikey</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};
