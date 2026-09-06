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
    title: 'Step 1: Command Term',
    subtitle: 'Understand what the question is asking',
    icon: Target,
  },
  {
    tier: 2,
    title: 'Step 2: Formula & Concept',
    subtitle: 'Key formulas, definitions, and concepts',
    icon: BookOpen,
  },
  {
    tier: 3,
    title: 'Step 3: Check Your Working',
    subtitle: 'Spot and fix algebraic or logical errors',
    icon: Stethoscope,
  },
  {
    tier: 4,
    title: 'Step 4: Full Markscheme',
    subtitle: 'Complete mark breakdown and scoring steps',
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
    <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e6dfd8] pb-2.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#141413] font-mono-code">
            Step-by-Step Guidance
          </h3>
          <p className="text-[11px] text-[#706e6a]">
            Get hints and check your work before revealing the markscheme
          </p>
        </div>
        <span className="text-[11px] font-mono-code font-medium text-[#cc785c] bg-[#cc785c]/10 border border-[#cc785c]/20 px-2.5 py-0.5 rounded-full">
          Step {currentTier} Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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
              className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${isActive
                  ? 'bg-[#faf9f5] border-[#cc785c] ring-1 ring-[#cc785c] text-[#141413] shadow-xs'
                  : 'bg-[#faf9f5] border-[#e6dfd8] text-[#706e6a] hover:text-[#141413] hover:border-[#cc785c]/40'
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${isActive ? 'text-[#cc785c]' : isTier4 ? 'text-[#e8a55a]' : 'text-[#706e6a]'
                      }`}
                  />
                  <span className={`text-xs font-medium ${isActive ? 'text-[#141413]' : 'text-[#706e6a]'}`}>
                    {title}
                  </span>
                </div>
                {isTier4 && !isMarkschemeUnlocked && (
                  <span className="text-[10px] text-[#e8a55a] flex items-center gap-0.5 font-mono-code">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#706e6a] line-clamp-1">{subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
