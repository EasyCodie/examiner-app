'use client';

import React, { useEffect, useId, useRef } from 'react';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** When false, Esc cannot dismiss the dialog (e.g. pens down). */
  dismissable?: boolean;
}

/**
 * Modal built on the native <dialog>: the browser traps focus, makes the page
 * inert, handles Esc, and returns focus to the opener on close.
 */
export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onClose,
  title,
  children,
  dismissable = true,
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="report-dialog paper-surface"
      onCancel={(e) => {
        e.preventDefault();
        if (dismissable) onClose();
      }}
    >
      <div className="p-6 sm:p-7 space-y-5">
        <h2 id={titleId} className="font-serif text-[24px] leading-tight font-semibold text-ink">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
};
