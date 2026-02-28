import React from 'react';

interface HandbookTableProps {
  headers: string[];
  rows: (string[])[];
}

const HandbookTable: React.FC<HandbookTableProps> = ({ headers, rows }) => (
  <div className="overflow-x-auto my-4">
    <table className="min-w-full border border-gray-200 rounded-lg">
      <thead>
        <tr className="bg-gray-100">
          {headers.map((header, idx) => (
            <th key={idx} className="px-4 py-2 text-left font-semibold border-b border-gray-200">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rIdx) => (
          <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            {row.map((cell, cIdx) => (
              <td key={cIdx} className="px-4 py-2 border-b border-gray-100">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default HandbookTable; 