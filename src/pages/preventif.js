/**
 * Amnt — Preventif Page (Premium Light Theme)
 */
import { preventifStore, reclamationsStore, societesStore, equipementsStore, marchesStore, periodStore } from '../services/store.js';
import { auth } from '../services/auth.js';
import { kpi } from '../services/kpi.js';

// SVG icon helpers
const ICONS = {
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`
};

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
            <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 1.25rem;">
                Êtes-vous sûr de vouloir supprimer cette intervention ?
            </p>
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

export function renderPreventif(container) {
    const currentAirportId = auth.getCurrentAirportId();
    
    container.innerHTML = `
        <style>
            @keyframes pulse-ring {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
                70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
            }
            .preventif-tooltip-container {
                position: relative;
                display: inline-flex;
                align-items: center;
            }
            .preventif-tooltip-text {
                visibility: hidden;
                width: 250px;
                background-color: #0f172a;
                color: #ffffff;
                text-align: center;
                border-radius: 8px;
                padding: 0.625rem 0.875rem;
                position: absolute;
                z-index: 100;
                bottom: 135%;
                left: 50%;
                transform: translateX(-50%);
                opacity: 0;
                transition: opacity 150ms ease, transform 150ms ease;
                font-size: 0.75rem;
                font-weight: 500;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
                line-height: 1.4;
                pointer-events: none;
            }
            .preventif-tooltip-container:hover .preventif-tooltip-text {
                visibility: visible;
                opacity: 1;
                transform: translateX(-50%) translateY(-2px);
            }
            .preventif-tooltip-text::after {
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -6px;
                border-width: 6px;
                border-style: solid;
                border-color: #0f172a transparent transparent transparent;
            }
        </style>

        <div class="flex justify-between items-center mb-6">
            <div>
                <h1>Maintenance Préventive</h1>
                <p class="mb-0">Suivi et planification de toutes les interventions prestataires</p>
            </div>
            <button id="btnNewPreventif" class="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Ajouter
            </button>
        </div>

        <div id="preventifAlertsContainer"></div>

        <!-- Filter Card -->
        <div class="card mb-6" style="padding: 0.75rem 1.25rem;">
            <div class="flex gap-4 items-center">
                <div class="form-group w-full max-w-xs mb-0">
                    <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.25rem;">Filtrer par Période</label>
                    <select id="filterPeriod" class="form-control">
                        <option value="all">Tout afficher (Année en cours)</option>
                        <optgroup label="Par Trimestre">
                            <option value="T1">Trimestre 1 (Jan - Mar)</option>
                            <option value="T2">Trimestre 2 (Avr - Juin)</option>
                            <option value="T3">Trimestre 3 (Juil - Sept)</option>
                            <option value="T4">Trimestre 4 (Oct - Déc)</option>
                        </optgroup>
                        <optgroup label="Par Mois">
                            <option value="01">Janvier</option><option value="02">Février</option><option value="03">Mars</option>
                            <option value="04">Avril</option><option value="05">Mai</option><option value="06">Juin</option>
                            <option value="07">Juillet</option><option value="08">Août</option><option value="09">Septembre</option>
                            <option value="10">Octobre</option><option value="11">Novembre</option><option value="12">Décembre</option>
                        </optgroup>
                    </select>
                </div>
            </div>
        </div>

        <div id="viewContent" class="mb-8"></div>

        <!-- Modal -->
        <div id="preventifModal" class="modal-overlay">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 id="modalTitle">Intervention Préventive</h2>
                    <button class="modal-close" id="btnCloseModal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <form id="preventifForm">
                    <div class="modal-body">
                        <input type="hidden" id="preventifId">
                        
                        <div class="form-group w-full">
                            <label class="form-label">Société Prestataire</label>
                            <select id="societeModalSelect" class="form-control" required></select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Titre / Objet de la visite</label>
                            <input type="text" id="titre" class="form-control" required placeholder="Ex: Visite Trimestrielle TGBT">
                        </div>

                        <div class="flex gap-4">
                            <div class="form-group w-full">
                                <label class="form-label">Date planifiée</label>
                                <input type="date" id="date_planifiee" class="form-control" required>
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Date réalisée</label>
                                <input type="date" id="date_realisee" class="form-control">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Statut</label>
                            <select id="statut" class="form-control" required>
                                <option value="PLANIFIEE">Planifiée (À faire)</option>
                                <option value="REALISEE">Réalisée (Terminée)</option>
                                <option value="ANNULEE">Annulée</option>
                            </select>
                        </div>

                        <div class="form-group mb-0">
                            <label class="form-label">Observations</label>
                            <textarea id="observations" class="form-control" rows="3"></textarea>
                        </div>
                        
                        <div class="text-right mt-3 hidden" id="deleteContainer">
                            <button type="button" id="btnDeleteEvent" style="color: #dc2626; background: transparent; border: none; font-size: 0.8125rem; font-weight: 500; cursor: pointer; padding: 0;">Supprimer cette intervention</button>
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

    const societeModalSelect = document.getElementById('societeModalSelect');

    const populateSocietes = () => {
        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        const societes = societesStore.getAll(filters);
        societeModalSelect.innerHTML = societes.length > 0 
            ? '<option value="">-- Sélectionnez une société --</option>' 
            : '<option value="">-- Aucune société trouvée --</option>';
        societes.forEach(s => {
            societeModalSelect.innerHTML += `<option value="${s.id}">${s.nom || s.raison_sociale}</option>`;
        });
    };

    const getSocieteName = (societeId) => {
        const s = societesStore.getById(societeId);
        return s ? (s.nom || s.raison_sociale) : 'Société Inconnue';
    };

    const formatDateFR = (dStr) => {
        if (!dStr) return '-';
        const parts = dStr.split('T')[0].split('-');
        if (parts.length !== 3) return dStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const getInterventionDetails = (e) => {
        const societe = societesStore.getById(e.societe_id);
        const marche = societe ? marchesStore.getById(societe.marche_id) : null;
        const eqs = societe ? equipementsStore.getAll({ societe_id: e.societe_id }) : [];
        
        const nomEquipement = eqs.length > 0 
            ? (eqs[0].nom_equipement || eqs[0].designation) 
            : 'Équipements contractuels';
        const numeroMarche = marche ? marche.numero_marche : 'Non spécifié';
        
        return { nomEquipement, numeroMarche };
    };

    const renderTable = () => {
        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        
        const allEvents = preventifStore.getAll(filters).sort((a, b) => {
            const dateA = a.date_planifiee || '';
            const dateB = b.date_planifiee || '';
            return new Date(dateB) - new Date(dateA);
        });

        // 1. Calculate active alerts (interventions in <= 3 days, still planned)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeAlerts = allEvents.filter(e => {
            if (e.statut !== 'PLANIFIEE') return false;
            const planDate = new Date(e.date_planifiee);
            planDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((planDate - today) / (1000 * 60 * 60 * 24));
            e.daysLeft = diffDays;
            return diffDays <= 3;
        }).sort((a, b) => a.daysLeft - b.daysLeft);

        // 2. Render dynamic notification banner at the top
        const alertsContainer = document.getElementById('preventifAlertsContainer');
        if (alertsContainer) {
            if (activeAlerts.length > 0) {
                alertsContainer.innerHTML = `
                    <div class="card mb-6" style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: var(--radius-xl); padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: var(--shadow-sm);">
                        <div style="display: flex; gap: 0.875rem; align-items: flex-start;">
                            <div style="width: 42px; height: 42px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; color: #dc2626; position: relative; flex-shrink: 0; animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                <span style="position: absolute; top: -3px; right: -3px; width: 20px; height: 20px; border-radius: 50%; background: #dc2626; color: white; font-size: 0.6875rem; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid #fef2f2;">${activeAlerts.length}</span>
                            </div>
                            <div style="flex-grow: 1; min-width: 0;">
                                <h3 style="color: #991b1b; font-size: 0.9375rem; margin-top: 0.125rem; margin-bottom: 0.5rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                    <span>Rappels de maintenance préventive</span>
                                    <span style="background: #dc2626; color: white; font-size: 0.725rem; font-weight: 700; padding: 0.125rem 0.5rem; border-radius: 9999px; display: inline-flex; align-items: center;">
                                        ${activeAlerts.length} ${activeAlerts.length === 1 ? 'intervention à venir' : 'interventions à venir'}
                                    </span>
                                </h3>
                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                    ${activeAlerts.map(alert => {
                                        const { numeroMarche } = getInterventionDetails(alert);
                                        const nomSociete = getSocieteName(alert.societe_id);
                                        const daysLeft = alert.daysLeft;
                                        const timeDetail = daysLeft < 0 
                                            ? ` - en retard de ${Math.abs(daysLeft)} jours` 
                                            : daysLeft === 0 
                                                ? ` - aujourd'hui`
                                                : ` - dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`;
                                        return `
                                            <div style="background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(252, 165, 165, 0.3); border-radius: 8px; padding: 0.625rem 0.875rem; font-size: 0.8125rem; color: #451a03; display: flex; gap: 0.5rem; align-items: flex-start; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02); line-height: 1.4;">
                                                <span style="color: #dc2626; flex-shrink: 0; margin-top: 0.125rem;">⚠️</span>
                                                <div style="min-width: 0; flex: 1;">
                                                    Rappel : L'intervention préventive par la société <strong style="color: #1e293b;">${nomSociete}</strong> pour le marché <strong style="color: #1e293b;">${numeroMarche}</strong> est planifiée le <strong style="color: #1e293b;">${formatDateFR(alert.date_planifiee)}</strong> (dans moins de 3 jours${timeDetail}).
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                alertsContainer.innerHTML = '';
            }
        }

        const selectedPeriod = periodStore.getPeriod();

        const filteredEvents = allEvents.filter(item => {
            return kpi.isDateInPeriod(item.date_planifiee, selectedPeriod);
        });

        const viewContent = document.getElementById('viewContent');

        if (filteredEvents.length === 0) {
            viewContent.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <p>Aucune intervention préventive trouvée pour la période sélectionnée.</p>
                </div>`;
            return;
        }

        let rowsHtml = filteredEvents.map(e => {
            let statusBadge = 'neutral';
            if (e.statut === 'REALISEE') statusBadge = 'success';
            if (e.statut === 'PLANIFIEE') statusBadge = 'info';
            if (e.statut === 'ANNULEE') statusBadge = 'danger';

            let prrBadgeHtml = '<span class="badge badge-neutral">-</span>';
            if (e.statut === 'REALISEE') {
                const isIncluded = e.date_realisee && e.date_realisee <= e.date_planifiee;
                prrBadgeHtml = isIncluded 
                    ? '<span class="badge badge-success">100%</span>' 
                    : '<span class="badge badge-danger">0%</span>';
            }

            // Row highlighting & tooltip construction
            const planDate = new Date(e.date_planifiee);
            planDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((planDate - today) / (1000 * 60 * 60 * 24));
            const isAlertActive = diffDays <= 3 && e.statut === 'PLANIFIEE';
            
            const rowBgStyle = isAlertActive ? 'background-color: #fdfaf2; transition: background-color 200ms;' : '';
            let titleHtml = `<span style="font-weight: 500; color: #0f172a;">${e.titre || 'Intervention'}</span>`;
            
            if (isAlertActive) {
                const tooltipText = diffDays < 0 
                    ? `Rappel : Intervention en retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}` 
                    : diffDays === 0
                        ? `Rappel : Intervention prévue aujourd'hui`
                        : `Rappel : Intervention prévue dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

                titleHtml = `
                    <div class="preventif-tooltip-container" style="display: flex; align-items: center; gap: 0.375rem;">
                        <span style="font-weight: 600; color: #b45309;">${e.titre || 'Intervention'}</span>
                        <span style="color: #dc2626; display: inline-flex; align-items: center; cursor: help;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        </span>
                        <div class="preventif-tooltip-text">${tooltipText}</div>
                    </div>
                `;
            }

            return `
                <tr style="${rowBgStyle}">
                    <td style="vertical-align: middle;">${titleHtml}</td>
                    <td style="vertical-align: middle;">${getSocieteName(e.societe_id)}</td>
                    <td style="vertical-align: middle;">${formatDateFR(e.date_planifiee)}</td>
                    <td style="vertical-align: middle;">${formatDateFR(e.date_realisee)}</td>
                    <td style="vertical-align: middle;">${prrBadgeHtml}</td>
                    <td style="vertical-align: middle;"><span class="badge badge-${statusBadge}">${e.statut}</span></td>
                    <td style="vertical-align: middle; width: 120px; min-width: 120px;">
                        <div class="action-group" style="display: flex; gap: 0.25rem; justify-content: flex-end;">
                            <button class="btn-action-icon btn-edit" data-id="${e.id}" title="Éditer" style="color: #4f46e5; border: none; background: transparent; cursor: pointer; padding: 4px;">
                                ${ICONS.edit}
                            </button>
                            <button class="btn-action-icon btn-delete" data-id="${e.id}" title="Supprimer" style="color: #ef4444; border: none; background: transparent; cursor: pointer; padding: 4px;">
                                ${ICONS.trash}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        viewContent.innerHTML = `
            <div class="table-container">
                <div class="overflow-x-auto w-full">
                    <table class="table min-w-[1000px]">
                        <thead>
                            <tr>
                                <th>Titre de l'intervention</th>
                                <th>Société Prestataire</th>
                                <th>Date Planifiée</th>
                                <th>Date Réalisée</th>
                                <th>PRR</th>
                                <th>Statut</th>
                                <th style="width: 120px; min-width: 120px; text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;

        viewContent.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.getAttribute('data-id')));
        });
        viewContent.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                confirmDelete(() => { preventifStore.delete(id); refreshViews(); });
            });
        });
    };

    const refreshViews = () => { renderTable(); };

    const modal = document.getElementById('preventifModal');
    const form = document.getElementById('preventifForm');
    const datePlanifiee = document.getElementById('date_planifiee');
    const dateRealisee = document.getElementById('date_realisee');
    
    const openModal = (id = null, defaultDate = null) => {
        form.reset();
        document.getElementById('preventifId').value = '';
        document.getElementById('modalTitle').textContent = "Nouvelle Intervention";
        document.getElementById('statut').value = 'PLANIFIEE';
        document.getElementById('deleteContainer').classList.add('hidden');
        document.getElementById('societeModalSelect').value = '';
        datePlanifiee.value = '';
        dateRealisee.value = '';

        if (defaultDate) datePlanifiee.value = defaultDate.split('T')[0];

        if (id) {
            const p = preventifStore.getById(id);
            if (p) {
                document.getElementById('modalTitle').textContent = "Détails de l'Intervention";
                document.getElementById('preventifId').value = p.id;
                document.getElementById('societeModalSelect').value = p.societe_id;
                document.getElementById('titre').value = p.titre || 'Intervention';
                if (p.date_planifiee) datePlanifiee.value = p.date_planifiee.split('T')[0];
                if (p.date_realisee) dateRealisee.value = p.date_realisee.split('T')[0];
                document.getElementById('statut').value = p.statut || 'PLANIFIEE';
                document.getElementById('observations').value = p.observations || '';
                document.getElementById('deleteContainer').classList.remove('hidden');
            }
        }
        modal.classList.add('active');
    };

    const closeModal = () => modal.classList.remove('active');

    document.getElementById('btnNewPreventif').addEventListener('click', () => openModal(null, new Date().toISOString().substring(0, 10)));
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancel').addEventListener('click', closeModal);

    document.getElementById('btnDeleteEvent').addEventListener('click', () => {
        const id = document.getElementById('preventifId').value;
        if (id) { confirmDelete(() => { preventifStore.delete(id); closeModal(); refreshViews(); }); }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const socId = societeModalSelect.value;
        const societe = societesStore.getById(socId);
        const airportId = societe ? societe.airport_id : currentAirportId;

        const data = {
            airport_id: airportId,
            societe_id: socId,
            titre: document.getElementById('titre').value,
            date_planifiee: document.getElementById('date_planifiee').value,
            date_realisee: document.getElementById('date_realisee').value || null,
            statut: document.getElementById('statut').value,
            observations: document.getElementById('observations').value
        };

        if (data.date_realisee && data.statut === 'PLANIFIEE') data.statut = 'REALISEE';

        const id = document.getElementById('preventifId').value;
        if (id) { preventifStore.update(id, data); } else { preventifStore.create(data); }
        closeModal();
        refreshViews();
    });

    populateSocietes();
    
    const filterPeriodSelect = document.getElementById('filterPeriod');
    filterPeriodSelect.value = periodStore.getPeriod();

    filterPeriodSelect.addEventListener('change', (e) => { periodStore.setPeriod(e.target.value); });

    const onPeriodChange = (e) => { filterPeriodSelect.value = e.detail.period; renderTable(); };
    const onAirportChange = () => { renderPreventif(container); };
    const onStoreChanged = (e) => { if (e.detail.collection === 'preventif' || e.detail.collection === 'societes') { refreshViews(); } };

    window.addEventListener('period-change', onPeriodChange);
    window.addEventListener('airport-change', onAirportChange, { once: true });
    window.addEventListener('store-changed', onStoreChanged);

    const cleanup = () => {
        window.removeEventListener('period-change', onPeriodChange);
        window.removeEventListener('airport-change', onAirportChange);
        window.removeEventListener('store-changed', onStoreChanged);
        window.removeEventListener('page-destroy', cleanup);
    };
    window.addEventListener('page-destroy', cleanup);

    refreshViews();
}
