import React, { useState, useEffect, useRef } from 'react';
import { textToSpeech } from '../services/elevenlabs';

interface ReadProps {
  isActive: boolean;
}

const Read: React.FC<ReadProps> = ({ isActive }) => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Listen for selected text events from PDFViewer
  useEffect(() => {
    const handleTextSelection = (event: CustomEvent<string>) => {
      setSelectedText(event.detail);
      // Stop any currently playing audio when new text is selected
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('pdf-text-selected', handleTextSelection as EventListener);
    return () => {
      window.removeEventListener('pdf-text-selected', handleTextSelection as EventListener);
    };
  }, []);

  const handleRead = async () => {
    if (!selectedText) {
      setError('Please select some text from the PDF first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const audioData = await textToSpeech(selectedText);
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Text-to-speech error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert text to speech. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Read Selection</h2>
      
      {/* Audio controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleRead}
          disabled={loading || !selectedText}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Converting...</span>
            </div>
          ) : (
            'Read'
          )}
        </button>
        {audioRef.current && (
          <>
            <button
              onClick={handlePlayPause}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          </>
        )}
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

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
};

export default Read; 