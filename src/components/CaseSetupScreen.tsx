import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { INDUSTRIES } from '../utils/caseParser';
import type { CaseType, Difficulty } from '../types/case';

interface CaseSetupScreenProps {
  onStartCase: (caseType: CaseType, difficulty: Difficulty, industry: string) => void;
}

const CASE_TYPES: Array<{
  type: CaseType;
  description: string;
}> = [
  {
    type: 'Profitability',
    description: 'Find why profit changed and how to fix it',
  },
  {
    type: 'Market entry',
    description: 'Decide whether the client should enter a new market',
  },
  {
    type: 'Market sizing',
    description: 'Estimate the size of a market from assumptions',
  },
];

export function CaseSetupScreen({ onStartCase }: CaseSetupScreenProps) {
  const [selectedType, setSelectedType] = useState<CaseType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Standard');
  const [industry, setIndustry] = useState<string>('Let CaseCoach choose');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    onStartCase(selectedType, difficulty, industry);
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
          Set up your practice case
        </h2>
        <p className="mt-2 text-base text-slate-600 leading-relaxed">
          Choose a case type to begin. CaseCoach acts as your interviewer and scores five core consulting skills at the end.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        {/* Case Type Selection */}
        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">
            Case type <span className="text-rose-600" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </legend>
          <p className="mt-1 text-sm text-slate-500">
            Select one case format to practise.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {CASE_TYPES.map((item) => {
              const isSelected = selectedType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSelectedType(item.type)}
                  aria-pressed={isSelected}
                  className={`group flex flex-col justify-between rounded-lg border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50/60 ring-1 ring-blue-700'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-display text-base font-semibold ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? 'border-blue-700 bg-blue-700 text-white'
                            : 'border-slate-300 bg-white text-transparent group-hover:border-slate-400'
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-sm leading-snug ${
                        isSelected ? 'text-blue-900/80' : 'text-slate-600'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="my-7 h-px bg-slate-200" />

        {/* Difficulty & Industry */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <span className="block text-sm font-semibold text-slate-900">
              Difficulty
            </span>
            <p className="mt-1 text-xs text-slate-500">
              Standard matches typical first-round undergraduate interviews.
            </p>
            <div
              className="mt-3 inline-flex w-full rounded-lg border border-slate-200 bg-slate-100 p-1"
              role="group"
              aria-label="Difficulty"
            >
              {(['Introductory', 'Standard'] as Difficulty[]).map((level) => {
                const active = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    aria-pressed={active}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="industry-select" className="block text-sm font-semibold text-slate-900">
              Industry
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Pick a sector or let CaseCoach assign one at random.
            </p>
            <select
              id="industry-select"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
            >
              <option value="Let CaseCoach choose">Let CaseCoach choose</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 flex flex-col items-start gap-3">
          <button
            type="submit"
            disabled={!selectedType}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <span>Start case</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-xs text-slate-500">
            Practice feedback only. Cases are fictional. Nothing you type is stored by CaseCoach.
          </p>
        </div>
      </form>
    </main>
  );
}
