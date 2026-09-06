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
    <div className="double-bezel-outer-cream">
      <div className="double-bezel-inner-cream p-6 sm:p-8 relative overflow-hidden text-[#141413]">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="eyebrow-pill text-[#a94e32] bg-[#a94e32]/10 border border-[#a94e32]/20 px-2.5 py-0.5 flex items-center gap-1.5">
              <SpikeMark className="w-3 h-3 text-[#a94e32]" />
              Add Exam Paper
            </span>
            <span className="text-xs text-[#54524c] font-mono-code">• With Markscheme</span>
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
          <div className="p-1 rounded-2xl bg-[#e6dfd8]/60 transition-fluid group/drop">
            <div
              onClick={() => paperInputRef.current?.click()}
              className={`border rounded-[calc(1rem+4px)] p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] ${
                paperFile
                  ? 'border-[#a94e32] bg-[#faf9f5] text-[#141413]'
                  : 'border-[#e6dfd8] hover:border-[#a94e32]/50 bg-[#faf9f5] text-[#54524c] hover:text-[#141413]'
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
                <div className="flex flex-col items-center animate-attach-settle">
                  <FileCheck className="w-8 h-8 text-[#a94e32] mb-2" />
                  <span className="text-xs font-semibold font-mono-code text-[#141413] truncate max-w-xs">{paperFile.name}</span>
                  <span className="text-[10px] text-[#54524c] font-mono-code mt-1">
                    {(paperFile.size / 1024 / 1024).toFixed(2)} MB • Question Paper PDF
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#a94e32] mb-2.5 group-hover/drop:scale-105 transition-spring">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-[#141413]">1. Question Paper PDF</span>
                  <span className="text-[10px] text-[#54524c] font-mono-code mt-0.5">Click or drop official exam PDF</span>
                </>
              )}
            </div>
          </div>

          {/* Markscheme Dropzone */}
          <div className="p-1 rounded-2xl bg-[#e6dfd8]/60 transition-fluid group/drop">
            <div
              onClick={() => markschemeInputRef.current?.click()}
              className={`border rounded-[calc(1rem+4px)] p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[170px] ${
                markschemeFile
                  ? 'border-[#a94e32] bg-[#faf9f5] text-[#141413]'
                  : 'border-[#e6dfd8] hover:border-[#a94e32]/50 bg-[#faf9f5] text-[#54524c] hover:text-[#141413]'
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
                <div className="flex flex-col items-center animate-attach-settle">
                  <FileCheck className="w-8 h-8 text-[#a94e32] mb-2" />
                  <span className="text-xs font-semibold font-mono-code text-[#141413] truncate max-w-xs">{markschemeFile.name}</span>
                  <span className="text-[10px] text-[#54524c] font-mono-code mt-1">
                    {(markschemeFile.size / 1024 / 1024).toFixed(2)} MB • Markscheme PDF
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center text-[#a94e32] mb-2.5 group-hover/drop:scale-105 transition-spring">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-[#141413]">2. Official Markscheme PDF</span>
                  <span className="text-[10px] text-[#54524c] font-mono-code mt-0.5">Click or drop matching rubric PDF</span>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-lg bg-[#c64545]/10 border border-[#c64545]/30 text-[#c64545] text-xs flex items-center gap-2 font-mono-code animate-message-enter">
            <AlertCircle className="w-4 h-4 text-[#c64545] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isIngesting && (
          <div className="mb-4 p-4 rounded-xl bg-[#faf9f5] border border-[#a94e32]/30 text-xs flex items-center gap-3 relative overflow-hidden animate-message-enter">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#a94e32]/10 to-transparent animate-beam-scan pointer-events-none" />
            <Loader2 className="w-5 h-5 text-[#a94e32] animate-spin shrink-0 relative z-10" />
            <div className="relative z-10">
              <span className="font-semibold block text-[#141413] mb-0.5 font-mono-code">Preparing Your Exam Paper</span>
              <span className="text-[#54524c] font-mono-code">{ingestStatus}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleStartIngest}
          disabled={!paperFile || !markschemeFile || isIngesting}
          className="w-full claude-btn-pill-primary py-3 disabled:opacity-40 font-medium text-xs tracking-wider justify-between"
        >
          {isIngesting ? (
            <>
              <span>Preparing Exam...</span>
              <span className="btn-icon-bubble">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              </span>
            </>
          ) : (
            <>
              <span>Create Practice Exam</span>
              <span className="btn-icon-bubble">
                <Layers className="w-3.5 h-3.5 text-white" />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
