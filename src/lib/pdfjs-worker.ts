import * as pdfjsLib from 'pdfjs-dist';

// Set worker source directly
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString(); 