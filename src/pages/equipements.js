/**
 * Antigravity - Equipements CRUD Page
 */
import { equipementsStore, societesStore, marchesStore } from '../services/store.js';
import { auth } from '../services/auth.js';

// SVG icon helpers
const ICONS = {
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    x: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
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

export function renderEquipements(container) {
    const currentAirportId = auth.getCurrentAirportId();
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1>Équipements & Installations</h1>
                <p>Parc matériel sous contrat de maintenance</p>
            </div>
            <button id="btnNewEquipement" class="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Nouvel Équipement
            </button>
        </div>

        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nom de l'équipement</th>
                        <th>Désignation</th>
                        <th>Catégorie</th>
                        <th>Statut</th>
                        <th>Marché en charge</th>
                        <th>Prestataire</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="equipementsBody"></tbody>
            </table>
        </div>

        <!-- Modal -->
        <div id="equipementModal" class="modal-overlay">
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 id="modalTitle">Nouvel Équipement</h2>
                    <button class="modal-close" id="btnCloseModal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <form id="equipementForm">
                    <div class="modal-body">
                        <input type="hidden" id="equipementId">
                        
                        <div class="nav-section" style="padding-left:0; margin-top:0;">Identification</div>
                        
                        <div class="flex gap-4">
                            <div class="form-group w-full">
                                <label class="form-label">Nom de l'équipement</label>
                                <input type="text" id="nom_equipement" class="form-control" required placeholder="Ex: Onduleur A">
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Désignation</label>
                                <input type="text" id="designation" class="form-control" placeholder="Ex: Tableau Général">
                            </div>
                        </div>

                        <div class="flex gap-4">
                            <div class="form-group w-full">
                                <label class="form-label">Localisation / Emplacement</label>
                                <input type="text" id="localisation" class="form-control">
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Catégorie</label>
                                <select id="categorie" class="form-control" required>
                                    <option value="ELECTRIQUE">Électrique</option>
                                    <option value="BALISAGE">Balisage</option>
                                    <option value="CVC">CVC (Climatisation)</option>
                                    <option value="MECANIQUE">Mécanique</option>
                                    <option value="INFORMATIQUE">Informatique</option>
                                    <option value="AUTRE">Autre</option>
                                </select>
                            </div>
                        </div>

                        <div class="nav-section" style="padding-left:0;">Paramètres & Maintenance</div>

                        <div class="form-group w-full mb-4">
                            <label class="form-label">Statut Actuel</label>
                            <select id="statut" class="form-control" required>
                                <option value="EN_SERVICE">En Service</option>
                                <option value="EN_MAINTENANCE">En Maintenance</option>
                                <option value="EN_PANNE">En Panne</option>
                            </select>
                        </div>

                        <div class="flex gap-4 items-center">
                            <div class="form-group w-full">
                                <label class="form-label">Marché en charge</label>
                                <select id="marche_id" class="form-control" required>
                                    <option value="">-- Sélectionner un marché --</option>
                                </select>
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Prestataire en charge</label>
                                <select id="societe_id" class="form-control" required>
                                    <option value="">-- Sélectionner un prestataire --</option>
                                </select>
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
    `;

    // Populate dropdowns
    const populateDropdowns = () => {
        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        
        const societes = societesStore.getAll(filters);
        const marches = marchesStore.getAll(filters);
        
        const selectSoc = document.getElementById('societe_id');
        selectSoc.innerHTML = '<option value="">-- Sélectionner un prestataire --</option>';
        societes.forEach(s => {
            selectSoc.innerHTML += `<option value="${s.id}">${s.nom || s.raison_sociale}</option>`;
        });

        const selectMarche = document.getElementById('marche_id');
        selectMarche.innerHTML = '<option value="">-- Sélectionner un marché --</option>';
        marches.forEach(m => {
            selectMarche.innerHTML += `<option value="${m.id}">${m.numero_marche}</option>`;
        });
    };

    const loadData = () => {
        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        
        const equipements = equipementsStore.getAll(filters);
        const tbody = document.getElementById('equipementsBody');
        
        if (equipements.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">Aucun équipement trouvé.</td></tr>`;
            return;
        }

        tbody.innerHTML = equipements.map(e => {
            const societe = societesStore.getById(e.societe_id);
            const marche = marchesStore.getById(e.marche_id);
            
            let statusBadge = 'success';
            if (e.statut === 'EN_PANNE') statusBadge = 'danger';
            if (e.statut === 'EN_MAINTENANCE') statusBadge = 'warning';

            const nom = e.nom_equipement || e.code_equipement || 'Sans nom';

            return `
            <tr>
                <td style="font-weight: 500; color: #0f172a; vertical-align: middle;">${nom}</td>
                <td style="vertical-align: middle;">
                    <div style="font-weight: 500;">${e.designation || '<span style="font-style: italic; font-size: 0.8125rem; color: #94a3b8;">Non renseignée</span>'}</div>
                    <div style="font-size: 0.75rem; color: #94a3b8;">${e.localisation || 'Non renseignée'}</div>
                </td>
                <td style="vertical-align: middle;"><span class="badge badge-neutral">${e.categorie}</span></td>
                <td style="vertical-align: middle;"><span class="badge badge-${statusBadge}">${e.statut.replace('_', ' ')}</span></td>
                <td style="vertical-align: middle;"><span class="badge badge-info">${marche ? marche.numero_marche : 'Non assigné'}</span></td>
                <td style="vertical-align: middle;">${societe ? (societe.nom || societe.raison_sociale) : '<span style="font-size: 0.8125rem; color: #94a3b8;">Non assigné</span>'}</td>
                <td style="vertical-align: middle;">
                    <div class="action-group" style="display: flex; gap: 0.25rem; justify-content: flex-end;">
                        <button class="btn-action-icon btn-edit" data-id="${e.id}" title="Éditer" style="color: #4f46e5;">
                            ${ICONS.edit}
                        </button>
                        <button class="btn-action-icon btn-delete" data-id="${e.id}" title="Supprimer" style="color: #ef4444;">
                            ${ICONS.trash}
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.getAttribute('data-id')));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                confirmDelete(() => {
                    equipementsStore.delete(id);
                    loadData();
                });
            });
        });
    };

    // Modal Handling
    const modal = document.getElementById('equipementModal');
    const form = document.getElementById('equipementForm');
    
    const openModal = (id = null) => {
        form.reset();
        document.getElementById('equipementId').value = '';
        document.getElementById('modalTitle').textContent = "Nouvel Équipement";
        document.getElementById('statut').value = 'EN_SERVICE'; // default
        
        populateDropdowns();

        if (id) {
            const e = equipementsStore.getById(id);
            if (e) {
                document.getElementById('modalTitle').textContent = "Modifier l'Équipement";
                document.getElementById('equipementId').value = e.id;
                document.getElementById('nom_equipement').value = e.nom_equipement || e.code_equipement || '';
                document.getElementById('designation').value = e.designation || '';
                document.getElementById('localisation').value = e.localisation || '';
                document.getElementById('categorie').value = e.categorie || 'AUTRE';
                document.getElementById('statut').value = e.statut || 'EN_SERVICE';
                document.getElementById('societe_id').value = e.societe_id || '';
                document.getElementById('marche_id').value = e.marche_id || '';
            }
        }
        modal.classList.add('active');
    };

    const closeModal = () => modal.classList.remove('active');

    document.getElementById('btnNewEquipement').addEventListener('click', () => openModal());
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancel').addEventListener('click', closeModal);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const societeId = document.getElementById('societe_id').value;
        const marcheId = document.getElementById('marche_id').value;
        const societe = societesStore.getById(societeId);
        const marche = marchesStore.getById(marcheId);
        
        // Infer airport from societe or marche, else current
        let airportId = currentAirportId;
        if (marche && marche.airport_id) {
            airportId = marche.airport_id;
        } else if (societe && societe.airport_id) {
            airportId = societe.airport_id;
        }

        const data = {
            airport_id: airportId,
            marche_id: marcheId,
            societe_id: societeId,
            nom_equipement: document.getElementById('nom_equipement').value,
            designation: document.getElementById('designation').value,
            localisation: document.getElementById('localisation').value,
            categorie: document.getElementById('categorie').value,
            statut: document.getElementById('statut').value
        };

        const id = document.getElementById('equipementId').value;
        if (id) {
            equipementsStore.update(id, data);
        } else {
            equipementsStore.create(data);
        }

        closeModal();
        loadData();
    });

    loadData();

    window.addEventListener('airport-change', () => {
        renderEquipements(container);
    }, { once: true });
}
