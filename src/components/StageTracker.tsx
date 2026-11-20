import { Check } from 'lucide-react';
import { CASE_STAGES } from '../utils/caseParser';
import type { CaseStage } from '../types/case';

interface StageTrackerProps {
  currentStage: CaseStage;
  hasScorecard: boolean;
}

export function StageTracker({ currentStage, hasScorecard }: StageTrackerProps) {
  const activeIndex = CASE_STAGES.indexOf(currentStage);

  return (
    <nav
      aria-label="Case progress"
      className="border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 py-2.5 overflow-x-auto"
    >
      <ol className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 sm:gap-4 min-w-[520px]">
        {CASE_STAGES.map((stage, index) => {
          const isCompleted =
            index < activeIndex || (stage === 'Feedback' && hasScorecard && currentStage === 'Feedback');
          const isCurrent = index === activeIndex && !(stage === 'Feedback' && hasScorecard);

          return (
            <li key={stage} className="flex flex-1 items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? 'text-blue-700 font-semibold'
                    : isCompleted
                      ? 'text-slate-800 font-medium'
                      : 'text-slate-400 font-normal'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-mono tabular-nums border transition-colors ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : isCurrent
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : index + 1}
                </span>
                <span className="text-xs sm:text-sm tracking-tight">{stage}</span>
              </div>

              {index < CASE_STAGES.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    index < activeIndex ? 'bg-emerald-300' : 'bg-slate-200'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
