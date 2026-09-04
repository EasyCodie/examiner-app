'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Sliders,
  Code2,
  Key,
  Check,
  Copy,
  ExternalLink,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AiStudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiStudioDrawer: React.FC<AiStudioDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'reasoning' | 'prompts' | 'schemas' | 'apiKey'>('reasoning');
  const [activePromptTab, setActivePromptTab] = useState<'grading' | 'socratic' | 'ingestion'>('grading');
  const [activeSchemaTab, setActiveSchemaTab] = useState<'grading' | 'socratic' | 'manifest'>('grading');

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-full bg-[#141517] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 bg-[#0c0d0e] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a1b1e] border border-white/[0.08] flex items-center justify-center text-[#f54e00]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#f3f3f2] flex items-center gap-2">
                <span>Google AI Studio Telemetry Workbench</span>
                <span className="text-[10px] font-mono-code font-normal text-[#9fbbe0] bg-[#141517] px-2 py-0.5 rounded border border-white/[0.08]">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-[11px] text-[#9b9a95]">
                Examiner prompt engineering, dynamic reasoning effort & schema inspector
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close telemetry drawer"
            className="p-1.5 text-[#9b9a95] hover:text-white rounded-lg hover:bg-[#1a1b1e] transition focus-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#0c0d0e]/60 border-b border-white/[0.08] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('reasoning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium focus-ring ${
              activeTab === 'reasoning'
                ? 'bg-[#f54e00] text-white shadow-sm'
                : 'text-[#9b9a95] hover:text-[#f3f3f2] hover:bg-[#1a1b1e]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Reasoning Effort</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium focus-ring ${
              activeTab === 'prompts'
                ? 'bg-[#f54e00] text-white shadow-sm'
                : 'text-[#9b9a95] hover:text-[#f3f3f2] hover:bg-[#1a1b1e]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>System Prompts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schemas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium focus-ring ${
              activeTab === 'schemas'
                ? 'bg-[#f54e00] text-white shadow-sm'
                : 'text-[#9b9a95] hover:text-[#f3f3f2] hover:bg-[#1a1b1e]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Response Schemas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apiKey')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium focus-ring ${
              activeTab === 'apiKey'
                ? 'bg-[#f54e00] text-white shadow-sm'
                : 'text-[#9b9a95] hover:text-[#f3f3f2] hover:bg-[#1a1b1e]'
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
              <div className="p-4 bg-[#1a1b1e] border border-white/[0.08] rounded-xl text-xs text-[#9b9a95]">
                <span className="font-semibold text-[#f54e00] block mb-1 font-mono-code">
                  Dynamic Reasoning Effort in Gemini 3.8 Flash:
                </span>
                <p className="leading-relaxed">
                  The platform dynamically tunes Gemini&apos;s thinking budget depending on task complexity. High reasoning effort is engaged for official grading passes (verifying multi-step algebra and calculating ECF), while minimal thinking budget is used for Socratic conversation to achieve instant sub-second response times.
                </p>
              </div>

              {/* Grading Reasoning Slider */}
              <div className="p-4 bg-[#0c0d0e] border border-white/[0.08] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-[#f3f3f2] uppercase tracking-wider font-mono-code">
                      Timed Mock Exam Grading Reasoning
                    </h3>
                    <p className="text-[11px] text-[#9b9a95]">
                      Calculates method marks, double penalty checks, and ECF propagation
                    </p>
                  </div>
                  <span className="text-xs font-mono-code font-semibold text-[#dfa88f] bg-[#141517] px-2.5 py-1 rounded-lg border border-white/[0.08]">
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
                  className="w-full accent-[#f54e00] cursor-pointer h-2 bg-[#1a1b1e] rounded-lg appearance-none"
                />

                <div className="flex justify-between text-[10px] font-mono-code text-[#686763]">
                  <span>Standard (1024)</span>
                  <span className="text-[#dfa88f] font-semibold">Recommended Chief Examiner (8192)</span>
                  <span>Maximum Depth (16384)</span>
                </div>
              </div>

              {/* Socratic Dialogue Reasoning Slider */}
              <div className="p-4 bg-[#0c0d0e] border border-white/[0.08] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-[#f3f3f2] uppercase tracking-wider font-mono-code">
                      Socratic Learn Mode Thinking Budget
                    </h3>
                    <p className="text-[11px] text-[#9b9a95]">
                      Minimal thinking budget delivers immediate, low-latency conversational feedback
                    </p>
                  </div>
                  <span className="text-xs font-mono-code font-semibold text-[#9fbbe0] bg-[#141517] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                    {config?.thinkingBudgetSocratic === 0 ? 'Zero / Sub-Second' : `${config?.thinkingBudgetSocratic} tokens`}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={2048}
                  step={256}
                  value={config?.thinkingBudgetSocratic ?? 0}
                  onChange={(e) => handleSaveBudget('thinkingBudgetSocratic', Number(e.target.value))}
                  className="w-full accent-[#f54e00] cursor-pointer h-2 bg-[#1a1b1e] rounded-lg appearance-none"
                />

                <div className="flex justify-between text-[10px] font-mono-code text-[#686763]">
                  <span className="text-[#9fbbe0] font-semibold">Sub-Second Instant (0 tokens)</span>
                  <span>Light Reflection (1024)</span>
                  <span>Pondered (2048)</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. SYSTEM PROMPTS INSPECTOR */}
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-[#0c0d0e] p-1 rounded-lg border border-white/[0.08] text-xs font-mono-code">
                  <button
                    type="button"
                    onClick={() => setActivePromptTab('grading')}
                    className={`px-3 py-1 rounded-md transition ${
                      activePromptTab === 'grading' ? 'bg-[#f54e00] text-white font-semibold' : 'text-[#9b9a95] hover:text-[#f3f3f2]'
                    }`}
                  >
                    Examiner Grading
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePromptTab('socratic')}
                    className={`px-3 py-1 rounded-md transition ${
                      activePromptTab === 'socratic' ? 'bg-[#f54e00] text-white font-semibold' : 'text-[#9b9a95] hover:text-[#f3f3f2]'
                    }`}
                  >
                    Socratic Tutor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePromptTab('ingestion')}
                    className={`px-3 py-1 rounded-md transition ${
                      activePromptTab === 'ingestion' ? 'bg-[#f54e00] text-white font-semibold' : 'text-[#9b9a95] hover:text-[#f3f3f2]'
                    }`}
                  >
                    Dual-PDF Ingest
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(activePromptText, 'prompt')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1b1e] hover:bg-[#222428] border border-white/[0.08] text-[#f3f3f2] text-xs font-mono-code transition"
                >
                  {copied === 'prompt' ? <Check className="w-3.5 h-3.5 text-[#1f8a65]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'prompt' ? 'Copied' : 'Copy Prompt'}</span>
                </button>
              </div>

              <div className="bg-[#0c0d0e] border border-white/[0.08] rounded-xl p-4 font-mono-code text-xs text-[#9b9a95] leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                {activePromptText}
              </div>
            </div>
          )}

          {/* 3. RESPONSE SCHEMAS */}
          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-[#0c0d0e] p-1 rounded-lg border border-white/[0.08] text-xs font-mono-code">
                  <button
                    type="button"
                    onClick={() => setActiveSchemaTab('grading')}
                    className={`px-3 py-1 rounded-md transition ${
                      activeSchemaTab === 'grading' ? 'bg-[#f54e00] text-white font-semibold' : 'text-[#9b9a95] hover:text-[#f3f3f2]'
                    }`}
                  >
                    Grading Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSchemaTab('socratic')}
                    className={`px-3 py-1 rounded-md transition ${
                      activeSchemaTab === 'socratic' ? 'bg-[#f54e00] text-white font-semibold' : 'text-[#9b9a95] hover:text-[#f3f3f2]'
                    }`}
                  >
                    Socratic Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSchemaTab('manifest')}
                    className={`px-3 py-1 rounded-md transition ${
                      activeSchemaTab === 'manifest' ? 'bg-[#f54e00] text-white font-semibold' : 'text-[#9b9a95] hover:text-[#f3f3f2]'
                    }`}
                  >
                    Manifest Schema
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(activeSchemaJson, 'schema')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1b1e] hover:bg-[#222428] border border-white/[0.08] text-[#f3f3f2] text-xs font-mono-code transition"
                >
                  {copied === 'schema' ? <Check className="w-3.5 h-3.5 text-[#1f8a65]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'schema' ? 'Copied' : 'Copy Schema'}</span>
                </button>
              </div>

              <div className="bg-[#0c0d0e] border border-white/[0.08] rounded-xl p-4 font-mono-code text-xs text-[#9fbbe0] leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                {activeSchemaJson}
              </div>
            </div>
          )}

          {/* 4. API SETTINGS */}
          {activeTab === 'apiKey' && (
            <div className="space-y-5">
              <div className="p-4 bg-[#0c0d0e] border border-white/[0.08] rounded-xl space-y-3">
                <label className="text-xs font-semibold text-[#f3f3f2] uppercase tracking-wider block font-mono-code">
                  Gemini API Key Override
                </label>
                <p className="text-[11px] text-[#9b9a95]">
                  By default, the application reads <code className="text-[#f54e00] font-mono-code">GEMINI_API_KEY</code> from your server environment. You can also supply a temporary key below for local browser testing.
                </p>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 bg-[#141517] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-mono-code text-[#f3f3f2] placeholder:text-[#686763] outline-none focus:border-[#f54e00]"
                  />
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl cursor-btn-primary disabled:opacity-40 text-xs font-medium transition"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>Test & Save</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-mono-code ${
                      testResult.valid
                        ? 'bg-[#1f8a65]/10 border-[#1f8a65]/30 text-[#1f8a65]'
                        : 'bg-[#cf2d56]/10 border-[#cf2d56]/30 text-[#cf2d56]'
                    }`}
                  >
                    {testResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-[#1f8a65] shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#cf2d56] shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Z.AI / GLM-OCR API KEY */}
              <div className="p-4 bg-[#0c0d0e] border border-white/[0.08] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#f3f3f2] uppercase tracking-wider block font-mono-code">
                    Z.AI / GLM-OCR API Key (SOTA Math & Layout OCR)
                  </label>
                  <span className="text-[10px] font-mono-code text-[#1f8a65] bg-[#1f8a65]/10 px-2 py-0.5 rounded border border-[#1f8a65]/20">
                    GLM-OCR 0.9B
                  </span>
                </div>
                <p className="text-[11px] text-[#9b9a95]">
                  GLM-OCR is the primary OCR engine for dual-PDF ingestion (tables, LaTeX math, diagrams) and student canvas handwriting recognition. Reads <code className="text-[#f54e00] font-mono-code">ZAI_API_KEY</code> from <code className="text-[#f54e00] font-mono-code">.env.local</code> or local browser storage.
                </p>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tempZaiKey}
                    onChange={(e) => setTempZaiKey(e.target.value)}
                    placeholder="Enter Z.AI API key..."
                    className="flex-1 bg-[#141517] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-mono-code text-[#f3f3f2] placeholder:text-[#686763] outline-none focus:border-[#f54e00]"
                  />
                  <button
                    type="button"
                    onClick={handleTestZaiKey}
                    disabled={isTestingZai}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl cursor-btn-primary disabled:opacity-40 text-xs font-medium transition"
                  >
                    {isTestingZai ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>Test & Save</span>
                  </button>
                </div>

                {testZaiResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-mono-code ${
                      testZaiResult.valid
                        ? 'bg-[#1f8a65]/10 border-[#1f8a65]/30 text-[#1f8a65]'
                        : 'bg-[#cf2d56]/10 border-[#cf2d56]/30 text-[#cf2d56]'
                    }`}
                  >
                    {testZaiResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-[#1f8a65] shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#cf2d56] shrink-0" />
                    )}
                    <span>{testZaiResult.message}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[#0c0d0e]/60 border border-white/[0.08] rounded-xl text-xs text-[#9b9a95] flex items-center justify-between">
                  <span>Google AI Studio:</span>
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#f54e00] hover:text-[#ff6a24] font-mono-code transition"
                  >
                    <span>aistudio.google.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 bg-[#0c0d0e]/60 border border-white/[0.08] rounded-xl text-xs text-[#9b9a95] flex items-center justify-between">
                  <span>Z.AI Developer Portal:</span>
                  <a
                    href="https://z.ai/manage-apikey/apikey-list"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#1f8a65] hover:text-[#28b082] font-mono-code transition"
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
    </div>
  );
};
