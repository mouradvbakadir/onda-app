/**
 * Amnt - PDF Document Storage Service (IndexedDB)
 * Stores PDF files as Blobs linked to marchés (contracts).
 * Uses IndexedDB for large binary storage (localStorage is limited to ~5MB).
 */

const DB_NAME = 'amnt_documents';
const DB_VERSION = 1;
const STORE_NAME = 'pdfs';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * Opens (or creates) the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'marcheId' });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Stores a PDF file for a given marché.
 * @param {string} marcheId - The marché ID
 * @param {File} file - The PDF File object
 * @returns {Promise<{marcheId: string, fileName: string, fileSize: number, mimeType: string, uploadedAt: string}>}
 */
export async function savePdf(marcheId, file) {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`Le fichier dépasse la limite de ${MAX_FILE_SIZE / (1024 * 1024)} Mo.`);
    }

    if (file.type !== 'application/pdf') {
        throw new Error('Seuls les fichiers PDF sont acceptés.');
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const record = {
            marcheId,
            blob: file,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date().toISOString()
        };

        const request = store.put(record);
        request.onsuccess = () => resolve({
            marcheId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: record.uploadedAt
        });
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Retrieves the PDF record for a given marché.
 * @param {string} marcheId - The marché ID
 * @returns {Promise<{marcheId: string, blob: Blob, fileName: string, fileSize: number, mimeType: string, uploadedAt: string}|null>}
 */
export async function getPdf(marcheId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(marcheId);

        request.onsuccess = (event) => resolve(event.target.result || null);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Deletes the PDF for a given marché.
 * @param {string} marcheId - The marché ID
 * @returns {Promise<boolean>}
 */
export async function deletePdf(marcheId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(marcheId);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Checks if a marché has a PDF document stored.
 * @param {string} marcheId - The marché ID
 * @returns {Promise<boolean>}
 */
export async function hasPdf(marcheId) {
    const record = await getPdf(marcheId);
    return record !== null;
}

/**
 * Returns metadata for all stored PDFs.
 * @returns {Promise<Array<{marcheId: string, fileName: string, fileSize: number}>>}
 */
export async function getAllPdfMeta() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => {
            const records = event.target.result || [];
            resolve(records.map(r => ({
                marcheId: r.marcheId,
                fileName: r.fileName,
                fileSize: r.fileSize
            })));
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Formats a file size in bytes to a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
