import React, { useState, useEffect } from 'react';

interface PageNotesProps {
  currentPage: number;
}

interface Note {
  id: string;
  text: string;
  timestamp: number;
}

const PageNotes: React.FC<PageNotesProps> = ({ currentPage }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');

  // Load notes for current page from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`pdf-notes-page-${currentPage}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      setNotes([]);
    }
  }, [currentPage]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`pdf-notes-page-${currentPage}`, JSON.stringify(notes));
  }, [notes, currentPage]);

  const addNote = () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      text: newNote.trim(),
      timestamp: Date.now(),
    };

    setNotes(prev => [...prev, note]);
    setNewNote('');
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Page {currentPage} Notes</h2>
      
      <div className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a new note..."
          className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <button
          onClick={addNote}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add Note
        </button>
      </div>

      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-3 bg-gray-50 rounded-lg relative group"
          >
            <p className="text-gray-700 whitespace-pre-wrap">{note.text}</p>
            <div className="text-xs text-gray-500 mt-2">
              {new Date(note.timestamp).toLocaleString()}
            </div>
            <button
              onClick={() => deleteNote(note.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <p className="text-gray-500 text-center">No notes for this page yet.</p>
      )}
    </div>
  );
};

export default PageNotes; 