import React, { useState, useCallback, useRef } from 'react';
import FileUpload from './components/FileUpload';
import ResultsTable from './components/ResultsTable';
import Spinner from './components/Spinner';
import { SparklesIcon, ExclamationTriangleIcon } from './components/Icons';
import { parseExcelFile } from './utils/excelParser';
import { analyzeNames } from './services/geminiService';
import { RowData, AnalysisResult, AnalysisStatus, GroundingChunk } from './types';

declare const XLSX: any;

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<RowData[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<boolean>(false);

  const resetState = () => {
    setFile(null);
    setData([]);
    setResults([]);
    setSources([]);
    setIsLoading(false);
    setProgress({ current: 0, total: 0 });
    setError(null);
    abortControllerRef.current = true; // Signal to stop any ongoing loop
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    // Reset state but don't trigger abort yet as we are starting fresh
    setFile(selectedFile);
    setData([]);
    setResults([]);
    setSources([]);
    setIsLoading(false);
    setProgress({ current: 0, total: 0 });
    setError(null);
    
    try {
      const parsedData = await parseExcelFile(selectedFile);
      setData(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.');
    }
  }, []);
  
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleAnalyze = async () => {
    if (!data.length) return;

    setIsLoading(true);
    setError(null);
    setResults([]);
    setSources([]);
    setProgress({ current: 0, total: data.length });
    abortControllerRef.current = false;

    for (let i = 0; i < data.length; i++) {
      if (abortControllerRef.current) break;

      const row = data[i];
      let success = false;
      let retryCount = 0;
      let delay = 1000;

      // Strict loop: Wait for API response, do not skip on error.
      while (!success && !abortControllerRef.current) {
        try {
            const { result, correctName, sources: apiSources } = await analyzeNames(row.Original, row.Duplicates);
            
            const newResult: AnalysisResult = { 
                ...row, 
                status: result as AnalysisStatus, 
                correctName: correctName 
            };

            setResults(prev => [...prev, newResult]);
            
            if (apiSources && apiSources.length > 0) {
                setSources(prev => [...prev, ...apiSources]);
            }
            
            success = true;
            setError(null); // Clear any transient error message
        } catch (err) {
            console.error(`Error on row ${i + 1}, retrying...`, err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(`Row ${i+1}: ${errorMessage}. Retrying in ${delay/1000}s...`);
            
            // Wait with exponential backoff before retrying
            await sleep(delay);
            retryCount++;
            delay = Math.min(delay * 2, 30000); // Cap delay at 30 seconds
        }
      }

      setProgress({ current: i + 1, total: data.length });
      // Small buffer between successful requests
      await sleep(200); 
    }
    
    setIsLoading(false);
    if (!abortControllerRef.current) {
        setError(null); // Clear final status
    }
  };

  const handleExport = () => {
    if (results.length === 0) return;

    const exportData = results.map(r => {
      const normalize = (s?: string) => s?.trim().toLowerCase() || "";
      const correct = normalize(r.correctName);
      const original = normalize(r.Original);
      const duplicate = normalize(r.Duplicates);

      const isOriginalCorrect = correct && original === correct;
      const isDuplicateCorrect = correct && duplicate === correct;

      // Logic for the excel output to match UI logic
      let correctNameOutput = "";
      if (r.correctName && !isOriginalCorrect && !isDuplicateCorrect) {
          correctNameOutput = r.correctName;
      }
      
      return {
        Original: r.Original,
        Duplicates: r.Duplicates,
        "Correct Name Found": r.correctName || "", // Full data for reference
        "Correction Needed": correctNameOutput, // Empty if one of them is already correct
        "Match Status": r.status,
        "Is Original Correct": isOriginalCorrect ? "YES" : "NO",
        "Is Duplicate Correct": isDuplicateCorrect ? "YES" : "NO"
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analysis Results");
    XLSX.writeFile(wb, "personality_analysis_results.xlsx");
  };
  
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <SparklesIcon className="w-10 h-10 text-indigo-500" />
            Personality De-duplicator
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Leveraging Gemini Flash Lite and Google Search to intelligently verify and correct names.
          </p>
        </header>

        <main className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          {!file ? (
             <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
          ) : (
            <div className="mb-8">
               <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-gray-600">Selected file: <span className="font-semibold text-gray-900">{file.name}</span></p>
                    <p className="text-sm text-gray-500 mt-1">{data.length} rows found</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex gap-3">
                      {!isLoading && results.length === 0 && (
                          <button
                           onClick={handleAnalyze}
                           className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
                          >
                           Analyze File
                          </button>
                      )}
                       {(results.length > 0 || isLoading) && (
                           <>
                             <button
                               onClick={resetState}
                               className="px-4 py-2 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                             >
                               {isLoading ? "Stop & Reset" : "Start Over"}
                             </button>
                             {!isLoading && results.length > 0 && (
                               <button
                                 onClick={handleExport}
                                 className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 transition-colors flex items-center"
                               >
                                 Export Excel
                               </button>
                             )}
                           </>
                       )}
                  </div>
               </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center border border-yellow-200 animate-pulse">
              <ExclamationTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0"/>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="mb-8 p-6 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Spinner className="w-5 h-5 text-indigo-600"/>
                        <span className="font-semibold text-indigo-900">Processing...</span>
                    </div>
                    <span className="text-sm font-medium text-indigo-700">{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-2">
                    <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
          )}

          {results.length > 0 && <ResultsTable results={results} sources={sources} />}
        </main>
      </div>
    </div>
  );
};

export default App;