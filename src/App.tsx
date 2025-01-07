import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PDFViewer from './components/PDFViewer';
import DocumentSummary from './components/DocumentSummary';
import Keywords from './components/Keywords';
import PageNotes from './components/PageNotes';
import DocumentChat from './components/DocumentChat';
import MindMap from './components/MindMap';
import Explain from './components/Explain';
import Read from './components/Read';
import { initializeAssistant } from './services/openai';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat' | 'mindmap' | 'notes' | 'explain' | 'read'>('summary');
  const [isInitialized, setIsInitialized] = useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const { assistantId: newAssistantId, threadId: newThreadId, vectorStoreId: newVectorStoreId } = 
        await initializeAssistant(file);
      setAssistantId(newAssistantId);
      setThreadId(newThreadId);
      setVectorStoreId(newVectorStoreId);

      const fileUrl = URL.createObjectURL(file);
      setPdfDocument(fileUrl);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cache the components that don't need to be re-rendered
  const summarySection = useMemo(() => (
    <div className="space-y-4">
      {isInitialized && threadId && assistantId && (
        <>
          <DocumentSummary 
            threadId={threadId} 
            assistantId={assistantId} 
            isActive={activeTab === 'summary'} 
          />
          <Keywords 
            threadId={threadId} 
            assistantId={assistantId} 
            isActive={activeTab === 'summary'} 
          />
        </>
      )}
    </div>
  ), [threadId, assistantId, activeTab, isInitialized]);

  useEffect(() => {
    if (threadId && assistantId && !isInitialized) {
      setIsInitialized(true);
    }
  }, [threadId, assistantId]);

  const mindMapSection = useMemo(() => (
    <MindMap 
      threadId={threadId} 
      assistantId={assistantId} 
      isActive={activeTab === 'mindmap'} 
    />
  ), [threadId, assistantId, activeTab]);

  const chatSection = useMemo(() => (
    <DocumentChat 
      threadId={threadId} 
      assistantId={assistantId} 
      isActive={activeTab === 'chat'} 
    />
  ), [threadId, assistantId, activeTab]);

  const explainSection = useMemo(() => (
    <Explain 
      threadId={threadId} 
      assistantId={assistantId} 
      isActive={activeTab === 'explain'} 
    />
  ), [threadId, assistantId, activeTab]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {!pdfDocument ? (
        <div className="flex items-center justify-center h-screen">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h1 className="text-2xl font-bold mb-4">PDF Reader with AI</h1>
            <label className="block">
              <span className="sr-only">Choose PDF file</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={loading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </label>
            {loading && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Initializing AI assistant...</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-screen gap-4">
          <div className="w-2/3 flex flex-col gap-4">
            <PDFViewer 
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              setTotalPages={setTotalPages}
              pdfDocument={pdfDocument}
            />
          </div>
          
          <div className="w-1/3 flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'summary'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('explain')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'explain'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Explain
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'chat'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('mindmap')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'mindmap'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Mind Map
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'notes'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setActiveTab('read')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'read'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Read
                </button>
              </div>

              {/* Use cached components */}
              <div className={activeTab === 'summary' ? 'block' : 'hidden'}>
                {summarySection}
              </div>
              <div className={activeTab === 'explain' ? 'block' : 'hidden'}>
                {explainSection}
              </div>
              <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
                {chatSection}
              </div>
              <div className={activeTab === 'mindmap' ? 'block' : 'hidden'}>
                {mindMapSection}
              </div>
              <div className={activeTab === 'notes' ? 'block' : 'hidden'}>
                <PageNotes threadId={threadId} />
              </div>
              {activeTab === 'read' && (
                <Read isActive={activeTab === 'read'} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
