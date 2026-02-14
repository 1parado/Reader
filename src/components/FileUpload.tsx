"use client";

import React, { useState, useRef } from 'react';
import { Section } from '@/lib/file-parser';

// AI provider types
export type AIProvider = 'openai' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  apiUrl: string;
  model: string;
}

// Default configurations
const DEFAULT_OPENAI_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OLLAMA_URL = "http://localhost:11434/v1";
const DEFAULT_OLLAMA_MODEL = "llama3.2";

interface FileUploadProps {
  onDataLoaded: (sections: Section[], config?: AIConfig) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState(DEFAULT_OPENAI_URL);
  const [model, setModel] = useState(DEFAULT_OPENAI_MODEL);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle provider switch
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    if (newProvider === 'ollama') {
      setApiUrl(DEFAULT_OLLAMA_URL);
      setModel(DEFAULT_OLLAMA_MODEL);
      setApiKey(''); // Ollama doesn't need API key
    } else {
      setApiUrl(DEFAULT_OPENAI_URL);
      setModel(DEFAULT_OPENAI_MODEL);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // Pass AI config to parent
      const aiConfig: AIConfig = {
        provider,
        apiKey,
        apiUrl,
        model,
      };
      onDataLoaded(data.sections, aiConfig);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Socratic Reader</h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Upload a document to start reading. The AI will track your reading pace and challenge your understanding when you get stuck.
        </p>
      </div>

      {/* AI Provider Selection */}
      <div className="w-full max-w-xl mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleProviderChange('openai')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium ${
              provider === 'openai'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            ☁️ OpenAI / Custom API
          </button>
          <button
            type="button"
            onClick={() => handleProviderChange('ollama')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium ${
              provider === 'ollama'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            🏠 Local Ollama
          </button>
        </div>
      </div>

      {/* Configuration based on provider */}
      <div className="w-full max-w-xl mb-6 space-y-4">
        {provider === 'openai' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Your API key is stored locally and never sent to our servers.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder={DEFAULT_OPENAI_URL}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Custom URL for OpenAI-compatible APIs (e.g., Azure, Groq, etc.)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={DEFAULT_OPENAI_MODEL}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {provider === 'ollama' && (
          <>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                🏠 <strong>Local Mode:</strong> Your documents stay on your machine. No data is sent to external servers.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ollama URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder={DEFAULT_OLLAMA_URL}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Default: {DEFAULT_OLLAMA_URL}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={DEFAULT_OLLAMA_MODEL}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Make sure you have pulled the model: <code className="bg-gray-100 px-1 rounded">ollama pull {model || DEFAULT_OLLAMA_MODEL}</code></p>
            </div>
          </>
        )}
      </div>

      <div
        className={`w-full max-w-xl p-12 border-2 border-dashed rounded-xl transition-colors cursor-pointer text-center ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.docx,.html,.md,.txt"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Processing document...</p>
          </div>
        ) : (
          <>
            <div className="text-6xl mb-4">📄</div>
            <p className="text-xl font-medium text-gray-700 mb-2">
              Drop your file here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, Word, HTML, Markdown
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg max-w-xl w-full text-center">
          {error}
        </div>
      )}
    </div>
  );
};
