import React from 'react';

interface FormTableProps {
  headers: string[];
  rows: string[][];
  userValues: Record<string, string>;
  onCellChange: (cellKey: string, value: string) => void;
}

export const FormTable: React.FC<FormTableProps> = ({
  headers,
  rows,
  userValues,
  onCellChange,
}) => {
  return (
    <div className="overflow-x-auto w-full rounded-lg border border-slate-700/80">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider">
          <tr>
            {headers.map((h, idx) => (
              <th key={idx} className="px-3 py-2 border-b border-slate-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-200">
          {rows.map((r, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-800/40">
              {r.map((c, cIdx) => {
                const isBlank = c.includes('___') || c.trim() === '';
                const cellKey = `r${rIdx}_c${cIdx}`;

                return (
                  <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                    {isBlank ? (
                      <input
                        type="text"
                        value={userValues[cellKey] || ''}
                        onChange={(e) => onCellChange(cellKey, e.target.value)}
                        placeholder="..."
                        className="px-2 py-0.5 text-xs bg-slate-900 border border-slate-700 rounded text-sky-300 outline-none focus:border-sky-500 w-24"
                      />
                    ) : (
                      <span>{c}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
