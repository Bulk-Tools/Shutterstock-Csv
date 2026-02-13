import React, { useState, useRef } from 'react';
import { ApiKeyInput } from './components/ApiKeyInput';
import { FileUploader } from './components/FileUploader';
import { ResultsView } from './components/ResultsView';
import { AppStep, FileWithId, ProcessedResult } from './types';
import { compressImageTo1MP } from './services/imageUtils';
import { generateMetadata } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.AUTH);
  const [apiKey, setApiKey] = useState('');
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  
  // To handle scrolling
  const listRef = useRef<HTMLDivElement>(null);

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    setStep(AppStep.UPLOAD);
  };

  const handleFilesSelected = (newFiles: File[]) => {
    const filesWithIds: FileWithId[] = newFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...filesWithIds]);
  };

  const removeFile = (id: string) => {
    if (processing) return;
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const startProcessing = async () => {
    if (files.length === 0) return;
    
    setProcessing(true);
    setResults([]);
    
    const tempResults: ProcessedResult[] = [];

    // Process sequentially to avoid rate limits on free tier, 
    // but the 1MP compression happens first.
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      
      // Update UI to show processing
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'processing' } : f
      ));
      
      try {
        // 1. Client-Side Optimization (1MP Resize)
        const { base64, originalSize, compressedSize } = await compressImageTo1MP(fileItem.file);
        
        // 2. AI Processing
        const metadata = await generateMetadata(apiKey, base64);
        
        // 3. Success
        tempResults.push({
          filename: fileItem.file.name,
          status: 'success',
          originalSize,
          compressedSize,
          ...metadata
        });

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'completed' } : f
        ));

      } catch (err: any) {
        // 4. Error Handling
        tempResults.push({
          filename: fileItem.file.name,
          status: 'error',
          error: err.message,
          description: '',
          keywords: '',
          categories: '',
          editorial: 'no',
          mature_content: 'no',
          illustration: 'no'
        });

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error' } : f
        ));
      }
    }

    setResults(tempResults);
    setProcessing(false);
    setStep(AppStep.RESULTS);
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setStep(AppStep.UPLOAD);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            StockMeta <span className="text-red-600">AI</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Generate Shutterstock metadata instantly using your own Gemini API key. 
            Includes <span className="font-semibold text-gray-700">smart 1MP compression</span> for lightning-fast processing.
          </p>
        </header>

        {/* Content Steps */}
        <main>
          {step === AppStep.AUTH && (
            <ApiKeyInput onSave={handleApiKeySave} />
          )}

          {step === AppStep.UPLOAD && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Upload Images</h2>
                <button 
                  onClick={() => setStep(AppStep.AUTH)} 
                  className="text-xs text-gray-400 hover:text-red-500 underline"
                  disabled={processing}
                >
                  Change API Key
                </button>
              </div>

              <FileUploader onFilesSelected={handleFilesSelected} />

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">{files.length} images selected</span>
                    {!processing && (
                      <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:text-red-700">
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div ref={listRef} className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                        <img 
                          src={file.previewUrl} 
                          alt="preview" 
                          className="w-12 h-12 rounded object-cover border border-gray-200" 
                        />
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            
                            {/* Status Indicators */}
                            {file.status === 'processing' && (
                              <span className="text-blue-600 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Optimizing & Analyzing...
                              </span>
                            )}
                            {file.status === 'completed' && <span className="text-green-600 font-medium">✓ Ready</span>}
                            {file.status === 'error' && <span className="text-red-500 font-medium">✕ Failed</span>}
                          </p>
                        </div>
                        
                        {!processing && (
                          <button 
                            onClick={() => removeFile(file.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={startProcessing}
                      disabled={processing || files.length === 0}
                      className={`w-full py-3 px-4 rounded-lg text-white font-bold shadow-md transition-all 
                        ${processing || files.length === 0 
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700 hover:shadow-lg transform active:scale-[0.99]'
                        }`}
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing Images...
                        </span>
                      ) : (
                        `Process ${files.length} Images`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === AppStep.RESULTS && (
            <ResultsView results={results} onReset={handleReset} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;