/**
 * Amnt - Marches (Contracts) CRUD Page with PDF Management & Manual Input
 */
import { marchesStore, airportsStore } from '../services/store.js';
import { auth } from '../services/auth.js';
import { savePdf, getPdf, deletePdf, getAllPdfMeta, formatFileSize } from '../services/pdf-store.js';
import { getPdfjsLib } from '../services/pdf-parser.js';

// SVG icon helpers
const ICONS = {
    upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    replace: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`,
    x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    plus: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    zoomIn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
    zoomOut: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
    chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
};

// Confirmation modal helper
function confirmDelete(onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
        <div class="modal" style="max-width: 400px; text-align: center; padding: 2rem;">
            <div style="margin-bottom: 1rem;">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" style="margin: 0 auto;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </div>
            <h3 style="margin-bottom: 0.375rem; color: #0f172a; font-size: 1rem;">Confirmer la suppression</h3>
            <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 1.25rem;">Êtes-vous sûr de vouloir supprimer cet élément ?</p>
            <div class="flex gap-2 justify-center">
                <button type="button" class="btn btn-secondary" id="btnCancelDelete">Annuler</button>
                <button type="button" class="btn btn-danger" id="btnConfirmDelete">Supprimer</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    const cleanup = () => { overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 200); };
    overlay.querySelector('#btnCancelDelete').addEventListener('click', cleanup);
    overlay.querySelector('#btnConfirmDelete').addEventListener('click', () => { cleanup(); onConfirm(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
}

// Toast notification helper
function showToast(message, type = 'error') {
    let toast = document.getElementById('pdfToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pdfToast';
        document.body.appendChild(toast);
    }
    toast.className = `pdf-toast pdf-toast-${type}`;
    toast.textContent = message;
    requestAnimationFrame(() => {
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 3500);
    });
}

// Date formatter FR helper
function formatDateFR(dStr) {
    if (!dStr) return '-';
    const parts = dStr.split('T')[0].split('-');
    if (parts.length !== 3) return dStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function renderMarches(container) {
    const currentAirportId = auth.getCurrentAirportId();
    
    // State for pending PDF file in form
    let pendingPdfFile = null;
    // Map of marche IDs that have PDFs
    let pdfMap = {};

    // Initial UI
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1>Marchés & Contrats</h1>
                <p>Gestion des contrats de maintenance par aéroport</p>
            </div>
            <button id="btnNewMarche" class="btn btn-primary">
                ${ICONS.plus}
                Nouveau Marché
            </button>
        </div>

        <div class="table-container">
            <div class="overflow-x-auto w-full">
                <table class="table min-w-[1000px]">
                    <thead>
                        <tr>
                            <th>Numéro</th>
                            <th>Objet</th>
                            <th>SLO Disponibilité</th>
                            <th>SLO PRR</th>
                            <th>Document</th>
                            <th>Statut</th>
                            <th>Période</th>
                            <th style="width: 120px; min-width: 120px; text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="marchesTableBody">
                        <!-- Data injected here -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Create/Edit Modal -->
        <div id="marcheModal" class="modal-overlay">
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 id="modalTitle">Nouveau Marché</h2>
                    <button type="button" class="modal-close" id="btnCloseModal">
                        ${ICONS.x}
                    </button>
                </div>
                <form id="marcheForm">
                    <div class="modal-body">
                        <input type="hidden" id="marcheId">
                        
                        <div class="form-group">
                            <label class="form-label">Numéro de Marché</label>
                            <input type="text" id="numero" class="form-control" required placeholder="Ex: 014/24">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Objet de la maintenance</label>
                            <textarea id="objet" class="form-control" rows="3" required placeholder="Ex: Maintenance des équipements..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Statut</label>
                            <select id="statut" class="form-control" required>
                                <option value="BROUILLON">Brouillon</option>
                                <option value="ACTIF">Actif</option>
                                <option value="EXPIRE">Expiré</option>
                                <option value="RESILIE">Résilié</option>
                            </select>
                        </div>

                        <div class="nav-section" style="padding-left:0;">Niveaux de Service (SLO)</div>
                        
                        <div class="flex gap-4">
                            <div class="form-group w-full">
                                <label class="form-label">Disponibilité (%)</label>
                                <input type="number" id="slaD" class="form-control" min="0" max="100" step="0.1" required placeholder="98">
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">PRR (%)</label>
                                <input type="number" id="slaPRR" class="form-control" min="0" max="100" step="0.1" required placeholder="100">
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">MRT (Minutes)</label>
                                <input type="number" id="slaMRT" class="form-control" min="1" required placeholder="420">
                            </div>
                        </div>

                        <div class="flex gap-4">
                            <div class="form-group w-full">
                                <label class="form-label">Date début</label>
                                <input type="date" id="dateDebut" class="form-control" required>
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Date fin</label>
                                <input type="date" id="dateFin" class="form-control" required>
                            </div>
                        </div>

                        <div class="nav-section" style="padding-left:0;">Document du Marché (PDF)</div>
                        
                        <div class="form-group">
                            <div id="pdfDropzone" class="pdf-dropzone">
                                <input type="file" id="pdfFileInput" accept=".pdf,application/pdf" style="display:none;">
                                <div class="pdf-dropzone-icon">${ICONS.upload}</div>
                                <div class="pdf-dropzone-text">
                                    <strong>Glissez-déposez</strong> votre fichier PDF ici
                                </div>
                                <div class="pdf-dropzone-hint">ou cliquez pour sélectionner · PDF uniquement · Max 20 Mo</div>
                                <div id="pdfFilePreview"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="btnCancel">Annuler</button>
                        <button type="submit" class="btn btn-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- PDF Viewer Modal (Split-Screen Split View Layout) -->
        <div id="pdfViewerModal" class="pdf-viewer-overlay">
            <div class="pdf-viewer-toolbar">
                <div class="pdf-viewer-title" id="pdfViewerTitle">Document</div>
                <div class="pdf-viewer-controls">
                    <div class="pdf-page-nav">
                        <button type="button" class="btn-icon" id="btnPrevPage" title="Page précédente">${ICONS.chevronLeft}</button>
                        <span class="pdf-page-indicator" id="pdfPageIndicator">— / —</span>
                        <button type="button" class="btn-icon" id="btnNextPage" title="Page suivante">${ICONS.chevronRight}</button>
                    </div>
                    <div class="pdf-zoom-controls">
                        <button type="button" class="btn-icon" id="btnZoomOut" title="Zoom arrière">${ICONS.zoomOut}</button>
                        <span class="pdf-zoom-level" id="pdfZoomLevel">100%</span>
                        <button type="button" class="btn-icon" id="btnZoomIn" title="Zoom avant">${ICONS.zoomIn}</button>
                    </div>
                </div>
                <div class="pdf-viewer-actions">
                    <button type="button" class="btn-icon" id="btnDownloadPdf" title="Télécharger">${ICONS.download}</button>
                    <button type="button" class="btn-icon btn-icon-close" id="btnClosePdfViewer" title="Fermer">${ICONS.x}</button>
                </div>
            </div>
            
            <div class="pdf-viewer-body">
                <!-- PDF scrollable pages on the left -->
                <div class="pdf-viewer-container" id="pdfViewerContainer">
                    <div class="pdf-loading" id="pdfLoadingIndicator">
                        <div class="pdf-loading-spinner"></div>
                        <span>Chargement du document…</span>
                    </div>
                </div>
                
                <!-- Premium Details Panel on the right -->
                <div class="pdf-viewer-details-sidebar" id="pdfViewerDetailsSidebar">
                    <!-- Loaded dynamically in openPdfViewer() -->
                </div>
            </div>
        </div>

        <!-- Hidden file input for replacing PDF -->
        <input type="file" id="pdfReplaceInput" accept=".pdf,application/pdf" style="display:none;">
    `;

    // ========================
    // PDF Dropzone Logic (100% Manual - No AI auto-fill)
    // ========================
    const dropzone = document.getElementById('pdfDropzone');
    const fileInput = document.getElementById('pdfFileInput');
    const filePreview = document.getElementById('pdfFilePreview');

    const setDropzoneFile = (file) => {
        if (!file) {
            pendingPdfFile = null;
            dropzone.classList.remove('has-file');
            filePreview.innerHTML = '';
            return;
        }

        if (file.type !== 'application/pdf') {
            showToast('Seuls les fichiers PDF sont acceptés.', 'error');
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            showToast('Le fichier dépasse la limite de 20 Mo.', 'error');
            return;
        }

        pendingPdfFile = file;
        dropzone.classList.add('has-file');
        filePreview.innerHTML = `
            <div class="pdf-file-info">
                <div class="pdf-file-icon">PDF</div>
                <div class="pdf-file-details">
                    <div class="pdf-file-name" title="${file.name}">${file.name}</div>
                    <div class="pdf-file-size">${formatFileSize(file.size)}</div>
                </div>
                <button type="button" class="pdf-file-remove" id="btnRemovePdf" title="Retirer">
                    ${ICONS.x}
                </button>
            </div>
        `;
        document.getElementById('btnRemovePdf').addEventListener('click', (e) => {
            e.stopPropagation();
            setDropzoneFile(null);
            fileInput.value = '';
        });
    };

    // Show existing PDF info when editing
    const showExistingPdf = (fileName, fileSize) => {
        dropzone.classList.add('has-file');
        filePreview.innerHTML = `
            <div class="pdf-file-info">
                <div class="pdf-file-icon">PDF</div>
                <div class="pdf-file-details">
                    <div class="pdf-file-name" title="${fileName}">${fileName}</div>
                    <div class="pdf-file-size">${formatFileSize(fileSize)} · Document actuel</div>
                </div>
            </div>
        `;
    };

    // Click to open file picker
    dropzone.addEventListener('click', (e) => {
        if (e.target.closest('.pdf-file-remove')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            setDropzoneFile(fileInput.files[0]);
        }
    });

    // Drag and drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            setDropzoneFile(e.dataTransfer.files[0]);
        }
    });

    // ========================
    // PDF Viewer Logic (With Split-Screen Details Display)
    // ========================
    const viewerOverlay = document.getElementById('pdfViewerModal');
    const viewerContainer = document.getElementById('pdfViewerContainer');
    const loadingIndicator = document.getElementById('pdfLoadingIndicator');
    const pageIndicator = document.getElementById('pdfPageIndicator');
    const zoomLevelDisplay = document.getElementById('pdfZoomLevel');

    let currentPdfDoc = null;
    let currentPageNum = 1;
    let totalPages = 0;
    let currentZoom = 1.0;
    let currentViewerMarcheId = null;
    let currentViewerFileName = null;
    const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

    const openPdfViewer = async (marcheId, title) => {
        currentViewerMarcheId = marcheId;
        viewerOverlay.classList.add('active');
        loadingIndicator.style.display = 'flex';
        document.getElementById('pdfViewerTitle').textContent = title;

        try {
            // Load and inject contract details in split-screen side panel
            const marche = marchesStore.getById(marcheId);
            const sidebar = document.getElementById('pdfViewerDetailsSidebar');
            if (marche && sidebar) {
                let statusBadge = 'neutral';
                if (marche.statut === 'ACTIF') statusBadge = 'success';
                if (marche.statut === 'EXPIRE') statusBadge = 'warning';
                if (marche.statut === 'RESILIE') statusBadge = 'danger';

                // Format MRT nicely (e.g. 7H or 420 Min)
                const mrtHrs = Math.floor(marche.sla_mrt / 60);
                const mrtMins = marche.sla_mrt % 60;
                const formattedMrt = mrtHrs > 0 
                    ? `${mrtHrs}h${mrtMins > 0 ? ` ${mrtMins}m` : ''}` 
                    : `${marche.sla_mrt} min`;

                sidebar.innerHTML = `
                    <div class="sidebar-details-header">
                        <span class="badge badge-${statusBadge}">${marche.statut}</span>
                        <h3>Détails du Marché</h3>
                    </div>
                    <div class="sidebar-details-body">
                        <div class="detail-section">
                            <div class="detail-label">Numéro du marché</div>
                            <div class="detail-value highlight">${marche.numero_marche}</div>
                        </div>

                        <div class="detail-section">
                            <div class="detail-label">Objet de la prestation</div>
                            <div class="detail-value text-secondary">${marche.objet}</div>
                        </div>

                        <div class="detail-section">
                            <div class="detail-label">Période de validité</div>
                            <div class="detail-value flex items-center gap-2">
                                <span class="period-date">${formatDateFR(marche.date_debut)}</span>
                                <span class="text-muted">au</span>
                                <span class="period-date">${formatDateFR(marche.date_fin)}</span>
                            </div>
                        </div>

                        <div class="detail-section mt-4">
                            <div class="detail-label mb-2">Niveaux de Service (SLO)</div>
                            <div class="slo-grid">
                                <div class="slo-card slo-dispo">
                                    <div class="slo-card-title">Disponibilité</div>
                                    <div class="slo-card-value">${marche.sla_disponibilite}%</div>
                                </div>
                                <div class="slo-card slo-prr">
                                    <div class="slo-card-title">PRR (Résolution)</div>
                                    <div class="slo-card-value">${marche.sla_prr}%</div>
                                </div>
                                <div class="slo-card slo-mrt">
                                    <div class="slo-card-title">MRT (Rétablissement)</div>
                                    <div class="slo-card-value">${formattedMrt}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            const record = await getPdf(marcheId);
            if (!record) {
                showToast('Aucun document PDF trouvé pour ce marché.', 'error');
                closePdfViewer();
                return;
            }

            currentViewerFileName = record.fileName;

            // Load PDF using pdf.js
            const arrayBuffer = await record.blob.arrayBuffer();
            const pdfjsLib = await getPdfjsLib();
            currentPdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            totalPages = currentPdfDoc.numPages;
            currentPageNum = 1;
            currentZoom = 1.0;

            // Clear any previous error containers
            const oldErrors = viewerContainer.querySelectorAll('.pdf-error-container');
            oldErrors.forEach(el => el.remove());

            // Execute rendering logic (it will manage the loading indicator internally)
            await renderAllPages();
            
            updateViewerControls();
            updateViewerControls();
        } catch (err) {
            console.error('Erreur chargement PDF:', err);
            // Hide the loading indicator
            loadingIndicator.style.display = 'none';
            
            // Render a beautiful, fully functional Error Boundary UI in the left panel
            viewerContainer.innerHTML = `
                <div class="pdf-error-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.25rem; padding: 4rem 2rem; text-align: center; color: white; margin: auto; max-width: 420px;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fca5a5" stroke-width="2" style="width: 28px; height: 28px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <h3 style="color: white; margin: 0; font-size: 1.125rem; font-weight: 600; letter-spacing: -0.01em;">Impossible de charger le document</h3>
                    <p style="color: #cbd5e1; font-size: 0.875rem; line-height: 1.5; margin: 0;">Une erreur est survenue lors de l'accès au fichier ou du rendu des pages. Veuillez réessayer.</p>
                    <button type="button" class="btn btn-primary" id="btnReloadPdf" style="margin-top: 0.75rem; background: var(--color-brand); border: none; padding: 0.5rem 1.25rem; border-radius: var(--radius-md); font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: all 150ms ease;">
                        Recharger le document
                    </button>
                </div>
            `;
            // Bind reload action
            document.getElementById('btnReloadPdf').addEventListener('click', () => {
                openPdfViewer(marcheId, title);
            });
            
            // Set controls to empty/reset state
            totalPages = 0;
            currentPageNum = 0;
            updateViewerControls();
        }
    };

    const renderAllPages = async () => {
        // Clear previous pages
        const existing = viewerContainer.querySelectorAll('.pdf-canvas-wrapper, .pdf-error-container');
        existing.forEach(el => el.remove());

        // Pre-calculate dimensions using the first page
        let defaultWidth = 800;
        let defaultHeight = 1130;
        try {
            const firstPage = await currentPdfDoc.getPage(1);
            const firstViewport = firstPage.getViewport({ scale: currentZoom * 1.5 });
            defaultWidth = firstViewport.width;
            defaultHeight = firstViewport.height;
        } catch (e) {
            console.warn("Could not fetch first page dimensions:", e);
        }

        // Inject all wrappers immediately so the user can scroll and see the structure
        for (let i = 1; i <= totalPages; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'pdf-canvas-wrapper';
            wrapper.dataset.pageNum = i;
            wrapper.style.minHeight = `${defaultHeight}px`;
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'center';
            wrapper.style.background = '#f8fafc';
            
            wrapper.innerHTML = `
                <div class="pdf-page-skeleton" style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem; color: #94a3b8;">
                    <div class="pdf-loading-spinner" style="width: 24px; height: 24px; border-width: 2px;"></div>
                    <span style="font-size: 0.8125rem; font-weight: 500;">Chargement page ${i}...</span>
                </div>
            `;
            viewerContainer.appendChild(wrapper);
        }

        // The physical document pages are ready to be injected into the DOM
        // We hide the global loading indicator now, instead of waiting for full render
        loadingIndicator.style.display = 'none';

        // Render pages synchronously one by one
        for (let i = 1; i <= totalPages; i++) {
            try {
                const page = await currentPdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: currentZoom * 1.5 }); // 1.5x for HD clarity

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.dataset.pageNum = i;

                // Render with Timeout (15 seconds)
                const renderTask = page.render({ canvasContext: context, viewport });
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout lors du rendu PDF')), 15000)
                );
                
                await Promise.race([renderTask.promise, timeoutPromise]);

                const wrapper = viewerContainer.querySelector(`.pdf-canvas-wrapper[data-page-num="${i}"]`);
                if (wrapper) {
                    wrapper.innerHTML = '';
                    wrapper.style.background = 'white';
                    wrapper.appendChild(canvas);
                }
            } catch (err) {
                console.error(`Erreur rendu page ${i}:`, err);
                const wrapper = viewerContainer.querySelector(`.pdf-canvas-wrapper[data-page-num="${i}"]`);
                if (wrapper) {
                    wrapper.innerHTML = `
                        <div class="pdf-page-error" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; color: #ef4444; padding: 2rem;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            <span style="font-weight: 500; font-size: 0.875rem;">Échec du rendu de la page ${i}</span>
                            <button type="button" class="btn btn-primary" onclick="this.closest('.pdf-canvas-wrapper').innerHTML='Rechargement...'; setTimeout(() => window.location.reload(), 500);" style="margin-top: 0.5rem; padding: 0.375rem 0.75rem; font-size: 0.75rem;">Recharger la page</button>
                        </div>
                    `;
                }
            }
        }
    };

    const updateViewerControls = () => {
        pageIndicator.textContent = `Page ${currentPageNum} / ${totalPages}`;
        zoomLevelDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
        document.getElementById('btnPrevPage').disabled = currentPageNum <= 1;
        document.getElementById('btnNextPage').disabled = currentPageNum >= totalPages;

        const zoomIdx = ZOOM_LEVELS.indexOf(currentZoom);
        document.getElementById('btnZoomOut').disabled = zoomIdx <= 0;
        document.getElementById('btnZoomIn').disabled = zoomIdx >= ZOOM_LEVELS.length - 1;
    };

    const goToPage = (num) => {
        if (num < 1 || num > totalPages) return;
        currentPageNum = num;
        updateViewerControls();
        const wrapper = viewerContainer.querySelector(`.pdf-canvas-wrapper[data-page-num="${num}"]`);
        if (wrapper) {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const setZoom = async (newZoom) => {
        currentZoom = newZoom;
        updateViewerControls();
        await renderAllPages();
        // Scroll to current page after re-render
        goToPage(currentPageNum);
    };

    const closePdfViewer = () => {
        viewerOverlay.classList.remove('active');
        currentPdfDoc = null;
        currentViewerMarcheId = null;
        currentViewerFileName = null;
        // Clear canvases and sidebar
        const existing = viewerContainer.querySelectorAll('.pdf-canvas-wrapper, .pdf-error-container');
        existing.forEach(el => el.remove());
        const sidebar = document.getElementById('pdfViewerDetailsSidebar');
        if (sidebar) sidebar.innerHTML = '';
        loadingIndicator.style.display = 'flex';
    };

    // Viewer button bindings
    document.getElementById('btnPrevPage').addEventListener('click', () => goToPage(currentPageNum - 1));
    document.getElementById('btnNextPage').addEventListener('click', () => goToPage(currentPageNum + 1));
    document.getElementById('btnZoomIn').addEventListener('click', () => {
        const idx = ZOOM_LEVELS.indexOf(currentZoom);
        if (idx < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[idx + 1]);
    });
    document.getElementById('btnZoomOut').addEventListener('click', () => {
        const idx = ZOOM_LEVELS.indexOf(currentZoom);
        if (idx > 0) setZoom(ZOOM_LEVELS[idx - 1]);
    });
    document.getElementById('btnClosePdfViewer').addEventListener('click', closePdfViewer);

    // Download button in viewer
    document.getElementById('btnDownloadPdf').addEventListener('click', async () => {
        if (!currentViewerMarcheId) return;
        try {
            const record = await getPdf(currentViewerMarcheId);
            if (record) {
                const url = URL.createObjectURL(record.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = record.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            showToast('Erreur lors du téléchargement.', 'error');
        }
    });

    // Keyboard navigation for viewer
    const handleViewerKeyboard = (e) => {
        if (!viewerOverlay.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') goToPage(currentPageNum - 1);
        if (e.key === 'ArrowRight') goToPage(currentPageNum + 1);
        if (e.key === 'Escape') closePdfViewer();
        if (e.key === '+' || e.key === '=') {
            const idx = ZOOM_LEVELS.indexOf(currentZoom);
            if (idx < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[idx + 1]);
        }
        if (e.key === '-') {
            const idx = ZOOM_LEVELS.indexOf(currentZoom);
            if (idx > 0) setZoom(ZOOM_LEVELS[idx - 1]);
        }
    };
    document.addEventListener('keydown', handleViewerKeyboard);

    // Track scroll position to update page indicator
    viewerContainer.addEventListener('scroll', () => {
        const wrappers = viewerContainer.querySelectorAll('.pdf-canvas-wrapper');
        const containerRect = viewerContainer.getBoundingClientRect();
        for (const wrapper of wrappers) {
            const rect = wrapper.getBoundingClientRect();
            if (rect.top <= containerRect.top + containerRect.height / 3 && rect.bottom > containerRect.top) {
                const pageNum = parseInt(wrapper.dataset.pageNum);
                if (pageNum !== currentPageNum) {
                    currentPageNum = pageNum;
                    updateViewerControls();
                }
            }
        }
    });

    // ========================
    // Replace PDF (from table action)
    // ========================
    const replaceInput = document.getElementById('pdfReplaceInput');
    let replaceTargetMarcheId = null;

    replaceInput.addEventListener('change', async () => {
        if (replaceInput.files.length > 0 && replaceTargetMarcheId) {
            const file = replaceInput.files[0];
            if (file.type !== 'application/pdf') {
                showToast('Seuls les fichiers PDF sont acceptés.', 'error');
                return;
            }
            if (file.size > 20 * 1024 * 1024) {
                showToast('Le fichier dépasse la limite de 20 Mo.', 'error');
                return;
            }
            try {
                await savePdf(replaceTargetMarcheId, file);
                showToast('Document remplacé avec succès !', 'success');
                await loadData();
            } catch (err) {
                showToast('Erreur lors du remplacement.', 'error');
            }
        }
        replaceInput.value = '';
        replaceTargetMarcheId = null;
    });

    // ========================
    // Data Handling
    // ========================
    const loadData = async () => {
        try {
            const allMeta = await getAllPdfMeta();
            pdfMap = {};
            allMeta.forEach(m => { pdfMap[m.marcheId] = m; });
        } catch (e) {
            console.warn('Could not load PDF metadata:', e);
        }

        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        
        const marches = marchesStore.getAll(filters);
        const tbody = document.getElementById('marchesTableBody');
        
        if (marches.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state" style="border: none; padding: 2.5rem 1.5rem;">
                            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            <p>Aucun marché ou contrat de maintenance configuré.</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = marches.map(m => {
            let statusBadge = 'neutral';
            if (m.statut === 'ACTIF') statusBadge = 'success';
            if (m.statut === 'EXPIRE') statusBadge = 'warning';
            if (m.statut === 'RESILIE') statusBadge = 'danger';

            const hasPdfDoc = pdfMap[m.id];
            const pdfCell = hasPdfDoc
                ? `<div class="pdf-document-badge btn-view-pdf" data-id="${m.id}" data-title="${m.numero_marche}" title="Visualiser le contrat (PDF)" style="display: flex; align-items: center; justify-content: space-between; max-width: 220px; padding: 0.375rem 0.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; transition: all 0.2s ease;">
                       <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden;">
                           <div style="color: #ef4444; display: flex; align-items: center;">
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                           </div>
                           <div style="display: flex; flex-direction: column; overflow: hidden;">
                               <span style="font-size: 0.75rem; font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">${hasPdfDoc.fileName}</span>
                               <span style="font-size: 0.6875rem; color: #64748b; line-height: 1.2;">${formatFileSize(hasPdfDoc.fileSize)}</span>
                           </div>
                       </div>
                       <div class="pdf-inline-actions" style="display: flex; gap: 0.25rem; margin-left: 0.5rem;" onclick="event.stopPropagation()">
                           <button class="btn-action-icon btn-download-pdf" data-id="${m.id}" title="Télécharger" style="width: 24px; height: 24px; padding: 0; background: transparent; border: none; color: #64748b; cursor: pointer;">
                               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                           </button>
                           <button class="btn-action-icon btn-replace-pdf" data-id="${m.id}" title="Remplacer" style="width: 24px; height: 24px; padding: 0; background: transparent; border: none; color: #64748b; cursor: pointer;">
                               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                           </button>
                       </div>
                   </div>`
                : `<button class="pdf-upload-badge btn-upload-direct" data-id="${m.id}" title="Importer le contrat" style="display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.625rem; background: transparent; border: 1px dashed #cbd5e1; border-radius: 6px; color: #64748b; font-size: 0.75rem; cursor: pointer; transition: all 0.2s ease;">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                       <span>Ajouter PDF</span>
                   </button>`;

            return `
            <tr>
                <td style="font-weight: 500; font-family: var(--font-mono); color: #0f172a; vertical-align: middle;">${m.numero_marche}</td>
                <td style="vertical-align: middle;">
                    <div style="font-weight: 500; color: #1e293b; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${m.objet}">${m.objet}</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.125rem;">Type : <span style="font-weight: 500; color: #475569;">${m.type_maintenance || 'MIXTE'}</span></div>
                </td>
                <td style="vertical-align: middle;"><span style="display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; background: #ecfdf5; color: #059669; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">${m.sla_disponibilite}%</span></td>
                <td style="vertical-align: middle;"><span style="display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; background: #f0f9ff; color: #0284c7; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">${m.sla_prr}%</span></td>
                <td style="vertical-align: middle;">${pdfCell}</td>
                <td style="vertical-align: middle;"><span class="badge badge-${statusBadge}">${m.statut}</span></td>
                <td style="font-family: var(--font-mono); font-size: 0.75rem; color: #475569; vertical-align: middle; white-space: nowrap;">${formatDateFR(m.date_debut)}<br/><span style="color: #94a3b8;">au</span> ${formatDateFR(m.date_fin)}</td>
                <td style="vertical-align: middle; width: 120px; min-width: 120px;">
                    <div class="action-group" style="display: flex; gap: 0.25rem; justify-content: flex-end;">
                        <button class="btn-action-icon btn-edit" data-id="${m.id}" title="Éditer">
                            ${ICONS.edit}
                        </button>
                        <button class="btn-action-icon btn-delete" data-id="${m.id}" title="Supprimer">
                            ${ICONS.trash}
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');

        // Bind edit buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.getAttribute('data-id')));
        });

        // Bind delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                confirmDelete(() => {
                    marchesStore.delete(id);
                    try { deletePdf(id); } catch(err) {}
                    showToast('Marché supprimé avec succès !', 'success');
                    loadData();
                });
            });
        });

        // Bind view PDF buttons
        document.querySelectorAll('.btn-view-pdf').forEach(btn => {
            btn.addEventListener('click', () => {
                openPdfViewer(btn.getAttribute('data-id'), btn.getAttribute('data-title'));
            });
        });

        // Bind download PDF buttons
        document.querySelectorAll('.btn-download-pdf').forEach(btn => {
            btn.addEventListener('click', async () => {
                const marcheId = btn.getAttribute('data-id');
                try {
                    const record = await getPdf(marcheId);
                    if (record) {
                        const url = URL.createObjectURL(record.blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = record.fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }
                } catch (err) {
                    showToast('Erreur lors du téléchargement.', 'error');
                }
            });
        });

        // Bind replace PDF buttons
        document.querySelectorAll('.btn-replace-pdf').forEach(btn => {
            btn.addEventListener('click', () => {
                replaceTargetMarcheId = btn.getAttribute('data-id');
                replaceInput.click();
            });
        });

        // Bind direct upload buttons
        document.querySelectorAll('.btn-upload-direct').forEach(btn => {
            btn.addEventListener('click', () => {
                replaceTargetMarcheId = btn.getAttribute('data-id');
                replaceInput.click();
            });
        });
    };

    // ========================
    // Modal Handling
    // ========================
    const modal = document.getElementById('marcheModal');
    const form = document.getElementById('marcheForm');
    
    const openModal = async (id = null) => {
        form.reset();
        document.getElementById('marcheId').value = '';
        document.getElementById('modalTitle').textContent = 'Nouveau Marché';
        pendingPdfFile = null;
        dropzone.classList.remove('has-file');
        filePreview.innerHTML = '';
        fileInput.value = '';

        if (id) {
            const m = marchesStore.getById(id);
            if (m) {
                document.getElementById('modalTitle').textContent = 'Modifier le Marché';
                document.getElementById('marcheId').value = m.id;
                document.getElementById('numero').value = m.numero_marche;
                document.getElementById('objet').value = m.objet;
                document.getElementById('statut').value = m.statut;
                document.getElementById('slaD').value = m.sla_disponibilite;
                document.getElementById('slaPRR').value = m.sla_prr;
                document.getElementById('slaMRT').value = m.sla_mrt;
                document.getElementById('dateDebut').value = m.date_debut;
                document.getElementById('dateFin').value = m.date_fin;

                // Show existing PDF if any
                try {
                    const record = await getPdf(m.id);
                    if (record) {
                        showExistingPdf(record.fileName, record.fileSize);
                    }
                } catch (e) {
                    // Ignore
                }
            }
        }
        modal.classList.add('active');
    };

    const closeModal = () => {
        modal.classList.remove('active');
        pendingPdfFile = null;
    };

    // Bindings
    document.getElementById('btnNewMarche').addEventListener('click', () => openModal());
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancel').addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Tenant enforcement
        const realAirportId = currentAirportId === 'all' 
            ? airportsStore.getAll()[0].id // Fallback for demo
            : currentAirportId;

        const id = document.getElementById('marcheId').value;
        const existingMarche = id ? marchesStore.getById(id) : null;

        const data = {
            airport_id: realAirportId,
            numero_marche: document.getElementById('numero').value,
            objet: document.getElementById('objet').value,
            type_maintenance: existingMarche ? (existingMarche.type_maintenance || 'MIXTE') : 'MIXTE',
            statut: document.getElementById('statut').value,
            sla_disponibilite: parseFloat(document.getElementById('slaD').value),
            sla_prr: parseFloat(document.getElementById('slaPRR').value),
            sla_mrt: parseInt(document.getElementById('slaMRT').value, 10),
            date_debut: document.getElementById('dateDebut').value,
            date_fin: document.getElementById('dateFin').value
        };

        let savedMarcheId;
        if (id) {
            marchesStore.update(id, data);
            savedMarcheId = id;
        } else {
            const created = marchesStore.create(data);
            savedMarcheId = created.id;
        }

        // Save PDF if one was selected
        if (pendingPdfFile && savedMarcheId) {
            try {
                await savePdf(savedMarcheId, pendingPdfFile);
                showToast('Document PDF enregistré avec succès !', 'success');
            } catch (err) {
                showToast(err.message || 'Erreur lors de l\'enregistrement du PDF.', 'error');
            }
        }

        closeModal();
        await loadData();
    });

    // Init
    loadData();
    
    // Listen for tenant context change (SuperAdmin)
    window.addEventListener('airport-change', () => {
        document.removeEventListener('keydown', handleViewerKeyboard);
        renderMarches(container);
    }, { once: true });
}
