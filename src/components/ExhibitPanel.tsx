import { Table2 } from 'lucide-react';
import type { ExhibitItem } from '../types/case';

interface ExhibitPanelProps {
  exhibits: ExhibitItem[];
}

export function ExhibitPanel({ exhibits }: ExhibitPanelProps) {
  // Newest exhibit at the top
  const orderedExhibits = [...exhibits].sort((a, b) => b.number - a.number);

  return (
    <section
      aria-label="Case exhibits"
      className="flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">Exhibits</h2>
        </div>
        <span className="text-xs text-slate-500 tabular-nums">
          {exhibits.length === 0
            ? 'None yet'
            : `${exhibits.length} ${exhibits.length === 1 ? 'exhibit' : 'exhibits'}`}
        </span>
      </div>

      <div className="max-h-[340px] overflow-y-auto p-4 space-y-4">
        {orderedExhibits.length === 0 ? (
          <p className="py-4 text-center text-xs leading-relaxed text-slate-500">
            Data tables shared by CaseCoach during the interview will appear here automatically.
          </p>
        ) : (
          orderedExhibits.map((exhibit) => (
            <div
              key={exhibit.id}
              className="rounded-md border border-slate-200 bg-white overflow-hidden"
            >
              <div className="border-b border-slate-200 bg-slate-50/80 px-3 py-1.5">
                <h3 className="text-xs font-semibold text-slate-800">
                  Exhibit {exhibit.number}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/40">
                      {exhibit.headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-3 py-2 text-left font-semibold text-slate-900 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exhibit.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-3 py-2 text-slate-700 align-top"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
