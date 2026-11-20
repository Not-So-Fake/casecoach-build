import { Eraser, NotebookPen } from 'lucide-react';

interface ScratchpadProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function Scratchpad({ value, onChange, onClear }: ScratchpadProps) {
  return (
    <section
      aria-label="Scratchpad"
      className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-white overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">Scratchpad</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={!value}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
        >
          <Eraser className="h-3 w-3" />
          <span>Clear</span>
        </button>
      </div>

      <div className="flex-1 p-3">
        <label htmlFor="case-scratchpad" className="sr-only">
          Scratchpad notes and calculations
        </label>
        <textarea
          id="case-scratchpad"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Jot down your structure, assumptions, and quick maths here. Saved in your browser."
          className="h-44 lg:h-full min-h-[160px] w-full resize-none rounded-md border border-slate-200 bg-slate-50/40 p-3 font-mono text-xs leading-relaxed text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:border-blue-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20"
        />
      </div>
    </section>
  );
}
