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
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getAiConfig().then((cfg) => {
        setConfig(cfg);
        if (cfg.apiKey) setTempApiKey(cfg.apiKey);
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
        body: JSON.stringify({ apiKey: tempApiKey }),
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
      <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Google AI Studio Prompt Workbench</span>
                <span className="text-[10px] font-mono font-normal text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Examiner prompt engineering, dynamic reasoning effort & schema inspector
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/50 border-b border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('reasoning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'reasoning'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Reasoning Effort</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'prompts'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>System Prompts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schemas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'schemas'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Response Schemas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apiKey')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === 'apiKey'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
              <div className="p-4 bg-blue-950/20 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                <span className="font-bold text-blue-300 block mb-1">
                  Dynamic Reasoning Effort in Gemini 3.8 Flash:
                </span>
                <p className="leading-relaxed">
                  The platform dynamically tunes Gemini&apos;s thinking budget depending on task complexity. High reasoning effort is engaged for official grading passes (verifying multi-step algebra and calculating ECF), while minimal thinking budget is used for Socratic conversation to achieve instant sub-second response times.
                </p>
              </div>

              {/* Grading Reasoning Slider */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Timed Mock Exam Grading Reasoning
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Calculates method marks, double penalty checks, and ECF propagation
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
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
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Standard (1024)</span>
                  <span className="text-amber-300 font-bold">Recommended Chief Examiner (8192)</span>
                  <span>Maximum Depth (16384)</span>
                </div>
              </div>

              {/* Socratic Dialogue Reasoning Slider */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Socratic Learn Mode Thinking Budget
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Minimal thinking budget delivers immediate, low-latency conversational feedback
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/60">
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
                  className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span className="text-cyan-300 font-bold">Sub-Second Instant (0 tokens)</span>
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
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePromptTab('grading')}
                    className={`px-3 py-1 rounded-md transition ${
                      activePromptTab === 'grading' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    Examiner Grading
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePromptTab('socratic')}
                    className={`px-3 py-1 rounded-md transition ${
                      activePromptTab === 'socratic' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    Socratic Tutor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePromptTab('ingestion')}
                    className={`px-3 py-1 rounded-md transition ${
                      activePromptTab === 'ingestion' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    Dual-PDF Ingest
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(activePromptText, 'prompt')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                >
                  {copied === 'prompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'prompt' ? 'Copied' : 'Copy Prompt'}</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                {activePromptText}
              </div>
            </div>
          )}

          {/* 3. RESPONSE SCHEMAS */}
          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveSchemaTab('grading')}
                    className={`px-3 py-1 rounded-md transition ${
                      activeSchemaTab === 'grading' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    Grading Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSchemaTab('socratic')}
                    className={`px-3 py-1 rounded-md transition ${
                      activeSchemaTab === 'socratic' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    Socratic Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSchemaTab('manifest')}
                    className={`px-3 py-1 rounded-md transition ${
                      activeSchemaTab === 'manifest' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    Manifest Schema
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(activeSchemaJson, 'schema')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                >
                  {copied === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'schema' ? 'Copied' : 'Copy Schema'}</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                {activeSchemaJson}
              </div>
            </div>
          )}

          {/* 4. API SETTINGS */}
          {activeTab === 'apiKey' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Gemini API Key
                </label>
                <p className="text-[11px] text-slate-400">
                  By default, the application reads <code className="text-blue-400 font-mono">GEMINI_API_KEY</code> from your server <code className="text-blue-400 font-mono">.env.local</code>. You can also paste an override key below for browser testing.
                </p>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>Test & Save</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      testResult.valid
                        ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
                    }`}
                  >
                    {testResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                <span>Direct Google AI Studio Link:</span>
                <a
                  href="https://aistudio.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-mono"
                >
                  <span>aistudio.google.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
