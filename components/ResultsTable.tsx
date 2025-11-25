import React from 'react';
import { AnalysisResult, AnalysisStatus, GroundingChunk } from '../types';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from './Icons';

interface ResultsTableProps {
  results: AnalysisResult[];
  sources: GroundingChunk[];
}

const StatusBadge: React.FC<{ status: AnalysisStatus }> = ({ status }) => {
  switch (status) {
    case AnalysisStatus.SAME:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          Same
        </span>
      );
    case AnalysisStatus.DIFFERENT:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          Different
        </span>
      );
    case AnalysisStatus.ERROR:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          Error
        </span>
      );
    default:
      return null;
  }
};

const ResultsTable: React.FC<ResultsTableProps> = ({ results, sources }) => {
    const uniqueSources = Array.from(new Set(sources.map(s => s.web?.uri).filter(Boolean)));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center justify-between mb-4">
             <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>
        </div>
        <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">
                  Original
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">
                  Duplicate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Correct Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => {
                  const normalize = (s?: string) => s?.trim().toLowerCase() || "";
                  const correct = normalize(result.correctName);
                  const original = normalize(result.Original);
                  const duplicate = normalize(result.Duplicates);

                  // Compare normalized strings
                  const isOriginalCorrect = correct && original === correct;
                  const isDuplicateCorrect = correct && duplicate === correct;
                  
                  // Only show text in "Correct Name" column if neither original nor duplicate is correct
                  // AND we actually have a correct name returned.
                  const showCorrectNameColumn = result.correctName && !isOriginalCorrect && !isDuplicateCorrect;

                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOriginalCorrect ? 'bg-green-100 text-green-900 font-bold' : 'text-gray-900'}`}>
                        <div className="flex items-center justify-between">
                            {result.Original}
                            {isOriginalCorrect && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDuplicateCorrect ? 'bg-green-100 text-green-900 font-bold' : 'text-gray-500'}`}>
                        <div className="flex items-center justify-between">
                            {result.Duplicates}
                            {isDuplicateCorrect && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">
                        {showCorrectNameColumn ? result.correctName : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <StatusBadge status={result.status} />
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {uniqueSources.length > 0 && (
         <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Verified Sources
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <ul className="space-y-2">
                    {uniqueSources.map((url, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-gray-400 mt-1">•</span>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline break-all">
                                {url}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;