import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import * as pdfjsLib from 'pdfjs-dist';
import '../styles/pdf-viewer.css';
import '../lib/pdfjs-worker';

interface PDFViewerProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (pages: number) => void;
  pdfDocument: string | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  currentPage,
  setCurrentPage,
  totalPages,
  setTotalPages,
  pdfDocument,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const [scale, setScale] = useState(1.5);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let pdf: any = null;
    const loadPDF = async () => {
      if (!pdfDocument) return;
      
      try {
        setLoading(true);
        pdf = await pdfjsLib.getDocument(pdfDocument).promise;
        setPdfInstance(pdf);
        setTotalPages(pdf.numPages);
        setLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setLoading(false);
      }
    };

    loadPDF();
    return () => {
      if (pdf) {
        pdf.destroy();
      }
    };
  }, [pdfDocument, setTotalPages]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfInstance || !canvasRef.current || !textLayerRef.current || !containerRef.current) return;

      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        await renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        setLoading(true);
        const page = await pdfInstance.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // Store the render task reference
        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;

        // Clear and set up text layer
        const textLayer = textLayerRef.current;
        textLayer.innerHTML = '';
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;
        textLayer.style.transform = '';
        textLayer.style.transformOrigin = '';

        // Add text layer for selection
        const textContent = await page.getTextContent();
        const textItems = textContent.items as any[];
        
        // Sort text items by their vertical position first, then horizontal
        textItems.sort((a, b) => {
          const yDiff = Math.abs(a.transform[5] - b.transform[5]);
          if (yDiff > 1) {
            return b.transform[5] - a.transform[5];
          }
          return a.transform[4] - b.transform[4];
        });

        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();

        textItems.forEach((item) => {
          if (!item.str.trim()) return; // Skip empty strings

          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const div = document.createElement('div');
          
          div.textContent = item.str;
          
          // Calculate position and size
          const fontSize = Math.sqrt((tx[0] * tx[0]) + (tx[1] * tx[1]));
          const rotation = Math.atan2(tx[1], tx[0]);
          
          // Apply styles with position offset adjustments
          Object.assign(div.style, {
            left: `${tx[4] - 28}px`,  // Slight left offset
            top: `${tx[5] - 13}px`,   // Slight upward offset
            fontSize: `${fontSize}px`,
            fontFamily: item.fontName || 'sans-serif',
            transform: `rotate(${rotation}rad)`,
            position: 'absolute',
            transformOrigin: 'left bottom',
            cursor: 'text',
            color: 'transparent',
            userSelect: 'text',
            whiteSpace: 'pre',
            pointerEvents: 'all',
            padding: '0',
            margin: '0'
          });

          div.dataset.isSelectable = 'true';
          fragment.appendChild(div);
        });

        textLayer.appendChild(fragment);

        // Ensure text layer is properly positioned
        const canvasBox = canvas.getBoundingClientRect();
        textLayer.style.left = `${canvasBox.left}px`;
        textLayer.style.top = `${canvasBox.top}px`;

        setLoading(false);
      } catch (error: any) {
        if (error?.name !== 'RenderingCancelled') {
          console.error('Error rendering page:', error);
        }
        setLoading(false);
      }
    };

    renderPage();

    // Add window resize handler to maintain alignment
    const handleResize = () => {
      if (canvasRef.current && textLayerRef.current) {
        const canvasBox = canvasRef.current.getBoundingClientRect();
        textLayerRef.current.style.left = `${canvasBox.left}px`;
        textLayerRef.current.style.top = `${canvasBox.top}px`;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [currentPage, pdfInstance, scale]);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection) return;

      // Check if the selection is within the text layer
      const textLayer = textLayerRef.current;
      if (!textLayer) return;

      let selectedText = '';
      
      // Only process selection if it's within our text layer
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        if (textLayer.contains(container)) {
          selectedText = selection.toString()
            .replace(/\s+/g, ' ')
            .trim();
        }
      }

      if (selectedText) {
        console.log('PDF Selection:', selectedText); // Debug log
        const event = new CustomEvent('pdf-text-selected', {
          detail: selectedText
        });
        window.dispatchEvent(event);
      }
    };

    const textLayer = textLayerRef.current;
    if (textLayer) {
      textLayer.addEventListener('mouseup', handleSelection);
      textLayer.addEventListener('keyup', handleSelection);
    }

    return () => {
      if (textLayer) {
        textLayer.removeEventListener('mouseup', handleSelection);
        textLayer.removeEventListener('keyup', handleSelection);
      }
    };
  }, []);

  const handlePageChange = (delta: number) => {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div ref={containerRef} className="relative" style={{ minHeight: '500px' }}>
        <canvas
          ref={canvasRef}
          className="mx-auto"
        />
        <div
          ref={textLayerRef}
          className="textLayer absolute top-0 left-0"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
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