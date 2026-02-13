import React from 'react';
import { ProcessedResult } from '../types';
import { formatBytes } from '../services/imageUtils';

interface ResultsViewProps {
  results: ProcessedResult[];
  onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ results, onReset }) => {
  const downloadCSV = () => {
    if (results.length === 0) return;

    const headers = ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial', 'Mature', 'Illustration'];
    const escape = (text: string) => `"${String(text).replace(/"/g, '""')}"`;

    const rows = results.map(r => [
      r.filename,
      r.description,
      r.keywords,
      r.categories,
      r.editorial,
      r.mature_content,
      r.illustration
    ].map(escape).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stock_metadata_optimized.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const totalSaved = results.reduce((acc, curr) => acc + ((curr.originalSize || 0) - (curr.compressedSize || 0)), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Processing Complete</h2>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {successCount}/{results.length} Successful
          </span>
        </div>

        {totalSaved > 0 && (
           <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
             <div className="text-blue-500 mt-1">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
             </div>
             <div>
               <h4 className="text-sm font-semibold text-blue-900">Bandwidth Optimized</h4>
               <p className="text-sm text-blue-700">
                 Resizing images to 1MP saved approximately <span className="font-bold">{formatBytes(totalSaved)}</span> of upload bandwidth.
               </p>
             </div>
           </div>
        )}

        <div className="max-h-96 overflow-y-auto border rounded-lg bg-gray-50">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compression</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-[200px]" title={result.filename}>
                    {result.filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {result.originalSize ? (
                      <div className="flex flex-col">
                        <span className="line-through">{formatBytes(result.originalSize)}</span>
                        <span className="text-green-600 font-semibold">{formatBytes(result.compressedSize || 0)}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {result.status === 'success' ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Done
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1" title={result.error}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={downloadCSV}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </button>
          <button
            onClick={onReset}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
};