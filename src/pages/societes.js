/**
 * Antigravity - Societes CRUD Page
 */
import { societesStore, marchesStore } from '../services/store.js';
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

export function renderSocietes(container) {
    const currentAirportId = auth.getCurrentAirportId();
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1>Sociétés Prestataires</h1>
                <p>Gestion des entreprises et de leurs équipes dynamiques</p>
            </div>
            <button id="btnNewSociete" class="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Nouvelle Société
            </button>
        </div>

        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nom de la Société</th>
                        <th>Marché Lié</th>
                        <th>Membres de l'équipe</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="societesBody"></tbody>
            </table>
        </div>

        <!-- Modal -->
        <div id="societeModal" class="modal-overlay">
            <div class="modal" style="max-width: 750px;">
                <div class="modal-header">
                    <h2 id="modalTitle">Nouvelle Société</h2>
                    <button class="modal-close" id="btnCloseModal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <form id="societeForm">
                    <div class="modal-body">
                        <input type="hidden" id="societeId">
                        
                        <div class="nav-section" style="padding-left:0; margin-top:0;">Informations Générales</div>
                        
                        <div class="flex gap-4">
                            <div class="form-group w-full">
                                <label class="form-label">Nom de la Société</label>
                                <input type="text" id="nom" class="form-control" required>
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Marché Associé</label>
                                <select id="marche_id" class="form-control" required>
                                    <option value="">-- Sélectionner un marché --</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex justify-between items-center mt-6 mb-4">
                            <div class="nav-section" style="padding-left:0; margin:0;">Équipe Intervenante</div>
                            <button type="button" id="btnAddMembre" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.875rem;">
                                + Ajouter un membre
                            </button>
                        </div>
                        
                        <div id="equipeContainer" class="flex flex-col gap-4">
                            <!-- Dynamic Members injected here -->
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

    // Populate Marches dropdown
    const populateMarches = () => {
        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        const marches = marchesStore.getAll(filters);
        
        const select = document.getElementById('marche_id');
        select.innerHTML = '<option value="">-- Sélectionner un marché --</option>';
        marches.forEach(m => {
            select.innerHTML += `<option value="${m.id}">${m.numero_marche} - ${m.objet.substring(0, 30)}...</option>`;
        });
    };

    // Dynamic Team UI
    const equipeContainer = document.getElementById('equipeContainer');
    
    const createMembreHTML = (membre = { role: 'Technicien', nom: '', email: '', tel: '' }) => {
        const id = Math.random().toString(36).substr(2, 9);
        return `
            <div class="equipe-member card" id="membre-${id}" style="padding: 1rem; border: 1px solid #e2e8f0; position: relative;">
                <button type="button" class="btn-remove-membre" data-id="${id}" style="position: absolute; top: 0.5rem; right: 0.5rem; background: none; border: none; color: #dc2626; cursor: pointer;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="flex gap-4 mb-3">
                    <div class="form-group w-full mb-0">
                        <label class="form-label" style="font-size: 0.75rem;">Rôle</label>
                        <select class="form-control membre-role" required>
                            <option value="Chef de Projet" ${membre.role === 'Chef de Projet' ? 'selected' : ''}>Chef de Projet</option>
                            <option value="Responsable Technique" ${membre.role === 'Responsable Technique' ? 'selected' : ''}>Responsable Technique</option>
                            <option value="Technicien" ${membre.role === 'Technicien' ? 'selected' : ''}>Technicien</option>
                            <option value="Contact Commercial" ${membre.role === 'Contact Commercial' ? 'selected' : ''}>Contact Commercial</option>
                        </select>
                    </div>
                    <div class="form-group w-full mb-0">
                        <label class="form-label" style="font-size: 0.75rem;">Nom complet</label>
                        <input type="text" class="form-control membre-nom" value="${membre.nom}" required>
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="form-group w-full mb-0">
                        <label class="form-label" style="font-size: 0.75rem;">Email</label>
                        <input type="email" class="form-control membre-email" value="${membre.email}" required>
                    </div>
                    <div class="form-group w-full mb-0">
                        <label class="form-label" style="font-size: 0.75rem;">Téléphone</label>
                        <input type="tel" class="form-control membre-tel" value="${membre.tel}" required>
                    </div>
                </div>
            </div>
        `;
    };

    const attachRemoveEvents = () => {
        document.querySelectorAll('.btn-remove-membre').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                document.getElementById(`membre-${id}`).remove();
            });
        });
    };

    document.getElementById('btnAddMembre').addEventListener('click', () => {
        equipeContainer.insertAdjacentHTML('beforeend', createMembreHTML());
        attachRemoveEvents();
    });

    const loadData = () => {
        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        
        const societes = societesStore.getAll(filters);
        const tbody = document.getElementById('societesBody');
        
        if (societes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">Aucune société trouvée.</td></tr>`;
            return;
        }

        tbody.innerHTML = societes.map(s => {
            const marche = marchesStore.getById(s.marche_id);
            
            // Build team list
            let equipeHtml = '<span class="text-muted text-sm">Aucun membre</span>';
            if (s.equipe && s.equipe.length > 0) {
                equipeHtml = s.equipe.map(m => `
                    <div class="mb-1">
                        <span class="badge badge-neutral" style="font-size: 0.65rem;">${m.role}</span>
                        <span style="font-weight: 500; font-size: 0.85rem; margin-left: 0.25rem;">${m.nom}</span>
                        <div class="text-muted" style="font-size: 0.75rem; margin-left: 0.5rem;">${m.tel} | ${m.email}</div>
                    </div>
                `).join('');
            }

            return `
            <tr>
                <td style="font-weight: 500; color: #0f172a; vertical-align: top;">${s.nom || s.raison_sociale || 'Sans nom'}</td>
                <td style="vertical-align: top;"><span class="badge badge-info">${marche ? marche.numero_marche : 'Inconnu'}</span></td>
                <td style="vertical-align: top;">${equipeHtml}</td>
                <td style="vertical-align: top;">
                    <div class="action-group" style="display: flex; gap: 0.25rem; justify-content: flex-end;">
                        <button class="btn-action-icon btn-edit" data-id="${s.id}" title="Éditer" style="color: #4f46e5;">
                            ${ICONS.edit}
                        </button>
                        <button class="btn-action-icon btn-delete" data-id="${s.id}" title="Supprimer" style="color: #ef4444;">
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
                    societesStore.delete(id);
                    loadData();
                });
            });
        });
    };

    // Modal Handling
    const modal = document.getElementById('societeModal');
    const form = document.getElementById('societeForm');
    
    const openModal = (id = null) => {
        form.reset();
        document.getElementById('societeId').value = '';
        document.getElementById('modalTitle').textContent = 'Nouvelle Société';
        equipeContainer.innerHTML = ''; // Clear members
        populateMarches();

        if (id) {
            const s = societesStore.getById(id);
            if (s) {
                document.getElementById('modalTitle').textContent = 'Modifier la Société';
                document.getElementById('societeId').value = s.id;
                document.getElementById('nom').value = s.nom || s.raison_sociale || '';
                document.getElementById('marche_id').value = s.marche_id || '';
                
                // Populate team
                if (s.equipe && s.equipe.length > 0) {
                    s.equipe.forEach(m => {
                        equipeContainer.insertAdjacentHTML('beforeend', createMembreHTML(m));
                    });
                } else {
                    // Fallback for old data structure if it exists
                    if (s.chef_projet_nom) {
                        equipeContainer.insertAdjacentHTML('beforeend', createMembreHTML({
                            role: 'Chef de Projet', nom: s.chef_projet_nom, email: s.chef_projet_email, tel: s.chef_projet_tel
                        }));
                    }
                    if (s.technicien_nom) {
                        equipeContainer.insertAdjacentHTML('beforeend', createMembreHTML({
                            role: 'Technicien', nom: s.technicien_nom, email: s.technicien_email, tel: s.technicien_tel
                        }));
                    }
                }
            }
        } else {
            // Add at least one member by default for new creations
            equipeContainer.insertAdjacentHTML('beforeend', createMembreHTML({ role: 'Chef de Projet', nom: '', email: '', tel: '' }));
        }
        
        attachRemoveEvents();
        modal.classList.add('active');
    };

    const closeModal = () => modal.classList.remove('active');

    document.getElementById('btnNewSociete').addEventListener('click', () => openModal());
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancel').addEventListener('click', closeModal);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectedMarcheId = document.getElementById('marche_id').value;
        const marche = marchesStore.getById(selectedMarcheId);
        
        const realAirportId = currentAirportId === 'all' && marche 
            ? marche.airport_id 
            : currentAirportId;

        // Serialize Equipe
        const equipe = [];
        document.querySelectorAll('.equipe-member').forEach(el => {
            equipe.push({
                role: el.querySelector('.membre-role').value,
                nom: el.querySelector('.membre-nom').value,
                email: el.querySelector('.membre-email').value,
                tel: el.querySelector('.membre-tel').value
            });
        });

        const data = {
            airport_id: realAirportId,
            marche_id: selectedMarcheId,
            nom: document.getElementById('nom').value,
            equipe: equipe
        };

        const id = document.getElementById('societeId').value;
        if (id) {
            societesStore.update(id, data);
        } else {
            societesStore.create(data);
        }

        closeModal();
        loadData();
    });

    loadData();

    window.addEventListener('airport-change', () => {
        renderSocietes(container);
    }, { once: true });
}
