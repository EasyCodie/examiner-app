'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ExamManifest } from '@/types/exam';
import { saveManifest, savePdfBlob, getAiConfig } from '@/lib/storage';
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
    setIngestStatus('Connecting to GLM-OCR & Gemini ingestion engine...');

    try {
      const cfg = await getAiConfig();
      const formData = new FormData();
      formData.append('paperFile', paperFile);
      formData.append('markschemeFile', markschemeFile);

      setIngestStatus('Parsing dual PDF documents with GLM-OCR & structuring manifest schema...');

      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          ...(cfg.apiKey ? { 'x-gemini-key': cfg.apiKey } : {}),
          ...(cfg.zaiApiKey ? { 'x-zai-key': cfg.zaiApiKey } : {}),
        },
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
    <div className="bg-[#141517] border border-white/[0.08] rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-code font-semibold uppercase tracking-wider text-[#f54e00] bg-[#f54e00]/10 border border-[#f54e00]/20 px-2 py-0.5 rounded">
            Ground-Truth Ingestion Engine
          </span>
          <span className="text-xs text-[#9b9a95] font-mono-code">Dual-Document Alignment</span>
        </div>
        <h3 className="text-lg font-medium text-[#f3f3f2] mt-2 tracking-tight">
          Examination Paper Ingestion
        </h3>
        <p className="text-xs text-[#9b9a95] mt-1 max-w-2xl leading-relaxed">
          Upload an official IB Question Paper PDF alongside its matching Markscheme. The parser extracts question boundaries, mark allocations, and rubric criteria into a structured manifest.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Question Paper Dropzone */}
        <div
          onClick={() => paperInputRef.current?.click()}
          className={`border rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] ${paperFile
              ? 'border-[#f54e00]/60 bg-[#18191d] text-[#f3f3f2]'
              : 'border-white/[0.08] hover:border-white/[0.18] bg-[#0c0d0e] text-[#9b9a95] hover:text-[#f3f3f2]'
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
              <FileCheck className="w-8 h-8 text-[#f54e00] mb-2" />
              <span className="text-xs font-semibold font-mono-code text-[#f3f3f2] truncate max-w-xs">{paperFile.name}</span>
              <span className="text-[10px] text-[#686763] font-mono-code mt-1">
                {(paperFile.size / 1024 / 1024).toFixed(2)} MB • Question Paper PDF
              </span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-[#1a1b1e] border border-white/[0.08] flex items-center justify-center text-[#9b9a95] mb-2.5">
                <FileUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-[#f3f3f2] font-mono-code">1. Question Paper PDF</span>
              <span className="text-[10px] text-[#686763] font-mono-code mt-0.5">Click or drop official exam PDF</span>
            </>
          )}
        </div>

        {/* Markscheme Dropzone */}
        <div
          onClick={() => markschemeInputRef.current?.click()}
          className={`border rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] ${markschemeFile
              ? 'border-[#f54e00]/60 bg-[#18191d] text-[#f3f3f2]'
              : 'border-white/[0.08] hover:border-white/[0.18] bg-[#0c0d0e] text-[#9b9a95] hover:text-[#f3f3f2]'
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
              <FileCheck className="w-8 h-8 text-[#dfa88f] mb-2" />
              <span className="text-xs font-semibold font-mono-code text-[#f3f3f2] truncate max-w-xs">{markschemeFile.name}</span>
              <span className="text-[10px] text-[#686763] font-mono-code mt-1">
                {(markschemeFile.size / 1024 / 1024).toFixed(2)} MB • Markscheme PDF
              </span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-[#1a1b1e] border border-white/[0.08] flex items-center justify-center text-[#9b9a95] mb-2.5">
                <FileUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-[#f3f3f2] font-mono-code">2. Official Markscheme PDF</span>
              <span className="text-[10px] text-[#686763] font-mono-code mt-0.5">Click or drop matching rubric PDF</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#cf2d56]/10 border border-[#cf2d56]/30 text-[#cf2d56] text-xs flex items-center gap-2 font-mono-code">
          <AlertCircle className="w-4 h-4 text-[#cf2d56] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isIngesting && (
        <div className="mb-4 p-4 rounded-xl bg-[#0c0d0e] border border-[#f54e00]/30 text-xs flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#f54e00] animate-spin shrink-0" />
          <div>
            <span className="font-semibold block text-[#f3f3f2] mb-0.5 font-mono-code">Compiling Ground-Truth Manifest</span>
            <span className="text-[#9b9a95] font-mono-code">{ingestStatus}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleStartIngest}
        disabled={!paperFile || !markschemeFile || isIngesting}
        className="w-full py-3 rounded-xl cursor-btn-primary disabled:opacity-40 font-medium font-mono-code text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 focus-ring"
      >
        {isIngesting ? (
          <>
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Compiling Manifest...</span>
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
