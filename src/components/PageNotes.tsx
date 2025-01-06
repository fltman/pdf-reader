import React, { useState, useEffect } from 'react';

interface PageNotesProps {
  threadId: string | null;
}

const PageNotes: React.FC<PageNotesProps> = ({ threadId }) => {
  const [notes, setNotes] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  useEffect(() => {
    if (threadId) {
      const savedNotes = JSON.parse(localStorage.getItem('pageNotes') || '{}');
      setNotes(savedNotes[threadId] || '');
    }
  }, [threadId]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setSaveStatus('unsaved');
  };

  const handleSave = () => {
    if (!threadId) return;
    
    setSaveStatus('saving');
    const savedNotes = JSON.parse(localStorage.getItem('pageNotes') || '{}');
    savedNotes[threadId] = notes;
    localStorage.setItem('pageNotes', JSON.stringify(savedNotes));
    
    setTimeout(() => {
      setSaveStatus('saved');
    }, 1000);
  };

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            saveStatus === 'saved'
              ? 'bg-green-500 text-white'
              : saveStatus === 'saving'
              ? 'bg-yellow-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {saveStatus === 'saved' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {saveStatus === 'saving' && (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Save'}
        </button>
      </div>
      <textarea
        value={notes}
        onChange={handleNotesChange}
        className="w-full h-[calc(100vh-200px)] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Add your notes here..."
      />
    </div>
  );
};

export default PageNotes; 