import React, { useState, useEffect } from 'react';
import { chatWithAI } from '../services/OpenAIService';

interface ExplainProps {
  threadId: string | null;
  assistantId: string | null;
  isActive: boolean;
}

const Explain: React.FC<ExplainProps> = ({ threadId, assistantId, isActive }) => {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('explain this to me as if i were 12 years old');
  const [selectedText, setSelectedText] = useState<string>('');

  // Load saved prompt from localStorage
  useEffect(() => {
    const savedPrompt = localStorage.getItem('explainPrompt');
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);

  // Listen for selected text events from PDFViewer
  useEffect(() => {
    const handleTextSelection = (event: CustomEvent<string>) => {
      console.log('Selected text:', event.detail);
      setSelectedText(event.detail);
    };

    window.addEventListener('pdf-text-selected', handleTextSelection as EventListener);
    return () => {
      window.removeEventListener('pdf-text-selected', handleTextSelection as EventListener);
    };
  }, []);

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    localStorage.setItem('explainPrompt', newPrompt);
  };

  const handleExplain = async () => {
    if (!selectedText || !threadId || !assistantId) {
      setError('Please select some text from the PDF first.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending to OpenAI:', `${prompt}:\n\n${selectedText}`);
      const result = await chatWithAI(
        threadId,
        assistantId,
        `Please focus only on explaining this specific text: "${selectedText}". ${prompt}`
      );
      
      if (!result) {
        throw new Error('No explanation was generated');
      }
      
      setExplanation(result);
    } catch (err) {
      console.error('Explanation generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Explain Selection</h2>
      
      {/* Prompt input and explain button */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={prompt}
          onChange={handlePromptChange}
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your explanation prompt..."
          disabled={loading}
        />
        <button
          onClick={handleExplain}
          disabled={loading || !selectedText}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Working...</span>
            </div>
          ) : (
            'Explain'
          )}
        </button>
      </div>

      {/* Selected text display */}
      {selectedText && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Selected Text:</h3>
          <p className="text-gray-700">{selectedText}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="prose prose-sm max-w-none">
          <h3 className="text-lg font-semibold mb-2">Explanation:</h3>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explain; 