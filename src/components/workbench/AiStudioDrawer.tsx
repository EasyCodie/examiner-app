'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AiStudioConfig } from '@/types/exam';
import { getAiConfig, saveAiConfig } from '@/lib/storage';
import {
  INGESTION_SYSTEM_PROMPT,
  GRADING_SYSTEM_PROMPT,
  SOCRATIC_SYSTEM_PROMPT,
} from '@/lib/prompts';
import {
  MANIFEST_RESPONSE_SCHEMA,
  GRADING_RESPONSE_SCHEMA,
  SOCRATIC_RESPONSE_SCHEMA,
} from '@/lib/schemas';
import {
  X,
  Sliders,
  Code2,
  Key,
  Check,
  Copy,
  ExternalLink,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  LineChart,
} from 'lucide-react';
import { CriterionMark } from '@/components/common/CriterionMark';
import { renderCartesianGraph, CartesianGraphSpec, getQuestion12GraphSpec } from '@/lib/graphRenderer';

export type AiStudioTab = 'reasoning' | 'prompts' | 'schemas' | 'apiKey' | 'graphs';

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
  const [activePromptTab, setActivePromptTab] = useState<'grading' | 'socratic' | 'ingestion'>('grading');
  const [activeSchemaTab, setActiveSchemaTab] = useState<'grading' | 'socratic' | 'manifest'>('grading');

  // Matplotlib Graph Studio state
  const [graphSpec, setGraphSpec] = useState<CartesianGraphSpec>(getQuestion12GraphSpec('exam'));
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null);
  const [isRenderingGraph, setIsRenderingGraph] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [customExpr, setCustomExpr] = useState('6 - 0.5 * (x - 2)**2');
  const [customDomain, setCustomDomain] = useState('-4, 6');
  const [selectedTheme, setSelectedTheme] = useState<'exam' | 'obsidian'>('exam');

  const [config, setConfig] = useState<AiStudioConfig | null>(null);
  const [tempApiKey, setTempApiKey] = useState('');
  const [testResult, setTestResult] = useState<{ valid?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [tempZaiKey, setTempZaiKey] = useState('');
  const [testZaiResult, setTestZaiResult] = useState<{ valid?: boolean; message?: string } | null>(null);
  const [isTestingZai, setIsTestingZai] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRenderGraph = async (specToRender: CartesianGraphSpec = graphSpec) => {
    setIsRenderingGraph(true);
    setGraphError(null);
    try {
      const svg = await renderCartesianGraph(specToRender);
      setRenderedSvg(svg);
    } catch (err: unknown) {
      setGraphError(err instanceof Error ? err.message : 'Error rendering Cartesian graph');
    } finally {
      setIsRenderingGraph(false);
    }
  };

  const activePromptText =
    activePromptTab === 'grading'
      ? GRADING_SYSTEM_PROMPT
      : activePromptTab === 'socratic'
        ? SOCRATIC_SYSTEM_PROMPT
        : INGESTION_SYSTEM_PROMPT;

  const activeSchemaJson =
    activeSchemaTab === 'grading'
      ? JSON.stringify(GRADING_RESPONSE_SCHEMA, null, 2)
      : activeSchemaTab === 'socratic'
        ? JSON.stringify(SOCRATIC_RESPONSE_SCHEMA, null, 2)
        : JSON.stringify(MANIFEST_RESPONSE_SCHEMA, null, 2);

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
                <span className="text-[12px] font-mono font-normal text-awarded-on-shell bg-shell px-2 py-0.5 rounded border border-shell-line">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-shell-muted">
                Configure marking depth, examine prompts, and manage API keys
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
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition font-medium ${
              activeTab === 'prompts'
                ? 'bg-paper text-ink '
                : 'text-shell-muted hover:text-shell-ink hover:bg-shell-raised'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>System Prompts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schemas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition font-medium ${
              activeTab === 'schemas'
                ? 'bg-paper text-ink '
                : 'text-shell-muted hover:text-shell-ink hover:bg-shell-raised'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Response Schemas</span>
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

          <button
            type="button"
            onClick={() => {
              setActiveTab('graphs');
              if (!renderedSvg) handleRenderGraph();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition font-medium ${
              activeTab === 'graphs'
                ? 'bg-paper text-ink '
                : 'text-shell-muted hover:text-shell-ink hover:bg-shell-raised'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Graph Studio</span>
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
                  max={16384}
                  step={1024}
                  value={config?.thinkingBudgetGrading || 8192}
                  onChange={(e) => handleSaveBudget('thinkingBudgetGrading', Number(e.target.value))}
                  className="w-full accent-paper cursor-pointer h-2 bg-shell rounded-sm appearance-none"
                />

                <div className="flex justify-between text-[12px] font-mono text-shell-muted">
                  <span>Standard (1024)</span>
                  <span className="text-examiner-on-shell font-semibold">Recommended (8192)</span>
                  <span>Maximum Depth (16384)</span>
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

          {/* 2. SYSTEM PROMPTS INSPECTOR */}
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-shell-raised p-1 rounded-sm border border-shell-line text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setActivePromptTab('grading')}
                    className={`px-3 py-1 rounded-sm transition ${
                      activePromptTab === 'grading' ? 'bg-paper text-ink font-semibold' : 'text-shell-muted hover:text-shell-ink'
                    }`}
                  >
                    Exam Marking
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePromptTab('socratic')}
                    className={`px-3 py-1 rounded-sm transition ${
                      activePromptTab === 'socratic' ? 'bg-paper text-ink font-semibold' : 'text-shell-muted hover:text-shell-ink'
                    }`}
                  >
                    Socratic Tutor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePromptTab('ingestion')}
                    className={`px-3 py-1 rounded-sm transition ${
                      activePromptTab === 'ingestion' ? 'bg-paper text-ink font-semibold' : 'text-shell-muted hover:text-shell-ink'
                    }`}
                  >
                    Past Paper Import
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(activePromptText, 'prompt')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-shell-raised hover:bg-shell-line border border-shell-line text-shell-ink text-xs font-mono transition"
                >
                  {copied === 'prompt' ? <Check className="w-3.5 h-3.5 text-awarded-on-shell" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'prompt' ? 'Copied' : 'Copy Prompt'}</span>
                </button>
              </div>

              <div className="bg-shell border border-shell-line rounded-sm p-4 font-mono text-xs text-shell-muted leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                {activePromptText}
              </div>
            </div>
          )}

          {/* 3. RESPONSE SCHEMAS */}
          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-shell-raised p-1 rounded-sm border border-shell-line text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveSchemaTab('grading')}
                    className={`px-3 py-1 rounded-sm transition ${
                      activeSchemaTab === 'grading' ? 'bg-paper text-ink font-semibold' : 'text-shell-muted hover:text-shell-ink'
                    }`}
                  >
                    Grading Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSchemaTab('socratic')}
                    className={`px-3 py-1 rounded-sm transition ${
                      activeSchemaTab === 'socratic' ? 'bg-paper text-ink font-semibold' : 'text-shell-muted hover:text-shell-ink'
                    }`}
                  >
                    Socratic Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSchemaTab('manifest')}
                    className={`px-3 py-1 rounded-sm transition ${
                      activeSchemaTab === 'manifest' ? 'bg-paper text-ink font-semibold' : 'text-shell-muted hover:text-shell-ink'
                    }`}
                  >
                    Manifest Schema
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(activeSchemaJson, 'schema')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-shell-raised hover:bg-shell-line border border-shell-line text-shell-ink text-xs font-mono transition"
                >
                  {copied === 'schema' ? <Check className="w-3.5 h-3.5 text-awarded-on-shell" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'schema' ? 'Copied' : 'Copy Schema'}</span>
                </button>
              </div>

              <div className="bg-shell border border-shell-line rounded-sm p-4 font-mono text-xs text-awarded-on-shell leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                {activeSchemaJson}
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

          {/* 5. MATPLOTLIB GRAPH STUDIO */}
          {activeTab === 'graphs' && (
            <div className="space-y-5">
              <div className="p-4 bg-shell-raised border border-shell-line rounded-sm text-xs text-shell-muted">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-examiner-on-shell font-mono flex items-center gap-1.5">
                    <LineChart className="w-4 h-4" />
                    Python Matplotlib &amp; NumPy Cartesian Pipeline
                  </span>
                  <span className="text-[12px] font-mono text-awarded-on-shell bg-awarded-on-shell/10 border border-awarded-on-shell/20 px-2 py-0.5 rounded-full">
                    Python 3.14 • Matplotlib 3.11
                  </span>
                </div>
                <p className="leading-relaxed text-shell-ink">
                  Vector Cartesian plane engine rendering authentic IB exam coordinate grids, piecewise functions,
                  vertical/horizontal asymptotes, and shaded integration regions with genuine mathematical precision.
                </p>
              </div>

              {/* Presets & Theme Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      const spec = getQuestion12GraphSpec(selectedTheme);
                      setGraphSpec(spec);
                      handleRenderGraph(spec);
                    }}
                    className="px-2.5 py-1 bg-shell-raised hover:bg-shell-line border border-shell-line text-shell-ink rounded-sm transition"
                  >
                    Preset: Question 12
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const spec: CartesianGraphSpec = {
                        title: 'Rational Curve with Asymptotes: f(x) = 1/(x-2) + 1',
                        theme: selectedTheme,
                        xRange: [-4, 8],
                        yRange: [-6, 8],
                        xStep: 2,
                        yStep: 2,
                        grid: true,
                        showAxes: true,
                        curves: [
                          { expression: '1 / (x - 2) + 1', domain: [-4, 1.9], color: selectedTheme === 'exam' ? '#0f172a' : '#cc785c', width: 2.2 },
                          { expression: '1 / (x - 2) + 1', domain: [2.1, 8], color: selectedTheme === 'exam' ? '#0f172a' : '#cc785c', width: 2.2 },
                        ],
                        asymptotes: [
                          { type: 'vertical', value: 2, label: 'x = 2', color: '#c64545' },
                          { type: 'horizontal', value: 1, label: 'y = 1', color: '#5db8a6' },
                        ],
                        points: [
                          { x: 0, y: 0.5, label: '(0, 0.5)', color: '#5db8a6' },
                          { x: 1, y: 0, label: '(1, 0)', color: '#5db8a6' },
                        ],
                      };
                      setGraphSpec(spec);
                      handleRenderGraph(spec);
                    }}
                    className="px-2.5 py-1 bg-shell-raised hover:bg-shell-line border border-shell-line text-shell-ink rounded-sm transition"
                  >
                    Preset: Rational Curve
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const spec: CartesianGraphSpec = {
                        title: 'Definite Integral: Area under y = 2*sin(x)',
                        theme: selectedTheme,
                        xRange: [-1, 7],
                        yRange: [-3, 3],
                        xStep: 1,
                        yStep: 1,
                        grid: true,
                        showAxes: true,
                        curves: [
                          { expression: '2 * np.sin(x)', domain: [0, 6.28], label: 'y = 2 sin(x)', color: selectedTheme === 'exam' ? '#0f172a' : '#cc785c', width: 2.2 },
                        ],
                        shading: [
                          { expression: '2 * np.sin(x)', domain: [0, 3.14159], color: 'rgba(204, 120, 92, 0.25)', label: 'Integral' },
                        ],
                        annotations: [
                          { x: 1.57, y: 0.8, text: 'Area = 4', color: selectedTheme === 'exam' ? '#0f172a' : '#faf9f5' }
                        ]
                      };
                      setGraphSpec(spec);
                      handleRenderGraph(spec);
                    }}
                    className="px-2.5 py-1 bg-shell-raised hover:bg-shell-line border border-shell-line text-shell-ink rounded-sm transition"
                  >
                    Preset: Trig &amp; Area
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="flex items-center gap-1 bg-shell-raised p-1 rounded-sm border border-shell-line text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTheme('exam');
                      const updated = { ...graphSpec, theme: 'exam' as const };
                      setGraphSpec(updated);
                      handleRenderGraph(updated);
                    }}
                    className={`px-2 py-1 rounded transition ${
                      selectedTheme === 'exam'
                        ? 'bg-paper text-ink font-semibold'
                        : 'text-shell-muted hover:text-shell-ink'
                    }`}
                  >
                    Exam Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTheme('obsidian');
                      const updated = { ...graphSpec, theme: 'obsidian' as const };
                      setGraphSpec(updated);
                      handleRenderGraph(updated);
                    }}
                    className={`px-2 py-1 rounded transition ${
                      selectedTheme === 'obsidian'
                        ? 'bg-paper text-ink font-semibold'
                        : 'text-shell-muted hover:text-shell-ink'
                    }`}
                  >
                    Claude Navy
                  </button>
                </div>
              </div>

              {/* Custom Expression Row */}
              <div className="p-4 bg-shell-raised border border-shell-line rounded-sm space-y-3 text-xs">
                <div className="font-semibold text-shell-ink font-mono flex items-center justify-between">
                  <span>Custom Equation Plotter:</span>
                  <span className="text-[12px] text-shell-muted">Supports numpy math (x**2, sin(x), exp(x), log(x))</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="text-[12px] font-mono text-shell-muted block mb-1">
                      Function f(x) =
                    </label>
                    <input
                      type="text"
                      value={customExpr}
                      onChange={(e) => setCustomExpr(e.target.value)}
                      placeholder="e.g. 6 - 0.5 * (x - 2)**2"
                      className="w-full bg-shell border border-shell-line rounded-sm px-3 py-1.5 font-mono text-shell-ink outline-none focus:border-examiner-on-shell"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[12px] font-mono text-shell-muted block mb-1">
                      Domain [x_min, x_max]
                    </label>
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="-4, 6"
                      className="w-full bg-shell border border-shell-line rounded-sm px-3 py-1.5 font-mono text-shell-ink outline-none focus:border-examiner-on-shell"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isRenderingGraph}
                    onClick={() => {
                      const domainParts = customDomain.split(',').map((p) => parseFloat(p.trim()));
                      const dMin = isNaN(domainParts[0]) ? -5 : domainParts[0];
                      const dMax = isNaN(domainParts[1]) ? 5 : domainParts[1];
                      const spec: CartesianGraphSpec = {
                        title: `f(x) = ${customExpr}`,
                        theme: selectedTheme,
                        xRange: [Math.floor(dMin - 1), Math.ceil(dMax + 1)],
                        yRange: [-6, 8],
                        xStep: 1,
                        yStep: 1,
                        grid: true,
                        showAxes: true,
                        curves: [
                          {
                            expression: customExpr,
                            domain: [dMin, dMax],
                            color: selectedTheme === 'exam' ? '#0f172a' : '#cc785c',
                            width: 2.2,
                          },
                        ],
                      };
                      setGraphSpec(spec);
                      handleRenderGraph(spec);
                    }}
                    className="px-4 py-1.5 btn btn-sm btn-slip text-xs font-mono flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isRenderingGraph ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Rendering in Python...</span>
                      </>
                    ) : (
                      <>
                        <LineChart className="w-3.5 h-3.5" />
                        <span>Plot with Matplotlib</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {graphError && (
                <div className="p-3 bg-lost-on-shell/15 border border-lost-on-shell/40 rounded-sm text-xs text-lost-on-shell flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 text-lost-on-shell shrink-0" />
                  <span>{graphError}</span>
                </div>
              )}

              {/* Live Preview Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-shell-muted">
                  <span>Live Scalable SVG Preview:</span>
                  {renderedSvg && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(renderedSvg, 'svg')}
                        className="flex items-center gap-1 text-examiner-on-shell hover:text-shell-ink transition"
                      >
                        {copied === 'svg' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copied === 'svg' ? 'Copied!' : 'Copy SVG'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className={`w-full rounded-sm border p-4 flex flex-col items-center justify-center transition-all ${
                    selectedTheme === 'exam'
                      ? 'bg-paper border-paper-rule '
                      : 'bg-shell border-shell-line'
                  }`}
                >
                  {isRenderingGraph ? (
                    <div className="py-20 text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-examiner-on-shell animate-spin mx-auto" />
                      <p className="text-xs font-mono text-shell-muted">
                        Executing Python Matplotlib subprocess...
                      </p>
                    </div>
                  ) : renderedSvg ? (
                    <div
                      className="w-full max-w-lg flex justify-center [&>svg]:max-w-full [&>svg]:h-auto "
                      dangerouslySetInnerHTML={{ __html: renderedSvg }}
                    />
                  ) : (
                    <div className="py-20 text-center text-xs font-mono text-shell-muted">
                      Click &quot;Plot with Matplotlib&quot; or select a preset above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};
