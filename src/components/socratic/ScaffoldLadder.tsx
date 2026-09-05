'use client';

import React from 'react';
import { PedagogicalTier } from '@/types/exam';
import { Target, BookOpen, Stethoscope, Unlock, Lock } from 'lucide-react';

interface ScaffoldLadderProps {
  currentTier: PedagogicalTier;
  onSelectTier: (tier: PedagogicalTier) => void;
  isMarkschemeUnlocked: boolean;
  onUnlockMarkscheme: () => void;
}

const TIERS: { tier: PedagogicalTier; title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    tier: 1,
    title: 'Tier 1: Command Term',
    subtitle: 'Clarify operational scope & requirements',
    icon: Target,
  },
  {
    tier: 2,
    title: 'Tier 2: Formula & Model',
    subtitle: 'Point to formula booklet or theoretical model',
    icon: BookOpen,
  },
  {
    tier: 3,
    title: 'Tier 3: Step Diagnostic',
    subtitle: 'Pinpoint arithmetic/logical roadblock',
    icon: Stethoscope,
  },
  {
    tier: 4,
    title: 'Tier 4: Official Markscheme',
    subtitle: 'Full mark codes & Senior Examiner rubric',
    icon: Unlock,
  },
];

export const ScaffoldLadder: React.FC<ScaffoldLadderProps> = ({
  currentTier,
  onSelectTier,
  isMarkschemeUnlocked,
  onUnlockMarkscheme,
}) => {
  return (
    <div className="bg-[var(--cursor-surface-card)] border border-white/[0.08] rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--cursor-text-strong)] font-mono-code">
            4-Tier Pedagogical Scaffold
          </h3>
          <p className="text-[11px] text-[var(--cursor-text-muted)]">
            Progressive guidance without premature markscheme exposure
          </p>
        </div>
        <span className="text-[11px] font-mono-code font-medium text-[var(--cursor-primary)] bg-[var(--cursor-primary)]/10 border border-[var(--cursor-primary)]/20 px-2.5 py-0.5 rounded-full">
          Tier {currentTier} Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {TIERS.map(({ tier, title, subtitle, icon: Icon }) => {
          const isActive = currentTier === tier;
          const isTier4 = tier === 4;

          return (
            <button
              key={tier}
              type="button"
              onClick={() => {
                if (isTier4 && !isMarkschemeUnlocked) {
                  onUnlockMarkscheme();
                } else {
                  onSelectTier(tier);
                }
              }}
              className={`p-2.5 rounded-lg text-left border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-[var(--cursor-surface-card)] border-[var(--cursor-primary)]/60 text-[var(--cursor-text-strong)]'
                  : 'bg-[var(--cursor-canvas)] border-white/[0.06] text-[var(--cursor-text-body)] hover:text-[var(--cursor-text-strong)] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-[var(--cursor-primary)]' : isTier4 ? 'text-amber-400' : 'text-[var(--cursor-text-muted)]'
                    }`}
                  />
                  <span className={`text-xs font-medium ${isActive ? 'text-[var(--cursor-text-strong)]' : 'text-[var(--cursor-text-body)]'}`}>
                    {title}
                  </span>
                </div>
                {isTier4 && !isMarkschemeUnlocked && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-mono-code">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--cursor-text-muted)] line-clamp-1">{subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
