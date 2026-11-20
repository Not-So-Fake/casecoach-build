import { Award, Clock, Pause, Play, RotateCcw } from 'lucide-react';

interface HeaderProps {
  inSession: boolean;
  elapsedSeconds: number;
  isTimerRunning: boolean;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onEndCase: () => void;
  onRequestNewCase: () => void;
  hasScorecard: boolean;
  onOpenScorecardModal: () => void;
  isLoading: boolean;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function Header({
  inSession,
  elapsedSeconds,
  isTimerRunning,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onEndCase,
  onRequestNewCase,
  hasScorecard,
  onOpenScorecardModal,
  isLoading,
}: HeaderProps) {
  const isOverTwentyFiveMins = elapsedSeconds >= 25 * 60;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
            CaseCoach
          </h1>
          <p className="text-xs text-slate-500 leading-snug">
            Consulting case interview practice
          </p>
        </div>

        {inSession && (
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Case Timer */}
            <div
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors ${
                isOverTwentyFiveMins
                  ? 'border-amber-300 bg-amber-50/70 text-amber-800'
                  : 'border-slate-200 bg-slate-50 text-slate-800'
              }`}
              aria-label="Case timer"
            >
              <Clock
                className={`h-3.5 w-3.5 shrink-0 ${
                  isOverTwentyFiveMins ? 'text-amber-600' : 'text-slate-500'
                }`}
              />
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatTime(elapsedSeconds)}
              </span>
              {isOverTwentyFiveMins && (
                <span className="text-[11px] font-medium text-amber-700 whitespace-nowrap">
                  25m+
                </span>
              )}
              <div className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-2">
                <button
                  type="button"
                  onClick={onStartTimer}
                  disabled={isTimerRunning}
                  title="Start timer"
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200/70 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="h-3 w-3" />
                  <span>Start</span>
                </button>
                <button
                  type="button"
                  onClick={onPauseTimer}
                  disabled={!isTimerRunning}
                  title="Pause timer"
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200/70 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
                >
                  <Pause className="h-3 w-3" />
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  onClick={onResetTimer}
                  title="Reset timer"
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200/70 transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Session Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {hasScorecard && (
                <button
                  type="button"
                  onClick={onOpenScorecardModal}
                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-800 hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Scorecard</span>
                </button>
              )}

              <button
                type="button"
                onClick={onEndCase}
                disabled={isLoading || hasScorecard}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                End case and score me
              </button>

              <button
                type="button"
                onClick={onRequestNewCase}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                New case
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
