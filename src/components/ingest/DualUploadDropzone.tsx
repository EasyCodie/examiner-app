'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ExamManifest } from '@/types/exam';
import { saveManifest, savePdfBlob, getAiConfig } from '@/lib/storage';
import {
  FileUp,
  FileCheck,
  AlertCircle,
  Layers,
  Loader2,
} from 'lucide-react';
import { SpikeMark } from '@/components/common/SpikeMark';

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
    setIngestStatus('Opening your exam documents...');

    try {
      const cfg = await getAiConfig();
      const formData = new FormData();
      formData.append('paperFile', paperFile);
      formData.append('markschemeFile', markschemeFile);

      setIngestStatus('Scanning questions, formulas, and markscheme...');

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
        throw new Error(data.error || 'Failed to process documents.');
      }

      setIngestStatus('Matching marks and follow-through rules...');

      const manifest: ExamManifest = data.manifest;

      // Save to IndexedDB
      await saveManifest(manifest);
      await savePdfBlob(manifest.id, 'paper', paperFile);
      await savePdfBlob(manifest.id, 'markscheme', markschemeFile);

      setIngestStatus('Exam ready! Starting your session...');
      onManifestLoaded?.(manifest);
      router.push(`/mock/${manifest.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing exam documents.';
      setError(msg);
      setIsIngesting(false);
    }
  };

  return (
    <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-xl p-6 sm:p-8 relative overflow-hidden text-[#141413]">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono-code font-semibold uppercase tracking-wider text-[#cc785c] bg-[#cc785c]/10 border border-[#cc785c]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <SpikeMark className="w-3 h-3 text-[#cc785c]" />
            Add Exam Paper
          </span>
          <span className="text-xs text-[#6c6a64] font-mono-code">• With Markscheme</span>
        </div>
        <h3 className="font-serif-display text-2xl font-normal text-[#141413] tracking-tight">
          Add Past Exam Paper &amp; Markscheme
        </h3>
        <p className="text-xs text-[#3d3d3a] mt-1 max-w-2xl leading-relaxed">
          Upload an official IB Question Paper alongside its matching Markscheme PDF. We will turn both files into an interactive exam with step-by-step marking.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Question Paper Dropzone */}
        <div
          onClick={() => paperInputRef.current?.click()}
          className={`border rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] ${
            paperFile
              ? 'border-[#cc785c] bg-[#faf9f5] text-[#141413]'
              : 'border-[#e6dfd8] hover:border-[#cc785c]/50 bg-[#faf9f5] text-[#6c6a64] hover:text-[#141413]'
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
              <FileCheck className="w-8 h-8 text-[#cc785c] mb-2" />
              <span className="text-xs font-semibold font-mono-code text-[#141413] truncate max-w-xs">{paperFile.name}</span>
              <span className="text-[10px] text-[#8e8b82] font-mono-code mt-1">
                {(paperFile.size / 1024 / 1024).toFixed(2)} MB • Question Paper PDF
              </span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#cc785c] mb-2.5">
                <FileUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-[#141413]">1. Question Paper PDF</span>
              <span className="text-[10px] text-[#8e8b82] font-mono-code mt-0.5">Click or drop official exam PDF</span>
            </>
          )}
        </div>

        {/* Markscheme Dropzone */}
        <div
          onClick={() => markschemeInputRef.current?.click()}
          className={`border rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] ${
            markschemeFile
              ? 'border-[#cc785c] bg-[#faf9f5] text-[#141413]'
              : 'border-[#e6dfd8] hover:border-[#cc785c]/50 bg-[#faf9f5] text-[#6c6a64] hover:text-[#141413]'
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
              <FileCheck className="w-8 h-8 text-[#cc785c] mb-2" />
              <span className="text-xs font-semibold font-mono-code text-[#141413] truncate max-w-xs">{markschemeFile.name}</span>
              <span className="text-[10px] text-[#8e8b82] font-mono-code mt-1">
                {(markschemeFile.size / 1024 / 1024).toFixed(2)} MB • Markscheme PDF
              </span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#cc785c] mb-2.5">
                <FileUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-[#141413]">2. Official Markscheme PDF</span>
              <span className="text-[10px] text-[#8e8b82] font-mono-code mt-0.5">Click or drop matching rubric PDF</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-lg bg-[#c64545]/10 border border-[#c64545]/30 text-[#c64545] text-xs flex items-center gap-2 font-mono-code">
          <AlertCircle className="w-4 h-4 text-[#c64545] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isIngesting && (
        <div className="mb-4 p-4 rounded-xl bg-[#faf9f5] border border-[#cc785c]/30 text-xs flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-[#cc785c] animate-spin shrink-0" />
          <div>
            <span className="font-semibold block text-[#141413] mb-0.5 font-mono-code">Preparing Your Exam Paper</span>
            <span className="text-[#6c6a64] font-mono-code">{ingestStatus}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleStartIngest}
        disabled={!paperFile || !markschemeFile || isIngesting}
        className="w-full claude-btn-primary py-3 rounded-lg disabled:opacity-40 font-medium text-xs tracking-wider transition flex items-center justify-center gap-2 focus-ring"
      >
        {isIngesting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Preparing Exam...</span>
          </>
        ) : (
          <>
            <Layers className="w-4 h-4" />
            <span>Create Practice Exam</span>
          </>
        )}
      </button>
    </div>
  );
};
