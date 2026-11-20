import { useEffect } from 'react';
import { Award, ChevronDown, ChevronUp, RotateCcw, Target, X } from 'lucide-react';
import type { ScorecardRow } from '../types/case';

interface ScorecardContentProps {
  rows: ScorecardRow[];
  hiddenSetting: string | null;
  onDrillWeakest: () => void;
  onRequestNewCase: () => void;
  isLoading: boolean;
}

function getRatingStyles(rating: string): {
  classes: string;
  label: string;
} {
  const normalized = rating.trim().toLowerCase();
  if (normalized.includes('strong')) {
    return {
      classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      label: rating.trim(),
    };
  }
  if (normalized.includes('developing')) {
    return {
      classes: 'border-amber-200 bg-amber-50 text-amber-800',
      label: rating.trim(),
    };
  }
  if (normalized.includes('needs work')) {
    return {
      classes: 'border-rose-200 bg-rose-50 text-rose-800',
      label: rating.trim(),
    };
  }
  return {
    classes: 'border-slate-200 bg-slate-100 text-slate-700',
    label: rating.trim() || 'Not assessed',
  };
}

function ScorecardTable({
  rows,
  hiddenSetting,
  onDrillWeakest,
  onRequestNewCase,
  isLoading,
}: ScorecardContentProps) {
  return (
    <div className="space-y-4">
      {hiddenSetting && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
          <span className="font-medium text-slate-900">This case was built around:</span>{' '}
          <span>{hiddenSetting}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-2.5 text-left font-semibold text-slate-900">Skill</th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-900 whitespace-nowrap">
                Rating
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-900">Evidence</th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-900">Improvement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const ratingStyle = getRatingStyles(row.rating);
              return (
                <tr
                  key={`${row.skill}-${idx}`}
                  className="border-b border-slate-100 last:border-b-0 align-top"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                    {row.skill}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold ${ratingStyle.classes}`}
                    >
                      {ratingStyle.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 leading-relaxed min-w-[200px]">
                    {row.evidence}
                  </td>
                  <td className="px-4 py-3 text-slate-700 leading-relaxed min-w-[200px]">
                    {row.improvement}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onDrillWeakest}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <Target className="h-4 w-4" />
          <span>Drill my weakest skill</span>
        </button>

        <button
          type="button"
          onClick={onRequestNewCase}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <RotateCcw className="h-4 w-4" />
          <span>New case</span>
        </button>
      </div>
    </div>
  );
}

interface ScorecardCardProps extends ScorecardContentProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ScorecardCard({
  isCollapsed,
  onToggleCollapse,
  ...props
}: ScorecardCardProps) {
  return (
    <section
      aria-label="Case scorecard"
      className="rounded-lg border border-slate-200 bg-white overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 sm:px-5 py-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-blue-700" />
          <h2 className="text-sm font-semibold text-slate-900">
            Performance Scorecard
          </h2>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
        >
          <span>{isCollapsed ? 'Show scorecard' : 'Hide scorecard'}</span>
          {isCollapsed ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5">
          <ScorecardTable {...props} />
        </div>
      )}
    </section>
  );
}

interface ScorecardModalProps extends ScorecardContentProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScorecardModal({
  isOpen,
  onClose,
  onDrillWeakest,
  ...props
}: ScorecardModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scorecard-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-700" />
            <h2 id="scorecard-modal-title" className="text-base font-semibold text-slate-900">
              Performance Scorecard
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 transition-colors"
            aria-label="Close scorecard"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <ScorecardTable
            {...props}
            onDrillWeakest={() => {
              onClose();
              onDrillWeakest();
            }}
          />
        </div>
      </div>
    </div>
  );
}
