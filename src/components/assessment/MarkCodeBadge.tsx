import React from 'react';
import { MarkType } from '@/types/exam';

interface MarkCodeBadgeProps {
  code: string;
  type: MarkType;
  awarded?: boolean;
  marks?: number;
  isEcfApplied?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MarkCodeBadge: React.FC<MarkCodeBadgeProps> = ({
  code,
  type,
  awarded = true,
  marks,
  isEcfApplied = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1.5',
  }[size];

  if (isEcfApplied) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono-code font-semibold rounded-lg border ${sizeClasses} bg-[#e8a55a]/15 border-[#e8a55a]/40 text-[#e8a55a]`}
        title="Follow-through mark (ECF): Full credit awarded because your method was correct, despite an earlier slip"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#e8a55a] animate-pulse" />
        <span>{code}</span>
        <span className="text-[10px] font-sans uppercase tracking-wider bg-[#e8a55a]/25 px-1 rounded">ECF</span>
        {marks !== undefined && <span className="font-bold">+{marks}</span>}
      </span>
    );
  }

  if (!awarded) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono-code font-semibold rounded-lg border ${sizeClasses} bg-[#c64545]/15 border-[#c64545]/35 text-[#c64545]`}
        title="Mark not awarded: This step was missing or incorrect in your working"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#c64545]" />
        <span>{code}</span>
        <span className="text-[10px] font-sans uppercase tracking-wider bg-[#c64545]/20 px-1 rounded">0</span>
      </span>
    );
  }

  // Type based color coding for awarded marks
  const typeStyles: Record<MarkType, { bg: string; border: string; text: string; dot: string; label: string }> = {
    M: {
      bg: 'bg-[#5db8a6]/15',
      border: 'border-[#5db8a6]/35',
      text: 'text-[#5db8a6]',
      dot: 'bg-[#5db8a6]',
      label: 'Method',
    },
    A: {
      bg: 'bg-[#3b82f6]/15',
      border: 'border-[#3b82f6]/35',
      text: 'text-[#60a5fa]',
      dot: 'bg-[#60a5fa]',
      label: 'Accuracy',
    },
    R: {
      bg: 'bg-[#8b5cf6]/15',
      border: 'border-[#8b5cf6]/35',
      text: 'text-[#a78bfa]',
      dot: 'bg-[#a78bfa]',
      label: 'Reasoning',
    },
    AG: {
      bg: 'bg-[#a855f7]/15',
      border: 'border-[#a855f7]/35',
      text: 'text-[#c084fc]',
      dot: 'bg-[#c084fc]',
      label: 'Given',
    },
    N: {
      bg: 'bg-[#64748b]/15',
      border: 'border-[#64748b]/35',
      text: 'text-[#94a3b8]',
      dot: 'bg-[#94a3b8]',
      label: 'No Working',
    },
    FT: {
      bg: 'bg-[#e8a55a]/15',
      border: 'border-[#e8a55a]/35',
      text: 'text-[#e8a55a]',
      dot: 'bg-[#e8a55a]',
      label: 'Follow Through',
    },
  };

  const style = typeStyles[type] || typeStyles.M;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono-code font-semibold rounded-lg border ${sizeClasses} ${style.bg} ${style.border} ${style.text}`}
      title={`${style.label} mark`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{code}</span>
      {marks !== undefined && <span className="font-bold opacity-90">+{marks}</span>}
    </span>
  );
};
