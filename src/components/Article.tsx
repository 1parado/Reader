"use client";

import React, { useState, useEffect } from 'react';
import { Section } from '@/lib/file-parser';
import { useReadingTracker } from '@/hooks/useReadingTracker';
import { QuizPopup } from './QuizPopup';
import { AIConfig, AIProvider } from './FileUpload';

// Default configurations
const DEFAULT_OPENAI_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OLLAMA_URL = "http://localhost:11434/v1";
const DEFAULT_OLLAMA_MODEL = "llama3.2";

interface ArticleProps {
  data: Section[];
  onBack?: () => void;
  aiConfig?: AIConfig;
}

export const Article: React.FC<ArticleProps> = ({ data, onBack, aiConfig: initialAiConfig }) => {
  const { stats, activeSectionIds } = useReadingTracker(data);
  
  const [generatedQuizzes, setGeneratedQuizzes] = useState<Set<string>>(new Set());
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quizCount, setQuizCount] = useState(0);
  const [isDoNotDisturb, setIsDoNotDisturb] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // AI Configuration state (editable in sidebar)
  const [provider, setProvider] = useState<AIProvider>(initialAiConfig?.provider || 'openai');
  const [apiKey, setApiKey] = useState(initialAiConfig?.apiKey || '');
  const [apiUrl, setApiUrl] = useState(initialAiConfig?.apiUrl || DEFAULT_OPENAI_URL);
  const [model, setModel] = useState(initialAiConfig?.model || DEFAULT_OPENAI_MODEL);

  // Handle provider switch
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    if (newProvider === 'ollama') {
      setApiUrl(DEFAULT_OLLAMA_URL);
      setModel(DEFAULT_OLLAMA_MODEL);
      setApiKey('');
    } else {
      setApiUrl(DEFAULT_OPENAI_URL);
      setModel(DEFAULT_OPENAI_MODEL);
    }
  };

  // Monitor for stuck sections
  useEffect(() => {
    if (currentQuiz || isLoading || quizCount >= 3 || isDoNotDisturb) return;

    for (const sectionId in stats) {
      const stat = stats[sectionId];
      if (stat.isStuck && !generatedQuizzes.has(sectionId)) {
        triggerQuiz(sectionId);
        break; // Only handle one at a time
      }
    }
  }, [stats, currentQuiz, isLoading, quizCount, generatedQuizzes, isDoNotDisturb]);

  const triggerQuiz = async (sectionId: string) => {
    setIsLoading(true);
    // Mark as generated immediately to prevent double firing
    setGeneratedQuizzes(prev => new Set(prev).add(sectionId));
    
    try {
      const section = data.find(s => s.id === sectionId);
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      // Add AI provider configuration headers
      headers['x-ai-provider'] = provider;
      headers['x-ai-model'] = model;
      if (apiKey) headers['x-openai-key'] = apiKey;
      if (apiUrl) headers['x-openai-url'] = apiUrl;

      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          text: section?.content, 
          sectionId 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to fetch quiz');
      
      const quizData = await res.json();
      setCurrentQuiz(quizData);
      setQuizCount(prev => prev + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizClose = () => {
    setCurrentQuiz(null);
  };

  const handleQuizComplete = (success: boolean) => {
    // Could track score here
    // setTimeout(() => setCurrentQuiz(null), 2000); // Close after delay? 
    // UX says: "Encourage if correct, provide scaffold if wrong". Popup handles this.
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* DND Toggle & Sidebar Toggle */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={() => setIsDoNotDisturb(!isDoNotDisturb)}
          className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-colors lg:hidden ${
            isDoNotDisturb ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}
        >
          {isDoNotDisturb ? '🔕 DND' : '🔔 AI'}
        </button>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="px-4 py-2 rounded-full text-sm font-bold shadow-lg bg-white text-gray-700 border border-gray-200"
        >
          {isSidebarOpen ? 'Hide Stats' : 'Show Stats'}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto p-8 bg-white shadow-sm my-8">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-4">
             {onBack && (
               <button 
                 onClick={onBack}
                 className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
               >
                 ← Back
               </button>
             )}
             <h1 className="text-4xl font-bold text-gray-900">Socratic Reader</h1>
           </div>
           <div className="hidden lg:block">
              <button 
                onClick={() => setIsDoNotDisturb(!isDoNotDisturb)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  isDoNotDisturb 
                    ? 'bg-red-100 text-red-700 border-red-200' 
                    : 'bg-green-100 text-green-700 border-green-200'
                }`}
              >
                {isDoNotDisturb ? 'Do Not Disturb' : 'AI Active'}
              </button>
           </div>
        </div>
        
        <div className="space-y-12">
          {data.map((section) => (
            <section 
              key={section.id} 
              id={section.id}
              className={`p-6 rounded-lg transition-all duration-500 ${
                activeSectionIds.has(section.id) ? 'bg-blue-50/50' : 'bg-transparent'
              } ${
                stats[section.id]?.isStuck 
                  ? 'border-l-4 border-orange-400 pl-5' 
                  : 'border-l-4 border-transparent'
              }`}
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{section.title}</h2>
              <p className="text-lg leading-relaxed text-gray-700">
                {section.content}
              </p>
              
              {/* Debug info */}
              <div className="mt-4 flex gap-4 text-xs text-gray-400 opacity-50 hover:opacity-100 transition-opacity">
                 <span>⏱ {stats[section.id]?.timeSpent || 0}s</span>
                 <span>Limit: {Math.round(stats[section.id]?.threshold || 0)}s</span>
                 {stats[section.id]?.isStuck && (
                  <span className="text-orange-500 font-bold">Detected Struggle</span>
                 )}
                 {generatedQuizzes.has(section.id) && (
                  <span className="text-green-500 font-bold">✓ Quizzed</span>
                 )}
              </div>
            </section>
          ))}
        </div>
        
        <div className="h-96 flex items-center justify-center text-gray-400 text-sm">
          Scroll up and linger on a paragraph to trigger the Socratic AI.
        </div>
      </main>

      {/* Sidebar / Debug Panel */}
      <aside 
        className={`fixed right-0 top-0 bottom-0 bg-gray-100 border-l border-gray-200 p-4 overflow-y-auto z-40 transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } w-80`}
      >
        <button 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
            ✕
        </button>
        <h3 className="font-bold text-lg mb-4 text-gray-800 mt-8 xl:mt-0">System State</h3>
        <div className="mb-4 p-3 bg-white rounded shadow-sm text-sm space-y-2">
          <div>Quizzes Triggered: {quizCount}/3</div>
          <div>Status: {isLoading ? 'Generating Question...' : 'Idle'}</div>
          <div>Mode: {isDoNotDisturb ? 'Silent' : 'Active'}</div>
        </div>

        <h3 className="font-bold text-lg mb-4 text-gray-800">AI Configuration</h3>
        <div className="mb-4 p-3 bg-white rounded shadow-sm text-sm space-y-3">
            {/* Provider Selection */}
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">AI Provider</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleProviderChange('openai')}
                    className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                      provider === 'openai'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    ☁️ OpenAI
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderChange('ollama')}
                    className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                      provider === 'ollama'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🏠 Ollama
                  </button>
                </div>
            </div>
            
            {provider === 'openai' && (
              <>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">API Key</label>
                    <input 
                        type="password" 
                        placeholder="sk-..." 
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Base URL</label>
                    <input 
                        type="text" 
                        placeholder={DEFAULT_OPENAI_URL} 
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Model</label>
                    <input 
                        type="text" 
                        placeholder={DEFAULT_OPENAI_MODEL} 
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                </div>
              </>
            )}
            
            {provider === 'ollama' && (
              <>
                <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                  🏠 Local mode - data stays on your machine
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Ollama URL</label>
                    <input 
                        type="text" 
                        placeholder={DEFAULT_OLLAMA_URL} 
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Model</label>
                    <input 
                        type="text" 
                        placeholder={DEFAULT_OLLAMA_MODEL} 
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                </div>
              </>
            )}
        </div>

        <h3 className="font-bold text-lg mb-4 text-gray-800">Section Metrics</h3>
        <div className="space-y-4">
          {Object.values(stats).map((stat) => (
            <div key={stat.id} className="bg-white p-3 rounded shadow-sm text-sm">
              <div className="font-medium text-gray-900 mb-1 flex justify-between">
                {stat.id}
                {generatedQuizzes.has(stat.id) && <span>✅</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-600 mb-2">
                <div>Time: {stat.timeSpent}s</div>
                <div>Stuck: {stat.isStuck ? 'YES' : 'No'}</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                    stat.isStuck ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, (stat.timeSpent / stat.threshold) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Quiz Popup */}
      {currentQuiz && (
        <QuizPopup 
          data={currentQuiz} 
          onClose={handleQuizClose}
          onComplete={handleQuizComplete}
        />
      )}
      
      {/* Loading Indicator (Toast style) */}
      {isLoading && (
        <div className="fixed bottom-8 right-8 bg-white px-6 py-3 rounded-full shadow-lg border border-blue-100 flex items-center gap-3 animate-pulse">
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
           <span className="text-sm font-medium text-gray-600">Socratic AI is thinking...</span>
        </div>
      )}
    </div>
  );
};
