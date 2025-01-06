import React, { useState, useEffect } from 'react';
import { generateSummary } from '../services/OpenAIService';

interface DocumentSummaryProps {
  threadId: string | null;
  assistantId: string | null;
}

const DocumentSummary: React.FC<DocumentSummaryProps> = ({ threadId, assistantId }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSummary = async () => {
      if (!threadId || !assistantId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await generateSummary(threadId, assistantId);
        setSummary(result);
      } catch (err) {
        setError('Failed to generate summary. Please try again.');
        console.error('Summary generation error:', err);
      } finally {
        setLoading(false);
      }
    };

    getSummary();
  }, [threadId, assistantId]);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Document Summary</h2>
      <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
    </div>
  );
};

export default DocumentSummary; 