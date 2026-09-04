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
        className={`inline-flex items-center gap-1 font-mono-code font-semibold rounded-md border ${sizeClasses} bg-amber-500/15 border-amber-500/40 text-amber-300`}
        title="Error Carried Forward (ECF): Method mark preserved to avoid double penalty"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>{code}</span>
        <span className="text-[10px] font-sans uppercase tracking-wider bg-amber-500/30 px-1 rounded">ECF</span>
        {marks !== undefined && <span className="text-amber-200/80 font-bold">+{marks}</span>}
      </span>
    );
  }

  if (!awarded) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono-code font-semibold rounded-md border ${sizeClasses} bg-rose-950/40 border-rose-800/50 text-rose-300`}
        title="Mark forfeited or not demonstrated in student working"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>{code}</span>
        <span className="text-[10px] font-sans uppercase tracking-wider bg-rose-900/50 px-1 rounded">0</span>
      </span>
    );
  }

  // Type based color coding for awarded marks
  const typeStyles: Record<MarkType, { bg: string; border: string; text: string; dot: string; label: string }> = {
    M: {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-700/50',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      label: 'Method',
    },
    A: {
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-700/50',
      text: 'text-cyan-300',
      dot: 'bg-cyan-400',
      label: 'Accuracy',
    },
    R: {
      bg: 'bg-indigo-950/40',
      border: 'border-indigo-700/50',
      text: 'text-indigo-300',
      dot: 'bg-indigo-400',
      label: 'Reasoning',
    },
    AG: {
      bg: 'bg-purple-950/40',
      border: 'border-purple-700/50',
      text: 'text-purple-300',
      dot: 'bg-purple-400',
      label: 'Given',
    },
    N: {
      bg: 'bg-blue-950/40',
      border: 'border-blue-700/50',
      text: 'text-blue-300',
      dot: 'bg-blue-400',
      label: 'No Working',
    },
    FT: {
      bg: 'bg-amber-950/40',
      border: 'border-amber-700/50',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      label: 'Follow Through',
    },
  };

  const style = typeStyles[type] || typeStyles.M;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono-code font-semibold rounded-md border ${sizeClasses} ${style.bg} ${style.border} ${style.text}`}
      title={`${style.label} mark`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{code}</span>
      {marks !== undefined && <span className="font-bold opacity-90">+{marks}</span>}
    </span>
  );
};
