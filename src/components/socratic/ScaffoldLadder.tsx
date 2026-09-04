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
    <div className="bg-[#141517] border border-white/[0.08] rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f3f3f2] font-mono-code">
            4-Tier Pedagogical Scaffold
          </h3>
          <p className="text-[11px] text-[#686763]">
            Progressive guidance without premature markscheme exposure
          </p>
        </div>
        <span className="text-[11px] font-mono-code font-medium text-[#f54e00] bg-[#f54e00]/10 border border-[#f54e00]/20 px-2.5 py-0.5 rounded-full">
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
                  ? 'bg-[#1a1b1e] border-[#f54e00]/60 text-[#f3f3f2]'
                  : 'bg-[#0c0d0e] border-white/[0.06] text-[#9b9a95] hover:text-[#f3f3f2] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-[#f54e00]' : isTier4 ? 'text-[#dfa88f]' : 'text-[#686763]'
                    }`}
                  />
                  <span className={`text-xs font-medium ${isActive ? 'text-[#f3f3f2]' : 'text-[#9b9a95]'}`}>
                    {title}
                  </span>
                </div>
                {isTier4 && !isMarkschemeUnlocked && (
                  <span className="text-[10px] text-[#dfa88f] flex items-center gap-0.5 font-mono-code">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#686763] line-clamp-1">{subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
