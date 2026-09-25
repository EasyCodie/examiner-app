'use client';

import React, { useId, useState } from 'react';
import { FileUp } from 'lucide-react';

interface PdfFieldProps {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  onReject: (message: string) => void;
  disabled?: boolean;
}

const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');

/**
 * A file field that is a real <input type="file">: keyboard focusable,
 * announced by screen readers, and a drop target for dragged PDFs.
 */
export const PdfField: React.FC<PdfFieldProps> = ({ label, hint, file, onChange, onReject, disabled }) => {
  const id = useId();
  const [dragging, setDragging] = useState(false);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!isPdf(candidate)) {
      onReject(`${candidate.name} is not a PDF. Choose the PDF file for the ${label.toLowerCase()}.`);
      return;
    }
    onChange(candidate);
  };

  return (
    <div className="space-y-2">
      <p className="text-[15px] font-semibold text-ink" id={`${id}-label`}>
        {label}
      </p>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) accept(e.dataTransfer.files?.[0]);
        }}
        className={`relative flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-2 px-5 py-6 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink ${
          file
            ? 'border border-ink bg-paper'
            : dragging
              ? 'border border-ink bg-paper-tint'
              : 'border border-dashed border-paper-rule-strong bg-paper hover:bg-paper-tint'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input
          id={id}
          type="file"
          accept=".pdf,application/pdf"
          disabled={disabled}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-hint`}
          className="sr-only"
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {file ? (
          <>
            <span className="max-w-full truncate text-[15px] font-semibold text-ink">{file.name}</span>
            <span className="tabular text-[13px] text-ink-muted">{(file.size / 1024 / 1024).toFixed(2)} MB · choose again to replace</span>
          </>
        ) : (
          <>
            <FileUp className="h-5 w-5 text-ink" aria-hidden="true" />
            <span className="text-[15px] text-ink">
              Drop the PDF here, or <span className="font-semibold underline underline-offset-4">choose a file</span>
            </span>
          </>
        )}
      </label>
      <div className="flex items-baseline justify-between gap-3">
        <p id={`${id}-hint`} className="text-[13px] text-ink-muted">
          {hint}
        </p>
        {file && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="min-h-9 px-1 text-[13px] text-ink underline underline-offset-4"
          >
            Remove<span className="sr-only"> {label.toLowerCase()}</span>
          </button>
        )}
      </div>
    </div>
  );
};
