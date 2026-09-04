'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ExamManifest } from '@/types/exam';
import { saveManifest, savePdfBlob } from '@/lib/storage';
import {
  FileUp,
  FileCheck,
  Sparkles,
  AlertCircle,
  Layers
} from 'lucide-react';

interface DualUploadDropzoneProps {
  onManifestLoaded?: (manifest: ExamManifest) => void;
}

export const DualUploadDropzone: React.FC<DualUploadDropzoneProps> = ({ onManifestLoaded }) => {
  const router = useRouter();

  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [markschemeFile, setMarkschemeFile] = useState<File | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const paperInputRef = useRef<HTMLInputElement>(null);
  const markschemeInputRef = useRef<HTMLInputElement>(null);

  const handleStartIngest = async () => {
    if (!paperFile || !markschemeFile) {
      setError('Please provide both the Question Paper PDF and the matching Markscheme PDF.');
      return;
    }

    setIsIngesting(true);
    setError(null);
    setIngestStatus('Connecting to Gemini 3.8 Flash multimodal ingestion engine...');

    try {
      const formData = new FormData();
      formData.append('paperFile', paperFile);
      formData.append('markschemeFile', markschemeFile);

      setIngestStatus('Parsing dual PDF documents into structured manifest schema...');

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to ingest documents.');
      }

      setIngestStatus('Indexing command terms, exact mark codes (M/A/R/N), and ECF rules...');

      const manifest: ExamManifest = data.manifest;

      // Save to IndexedDB
      await saveManifest(manifest);
      await savePdfBlob(manifest.id, 'paper', paperFile);
      await savePdfBlob(manifest.id, 'markscheme', markschemeFile);

      setIngestStatus('Manifest compiled successfully! Launching mock session...');
      onManifestLoaded?.(manifest);
      router.push(`/mock/${manifest.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error ingesting documents.';
      setError(msg);
      setIsIngesting(false);
    }
  };

  return (
    <div className="bg-[#0f1219] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Subtle top edge glow */}
      <div className="absolute top-0 left-1/3 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded">
            Ground-Truth Ingestion Engine
          </span>
          <span className="text-xs text-slate-400 font-mono-code">Dual-Document Alignment</span>
        </div>
        <h3 className="text-xl font-bold font-academic text-white mt-1.5">
          Examination Paper Ingestion
        </h3>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Upload an official IB Question Paper PDF alongside its matching Markscheme. The parser extracts question boundaries, mark allocations, and rubric criteria into a structured manifest.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Question Paper Dropzone */}
        <div
          onClick={() => paperInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] ${
            paperFile
              ? 'border-blue-500/60 bg-blue-950/20 text-blue-200'
              : 'border-white/[0.1] hover:border-white/[0.2] bg-[#08090d] text-slate-400 hover:text-slate-200'
          }`}
        >
          <input
            ref={paperInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setPaperFile(e.target.files[0]);
            }}
          />
          {paperFile ? (
            <>
              <FileCheck className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-xs font-bold font-mono-code text-white truncate max-w-xs">{paperFile.name}</span>
              <span className="text-[10px] text-slate-400 font-mono-code mt-1">
                {(paperFile.size / 1024 / 1024).toFixed(2)} MB • Question Paper PDF
              </span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-[#181d27] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-2.5">
                <FileUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200 font-mono-code">1. Question Paper PDF</span>
              <span className="text-[10px] text-slate-500 font-mono-code mt-0.5">Click or drop official exam PDF</span>
            </>
          )}
        </div>

        {/* Markscheme Dropzone */}
        <div
          onClick={() => markschemeInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] ${
            markschemeFile
              ? 'border-amber-500/60 bg-amber-950/20 text-amber-200'
              : 'border-white/[0.1] hover:border-white/[0.2] bg-[#08090d] text-slate-400 hover:text-slate-200'
          }`}
        >
          <input
            ref={markschemeInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setMarkschemeFile(e.target.files[0]);
            }}
          />
          {markschemeFile ? (
            <>
              <FileCheck className="w-8 h-8 text-amber-400 mb-2" />
              <span className="text-xs font-bold font-mono-code text-white truncate max-w-xs">{markschemeFile.name}</span>
              <span className="text-[10px] text-slate-400 font-mono-code mt-1">
                {(markschemeFile.size / 1024 / 1024).toFixed(2)} MB • Markscheme PDF
              </span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-[#181d27] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-2.5">
                <FileUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200 font-mono-code">2. Official Markscheme PDF</span>
              <span className="text-[10px] text-slate-500 font-mono-code mt-0.5">Click or drop matching rubric PDF</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 font-mono-code">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isIngesting && (
        <div className="mb-4 p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-200 text-xs flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
          <div>
            <span className="font-bold block text-white mb-0.5 font-mono-code">Compiling Ground-Truth Manifest</span>
            <span className="text-slate-300 font-mono-code">{ingestStatus}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleStartIngest}
        disabled={!paperFile || !markschemeFile || isIngesting}
        className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold font-mono-code text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 amber-glow"
      >
        {isIngesting ? (
          <>
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Compiling with Gemini 3.8 Flash...</span>
          </>
        ) : (
          <>
            <Layers className="w-4 h-4" />
            <span>Compile Ground-Truth Manifest</span>
          </>
        )}
      </button>
    </div>
  );
};
