import React, { useState } from 'react';

interface QuizData {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

interface QuizPopupProps {
  data: QuizData;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export const QuizPopup: React.FC<QuizPopupProps> = ({ data, onClose, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    onComplete(selectedOption === data.correctOptionIndex);
  };

  const isCorrect = selectedOption === data.correctOptionIndex;

  return (
    <div className="fixed bottom-8 right-8 w-96 bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden animate-slide-up z-50">
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <span>🧠</span> Knowledge Check
        </h3>
        <button onClick={onClose} className="hover:bg-blue-700 rounded p-1">✕</button>
      </div>
      
      <div className="p-6">
        <p className="text-gray-800 font-medium mb-4">{data.question}</p>
        
        <div className="space-y-2 mb-4">
          {data.options.map((option, idx) => (
            <button
              key={idx}
              disabled={isSubmitted}
              onClick={() => setSelectedOption(idx)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedOption === idx 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:bg-gray-50'
              } ${
                isSubmitted && idx === data.correctOptionIndex 
                  ? 'border-green-500 bg-green-50' 
                  : ''
              } ${
                isSubmitted && selectedOption === idx && idx !== data.correctOptionIndex 
                  ? 'border-red-500 bg-red-50' 
                  : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Check Answer
          </button>
        ) : (
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="font-bold mb-1">{isCorrect ? 'Correct!' : 'Not quite.'}</p>
            <p className="text-sm">{data.explanation}</p>
            <button 
              onClick={onClose}
              className="mt-3 text-sm underline opacity-80 hover:opacity-100"
            >
              Continue Reading
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
