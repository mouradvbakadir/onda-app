/**
 * Amnt - PDF Service (Shared Library Loader)
 * Only manages loading the client-side pdf.js library for rendering the document viewer.
 */

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

let _pdfjsLib = null;

/**
 * Load pdf.js library dynamically (with local caching)
 */
export async function getPdfjsLib() {
    if (_pdfjsLib) return _pdfjsLib;

    if (window.pdfjsLib) {
        _pdfjsLib = window.pdfjsLib;
    } else {
        _pdfjsLib = await import(/* @vite-ignore */ PDFJS_CDN);
    }

    try {
        // Create a local blob worker that imports the cross-origin module worker
        const workerCode = `import "${PDFJS_WORKER}";`;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl, { type: 'module' });
        _pdfjsLib.GlobalWorkerOptions.workerPort = worker;
    } catch (err) {
        console.warn('Failed to load PDF worker, falling back to standard CDN URL:', err);
        _pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    }

    return _pdfjsLib;
}
