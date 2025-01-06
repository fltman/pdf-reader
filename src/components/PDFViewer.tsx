import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';

interface PDFViewerProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (pages: number) => void;
  pdfDocument: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  currentPage,
  setCurrentPage,
  totalPages,
  setTotalPages,
  pdfDocument,
}) => {
  const [pageWidth, setPageWidth] = useState<number>(800);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update page width based on container size
    const updateWidth = () => {
      const container = document.querySelector('.pdf-container');
      if (container) {
        setPageWidth(container.clientWidth - 32); // 32px for padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handlePageChange = (offset: number) => {
    const newPage = currentPage + offset;
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pdf-container">
        {error ? (
          <div className="flex justify-center items-center h-full text-red-500">
            {error}
          </div>
        ) : (
          <Document
            file={pdfDocument}
            onLoadSuccess={({ numPages }) => {
              setTotalPages(numPages);
              setLoading(false);
              setError(null);
            }}
            onLoadError={(error) => {
              console.error('Error loading PDF:', error);
              setLoading(false);
              setError('Error loading PDF. Please try again.');
            }}
            loading={
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
            className="flex justify-center"
          >
            <Page 
              pageNumber={currentPage} 
              width={pageWidth}
              className="shadow-lg"
              loading={
                <div className="flex justify-center items-center h-[800px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              }
              error={
                <div className="flex justify-center items-center h-[800px] text-red-500">
                  Error loading page. Please try again.
                </div>
              }
            />
          </Document>
        )}
      </div>
      <div className="flex justify-between items-center mt-4 px-4">
        <button
          onClick={() => handlePageChange(-1)}
          disabled={currentPage <= 1 || loading}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaArrowLeft />
        </button>
        <span className="text-gray-700">
          {loading ? 'Loading...' : `Page ${currentPage} of ${totalPages}`}
        </span>
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage >= totalPages || loading}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
};

export default PDFViewer; 