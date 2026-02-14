"use client";

import React, { useState, useEffect } from 'react';
import { Article } from '@/components/Article';
import { FileUpload } from '@/components/FileUpload';
import { Section } from '@/lib/file-parser';
import { articleData as defaultData } from '@/lib/data';
import { AIConfig } from '@/components/FileUpload';

interface DocumentSummary {
  id: string;
  title: string;
  createdAt: string;
  _count: { sections: number };
}

export default function Home() {
  const [data, setData] = useState<Section[] | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig | undefined>(undefined);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const docs = await res.json();
        setDocuments(docs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLoadDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      if (res.ok) {
        const doc = await res.json();
        setData(doc.sections);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDataLoaded = (sections: Section[], config?: AIConfig) => {
    setData(sections);
    if (config) {
      setAiConfig(config);
    }
    fetchDocuments(); // Refresh list after upload
  };

  const handleUseDemo = () => {
    setData(defaultData);
  };

  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      {!data ? (
        <div className="flex flex-col items-center">
          <FileUpload onDataLoaded={handleDataLoaded} />
          
          <div className="mt-8 text-center">
            <p className="text-gray-500 mb-2">Or just want to see how it works?</p>
            <button 
              onClick={handleUseDemo}
              className="px-6 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm font-medium"
            >
              Load Demo Article
            </button>
          </div>

          {documents.length > 0 && (
            <div className="mt-12 w-full max-w-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">History</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => handleLoadDocument(doc.id)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 truncate max-w-[300px]">{doc.title}</h3>
                      <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-sm text-gray-400">
                      {doc._count.sections} sections
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Article 
          data={data} 
          onBack={() => setData(null)} 
          aiConfig={aiConfig}
        />
      )}
    </div>
  );
}
