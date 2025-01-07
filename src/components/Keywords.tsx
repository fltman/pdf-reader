import React, { useState, useEffect } from 'react';
import { extractKeywords, KeywordWithDefinition } from '../services/OpenAIService';

interface KeywordsProps {
  threadId: string | null;
  assistantId: string | null;
  isActive: boolean;
}

const Keywords: React.FC<KeywordsProps> = ({ threadId, assistantId, isActive }) => {
  const [keywords, setKeywords] = useState<KeywordWithDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    const getKeywords = async () => {
      if (!threadId || !assistantId || !isActive || hasGenerated) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await extractKeywords(threadId, assistantId);
        setKeywords(result);
        setHasGenerated(true);
      } catch (err) {
        setError('Failed to extract keywords. Please try again.');
        console.error('Keyword extraction error:', err);
      } finally {
        setLoading(false);
      }
    };

    getKeywords();
  }, [threadId, assistantId, isActive, hasGenerated]);

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
      <h2 className="text-xl font-bold mb-4">Keywords</h2>
      
      {/* Keywords pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {keywords.map((item, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {item.keyword}
          </span>
        ))}
      </div>

      {/* Definition list */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">Definitions</h3>
        <dl className="space-y-3">
          {keywords.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr,2fr] gap-4">
              <dt className="font-medium text-gray-900">{item.keyword}</dt>
              <dd className="text-gray-600">{item.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default Keywords; 