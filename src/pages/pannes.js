/**
 * Amnt — Pannes (Corrective) Page (Premium Light Theme)
 */
import { pannesStore, equipementsStore, societesStore, marchesStore, periodStore } from '../services/store.js';
import { auth } from '../services/auth.js';
import { kpi } from '../services/kpi.js';

// SVG icon helpers
const ICONS = {
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    x: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
};

// Confirmation modal helper
function confirmDelete(onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
        <div class="modal" style="max-width: 400px; text-align: center; padding: 2rem;">
            <div style="margin-bottom: 1rem;">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" style="margin: 0 auto;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </div>
            <h3 style="margin-bottom: 0.375rem; color: #0f172a; font-size: 1rem;">Confirmer la suppression</h3>
            <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 1.25rem;">Êtes-vous sûr de vouloir supprimer cette panne ?</p>
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

export function renderPannes(container) {
    let currentAirportId = auth.getCurrentAirportId() || 'all';
    let currentSocieteId = 'all';
    const isSuperviseur = auth.isSuperAdmin() || auth.isSuperviseur();
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1>Gestion des Pannes</h1>
                <p class="mb-0">Enregistrement des temps d'arrêt pour calcul de la Disponibilité</p>
            </div>
            <button id="btnNewPanne" class="btn btn-danger">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Déclarer une Panne
            </button>
        </div>

        <!-- Filter Card -->
        <div id="filterContainer"></div>

        <div id="viewContent" class="mb-8"></div>

        <!-- Modal Panne -->
        <div id="panneModal" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2 id="modalTitle">Déclaration de Panne</h2>
                    <button class="modal-close" id="btnCloseModal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <form id="panneForm">
                    <div class="modal-body">
                        <input type="hidden" id="panneId">
                        
                        <div class="form-group">
                            <label class="form-label">Équipement en panne</label>
                            <select id="equipementId" class="form-control" required></select>
                            <div id="equipementInfo" class="mt-2" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem; font-size: 0.8125rem; display: none;">
                                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                    <div><span style="color: #64748b; font-weight: 500;">Société :</span> <span id="eqInfoSociete" style="font-weight: 500; color: #0f172a;">-</span></div>
                                    <div><span style="color: #64748b; font-weight: 500;">Marché :</span> <span id="eqInfoMarche" style="font-weight: 500; color: #0f172a;">-</span></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">T_panne (Horodatage exact)</label>
                            <input type="datetime-local" id="tPanne" class="form-control" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Description du problème <span style="font-weight: 400; color: #94a3b8;">(Optionnel)</span></label>
                            <textarea id="description" class="form-control" rows="2"></textarea>
                        </div>
                        
                        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 1.25rem 0;" />
                        <h3 style="font-size: 0.875rem; color: #374151;">Clôture (Remise en service)</h3>
                        
                        <div class="form-group">
                            <label class="form-label">T_reprise</label>
                            <input type="datetime-local" id="tReprise" class="form-control">
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

    const populateEquipements = () => {
        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        const eqs = equipementsStore.getAll(filters);
        const select = document.getElementById('equipementId');
        select.innerHTML = '<option value="">-- Sélectionner un équipement --</option>';
        eqs.forEach(e => {
            select.innerHTML += `<option value="${e.id}">[${e.nom_equipement}] ${e.designation}</option>`;
        });
    };

    const updateEquipementInfo = () => {
        const select = document.getElementById('equipementId');
        const infoDiv = document.getElementById('equipementInfo');
        const eqId = select.value;
        if (!eqId) { infoDiv.style.display = 'none'; return; }
        const eq = equipementsStore.getById(eqId);
        if (!eq) { infoDiv.style.display = 'none'; return; }
        const societe = societesStore.getById(eq.societe_id);
        const marche = marchesStore.getById(eq.marche_id);
        document.getElementById('eqInfoSociete').textContent = societe ? (societe.nom || societe.raison_sociale) : 'Aucun prestataire';
        document.getElementById('eqInfoMarche').textContent = marche ? `${marche.numero_marche} - ${marche.objet}` : 'Aucun marché';
        infoDiv.style.display = 'block';
    };

    const loadData = () => {
        let panneFilters = {};
        if (currentAirportId !== 'all') panneFilters.airport_id = currentAirportId;
        const pannes = pannesStore.getAll(panneFilters).sort((a, b) => new Date(b.t_panne) - new Date(a.t_panne));
        const equipements = equipementsStore.getAll();
        
        let societes = societesStore.getAll();
        if (currentAirportId !== 'all') {
            const activeSocieteIds = new Set(equipements.filter(e => e.airport_id === currentAirportId).map(e => e.societe_id));
            societes = societes.filter(s => activeSocieteIds.has(s.id));
        }
        
        const selectedPeriod = periodStore.getPeriod();
        const now = new Date();
        const currentYear = now.getFullYear();

        const societeOptionsHtml = `
            <option value="all" ${currentSocieteId === 'all' ? 'selected' : ''}>Toutes les sociétés</option>
            ${societes.map(s => `<option value="${s.id}" ${currentSocieteId === s.id ? 'selected' : ''}>${s.nom}</option>`).join('')}
        `;
        
        const periodOptionsHtml = `
            <option value="all" ${selectedPeriod === 'all' ? 'selected' : ''}>Tout afficher (Année en cours)</option>
            <option value="custom" ${selectedPeriod.startsWith('CUSTOM_') ? 'selected' : ''}>Période personnalisée...</option>
            <optgroup label="Par Trimestre">
                <option value="T1" ${selectedPeriod === 'T1' ? 'selected' : ''}>Trimestre 1 (Jan - Mar)</option>
                <option value="T2" ${selectedPeriod === 'T2' ? 'selected' : ''}>Trimestre 2 (Avr - Juin)</option>
                <option value="T3" ${selectedPeriod === 'T3' ? 'selected' : ''}>Trimestre 3 (Juil - Sept)</option>
                <option value="T4" ${selectedPeriod === 'T4' ? 'selected' : ''}>Trimestre 4 (Oct - Déc)</option>
            </optgroup>
            <optgroup label="Par Mois">
                <option value="01" ${selectedPeriod === '01' ? 'selected' : ''}>Janvier</option>
                <option value="02" ${selectedPeriod === '02' ? 'selected' : ''}>Février</option>
                <option value="03" ${selectedPeriod === '03' ? 'selected' : ''}>Mars</option>
                <option value="04" ${selectedPeriod === '04' ? 'selected' : ''}>Avril</option>
                <option value="05" ${selectedPeriod === '05' ? 'selected' : ''}>Mai</option>
                <option value="06" ${selectedPeriod === '06' ? 'selected' : ''}>Juin</option>
                <option value="07" ${selectedPeriod === '07' ? 'selected' : ''}>Juillet</option>
                <option value="08" ${selectedPeriod === '08' ? 'selected' : ''}>Août</option>
                <option value="09" ${selectedPeriod === '09' ? 'selected' : ''}>Septembre</option>
                <option value="10" ${selectedPeriod === '10' ? 'selected' : ''}>Octobre</option>
                <option value="11" ${selectedPeriod === '11' ? 'selected' : ''}>Novembre</option>
                <option value="12" ${selectedPeriod === '12' ? 'selected' : ''}>Décembre</option>
            </optgroup>
        `;

        document.getElementById('filterContainer').innerHTML = `
            <div class="card mb-6" style="padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; flex: 1; align-items: flex-end;">
                    <div class="form-group mb-0">
                        <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.25rem;">Période d'analyse</label>
                        <select id="periodFilter" class="form-control" style="min-width: 200px; font-weight: 500; color: #0f172a;">
                            ${periodOptionsHtml}
                        </select>
                    </div>
                    <div id="customDateRange" style="display: ${selectedPeriod.startsWith('CUSTOM_') ? 'flex' : 'none'}; gap: 0.5rem; align-items: center;">
                        <div class="form-group mb-0">
                            <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.25rem;">Du</label>
                            <input type="date" id="customStartDate" class="form-control" style="padding: 0.375rem 0.75rem;" value="${selectedPeriod.startsWith('CUSTOM_') ? selectedPeriod.split('_')[1] : ''}">
                        </div>
                        <div class="form-group mb-0">
                            <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.25rem;">Au</label>
                            <input type="date" id="customEndDate" class="form-control" style="padding: 0.375rem 0.75rem;" value="${selectedPeriod.startsWith('CUSTOM_') ? selectedPeriod.split('_')[2] : ''}">
                        </div>
                        <button id="btnApplyCustomDate" class="btn btn-secondary" style="padding: 0.375rem 0.75rem; align-self: flex-end; height: 38px;">Filtrer</button>
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.25rem;">Société</label>
                        <select id="societeFilter" class="form-control" style="min-width: 200px; font-weight: 500; color: #0f172a;">
                            ${societeOptionsHtml}
                        </select>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('periodFilter')?.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'custom') {
                document.getElementById('customDateRange').style.display = 'flex';
            } else {
                document.getElementById('customDateRange').style.display = 'none';
                periodStore.setPeriod(val);
                loadData();
            }
        });

        document.getElementById('btnApplyCustomDate')?.addEventListener('click', () => {
            const start = document.getElementById('customStartDate').value;
            const end = document.getElementById('customEndDate').value;
            if (start && end) {
                if (start > end) {
                    alert("La date de début doit être antérieure à la date de fin.");
                    return;
                }
                periodStore.setPeriod(`CUSTOM_${start}_${end}`);
                loadData();
            } else {
                alert("Veuillez sélectionner les deux dates.");
            }
        });

        document.getElementById('societeFilter')?.addEventListener('change', (e) => {
            currentSocieteId = e.target.value;
            loadData();
        });

        const filteredPannes = pannes.filter(item => {
            if (currentSocieteId !== 'all') {
                const eq = equipements.find(e => e.id === item.equipement_id);
                if (!eq || eq.societe_id !== currentSocieteId) return false;
            }

            if (selectedPeriod === 'all') return true;
            
            let periodStartStr, periodEndStr;
            
            if (selectedPeriod.startsWith('CUSTOM_')) {
                const parts = selectedPeriod.split('_');
                if (parts.length >= 3) {
                    periodStartStr = parts[1] + 'T00:00:00';
                    periodEndStr = parts[2] + 'T23:59:59';
                } else return false;
            } else if (selectedPeriod.startsWith('T')) {
                const quarter = parseInt(selectedPeriod.substring(1), 10);
                const startMonth = (quarter - 1) * 3 + 1;
                const endMonth = startMonth + 2;
                periodStartStr = `${currentYear}-${String(startMonth).padStart(2, '0')}-01T00:00:00`;
                const lastDay = new Date(currentYear, endMonth, 0).getDate();
                periodEndStr = `${currentYear}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59`;
            } else {
                const month = selectedPeriod;
                periodStartStr = `${currentYear}-${month}-01T00:00:00`;
                const lastDay = new Date(currentYear, parseInt(month, 10), 0).getDate();
                periodEndStr = `${currentYear}-${month}-${String(lastDay).padStart(2, '0')}T23:59:59`;
            }

            const panneStart = item.t_panne;
            const panneEnd = item.t_reprise || new Date().toISOString();
            
            if (!panneStart) return false;
            return panneStart <= periodEndStr && panneEnd >= periodStartStr;
        });

        let periodStr = currentYear.toString();
        let periodLabel = "Année " + currentYear;
        
        if (selectedPeriod !== 'all') {
            if (selectedPeriod.startsWith('CUSTOM_')) {
                const parts = selectedPeriod.split('_');
                periodStr = selectedPeriod;
                if (parts.length >= 3) {
                    const format = (d) => {
                        const dp = d.split('-');
                        return `${dp[2]}/${dp[1]}/${dp[0]}`;
                    };
                    periodLabel = `Du ${format(parts[1])} au ${format(parts[2])}`;
                } else {
                    periodLabel = "Période personnalisée";
                }
            } else if (selectedPeriod.startsWith('T')) {
                const q = parseInt(selectedPeriod.substring(1), 10);
                periodStr = `${currentYear}-Q${q}`;
                periodLabel = `Trimestre ${q}`;
            } else {
                periodStr = `${currentYear}-${selectedPeriod}`;
                const month = parseInt(selectedPeriod, 10);
                const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                periodLabel = `${months[month - 1]} ${currentYear}`;
            }
        }

        const kpiResult = kpi.calculateDisponibilite(currentAirportId, { 
            period: periodStr,
            societeId: currentSocieteId 
        });
        const disponibilite = kpiResult.disponibilite !== null ? kpiResult.disponibilite : 100;

        let iconColor = '#059669'; 
        let bgHex = '#d1fae5';
        if (disponibilite < 95) {
            iconColor = '#dc2626'; 
            bgHex = '#fee2e2';
        } else if (disponibilite < 98) {
            iconColor = '#d97706'; 
            bgHex = '#fef3c7';
        }

        const formatDuree = (mins) => {
            if (!mins || mins === 0) return "0 min";
            const roundedMins = Math.round(mins);
            const d = Math.floor(roundedMins / (60 * 24));
            const h = Math.floor((roundedMins % (60 * 24)) / 60);
            const m = roundedMins % 60;
            
            if (d > 0) {
                return m > 0 ? `${d}j ${h}h ${m}m` : `${d}j ${h}h`;
            }
            return h > 0 ? `${h}h ${m}m` : `${m} min`;
        };
        const arretFormat = kpiResult.arretMins ? formatDuree(kpiResult.arretMins) : "0 min";
        
        const kpiHtml = `
            <div class="card mb-6" style="padding: 1.5rem; display: flex; flex-direction: column; border-left: 4px solid ${iconColor};">
                <div style="display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 1.25rem;">
                        <div style="background: ${bgHex}; padding: 0.875rem; border-radius: 50%; color: ${iconColor}; display: flex; align-items: center; justify-content: center;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div>
                            <h3 style="font-size: 0.875rem; font-weight: 600; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">Disponibilité ${periodLabel}</h3>
                            <div style="font-size: 2rem; font-weight: 700; color: #0f172a; line-height: 1.2;">${disponibilite.toFixed(1)}%</div>
                        </div>
                    </div>
                    <div style="height: 40px; width: 1px; background: #e2e8f0;"></div>
                    <div>
                        <h3 style="font-size: 0.875rem; font-weight: 600; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">Temps d'Arrêt Total</h3>
                        <div style="font-size: 1.5rem; font-weight: 600; color: #ef4444; line-height: 1.2; font-family: var(--font-mono, monospace);">
                            ${arretFormat}
                            <span style="font-size: 0.875rem; color: #94a3b8; font-weight: 500; margin-left: 0.25rem;">(${Math.round((kpiResult.arretMins || 0) / 60)} h)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const viewContent = document.getElementById('viewContent');

        if (filteredPannes.length === 0) {
            viewContent.innerHTML = kpiHtml + `
                <div class="empty-state">
                    <p>Aucune panne trouvée pour la période sélectionnée.</p>
                </div>`;
            return;
        }

        let rowsHtml = filteredPannes.map(p => {
            const eq = equipementsStore.getById(p.equipement_id);
            const formatDate = (isoString) => {
                if (!isoString) return '-';
                const d = new Date(isoString);
                return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            };
            let dureeStr = '-';
            if (p.t_reprise) {
                const start = new Date(p.t_panne);
                const end = new Date(p.t_reprise);
                const diffMins = Math.floor((end - start) / (1000 * 60));
                if (diffMins >= 0) {
                    dureeStr = formatDuree(diffMins);
                }
            } else if (p.statut !== 'RESOLUE') {
                const nowDate = new Date();
                const start = new Date(p.t_panne);
                const diffMins = Math.floor((nowDate - start) / (1000 * 60));
                if (diffMins >= 0) {
                    dureeStr = `<span style="color: #d97706;">En cours (${formatDuree(diffMins)})</span>`;
                }
            }
            let statusBadge = 'warning';
            if (p.statut === 'OUVERTE') statusBadge = 'danger';
            if (p.statut === 'RESOLUE') statusBadge = 'success';

            const actionHtml = isSuperviseur
                ? `<div class="action-group" style="display: flex; gap: 0.25rem; justify-content: flex-end; align-items: center;">
                      ${p.statut !== 'RESOLUE' ? `
                      <button class="btn-action-icon btn-close-panne" data-id="${p.id}" title="Clôturer la panne" style="color: #10b981;">
                          ${ICONS.check}
                      </button>` : ''}
                      <button class="btn-action-icon btn-edit" data-id="${p.id}" title="${p.statut === 'RESOLUE' ? 'Voir' : 'Éditer'}" style="color: #4f46e5;">
                          ${p.statut === 'RESOLUE' ? ICONS.eye : ICONS.edit}
                      </button>
                      <button class="btn-action-icon btn-delete" data-id="${p.id}" title="Supprimer" style="color: #ef4444;">
                          ${ICONS.trash}
                      </button>
                   </div>`
                : `<div class="action-group" style="display: flex; gap: 0.25rem; justify-content: flex-end; align-items: center;">
                      <button class="btn-action-icon btn-edit" data-id="${p.id}" title="${p.statut === 'RESOLUE' ? 'Voir' : 'Clôturer'}" style="color: #4f46e5;">
                          ${p.statut === 'RESOLUE' ? ICONS.eye : ICONS.edit}
                      </button>
                   </div>`;

            return `
                <tr>
                    <td>
                        <div style="font-weight: 500; color: #0f172a;">${eq ? eq.nom_equipement : 'Inconnu'}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">${eq ? eq.designation : ''}</div>
                    </td>
                    <td>${formatDate(p.t_panne)}</td>
                    <td>${formatDate(p.t_reprise)}</td>
                    <td style="font-family: var(--font-mono, monospace); font-size: 0.8125rem;">${dureeStr}</td>
                    <td><span class="badge badge-${statusBadge}">${p.statut}</span></td>
                    <td class="text-right">${actionHtml}</td>
                </tr>
            `;
        }).join('');

        viewContent.innerHTML = kpiHtml + `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Équipement</th>
                            <th>Début (T_panne)</th>
                            <th>Fin (T_reprise)</th>
                            <th>Durée d'arrêt</th>
                            <th>Statut</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;

        viewContent.querySelectorAll('.btn-close-panne').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.getAttribute('data-id'), true));
        });
        viewContent.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.getAttribute('data-id'), false));
        });
        viewContent.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                confirmDelete(() => {
                    deletePanne(id);
                    loadData();
                });
            });
        });
    };

    const modal = document.getElementById('panneModal');
    const form = document.getElementById('panneForm');
    
    const openModal = (id = null, isCloseOnly = false) => {
        form.reset();
        document.getElementById('panneId').value = '';
        document.getElementById('modalTitle').textContent = 'Déclarer une Panne';
        populateEquipements();
        document.getElementById('equipementId').disabled = false;
        document.getElementById('tPanne').disabled = false;
        document.getElementById('description').disabled = false;
        document.getElementById('tReprise').disabled = false;
        
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('tPanne').value = now.toISOString().slice(0, 16);
        document.getElementById('tReprise').value = '';
        
        if (id) {
            const p = pannesStore.getById(id);
            if (p) {
                document.getElementById('panneId').value = p.id;
                document.getElementById('equipementId').value = p.equipement_id;
                document.getElementById('tPanne').value = p.t_panne.slice(0, 16);
                if (p.t_reprise) document.getElementById('tReprise').value = p.t_reprise.slice(0, 16);
                document.getElementById('description').value = p.description || '';
                
                if (isCloseOnly) {
                    document.getElementById('modalTitle').textContent = 'Clôturer la panne';
                    if (!p.t_reprise) document.getElementById('tReprise').value = now.toISOString().slice(0, 16);
                    document.getElementById('equipementId').disabled = true;
                    document.getElementById('tPanne').disabled = true;
                    document.getElementById('description').disabled = true;
                } else {
                    if (p.statut === 'RESOLUE') {
                        if (isSuperviseur) {
                            document.getElementById('modalTitle').textContent = 'Modifier la Panne (Résolue)';
                        } else {
                            document.getElementById('modalTitle').textContent = 'Détails de la panne';
                            document.getElementById('equipementId').disabled = true;
                            document.getElementById('tPanne').disabled = true;
                            document.getElementById('description').disabled = true;
                            document.getElementById('tReprise').disabled = true;
                        }
                    } else {
                        document.getElementById('modalTitle').textContent = 'Modifier la Panne';
                    }
                }
            }
        }
        updateEquipementInfo();
        modal.classList.add('active');
    };

    const closeModal = () => modal.classList.remove('active');

    document.getElementById('btnNewPanne').addEventListener('click', () => openModal(null, false));
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancel').addEventListener('click', closeModal);
    document.getElementById('equipementId').addEventListener('change', updateEquipementInfo);

    const deletePanne = (id) => {
        const p = pannesStore.getById(id);
        if (p) {
            pannesStore.delete(id);
            // S'il n'y a plus de pannes ouvertes pour cet équipement, on le repasse en EN_SERVICE
            const otherOpen = pannesStore.getAll({ equipement_id: p.equipement_id, statut: 'OUVERTE' });
            if (otherOpen.length === 0) {
                equipementsStore.update(p.equipement_id, { statut: 'EN_SERVICE' });
            }
        }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const equipementId = document.getElementById('equipementId').value;
        const airportId = currentAirportId === 'all' 
            ? equipementsStore.getById(equipementId).airport_id 
            : currentAirportId;
        const tPanne = document.getElementById('tPanne').value + ':00Z';
        const tRepriseVal = document.getElementById('tReprise').value;
        const tReprise = tRepriseVal ? tRepriseVal + ':00Z' : null;
        let duree = null;
        let statut = 'OUVERTE';
        if (tReprise) {
            statut = 'RESOLUE';
            const diffMs = new Date(tReprise) - new Date(tPanne);
            duree = Math.floor(diffMs / (1000 * 60));
        }
        
        const data = {
            airport_id: airportId,
            equipement_id: equipementId,
            t_panne: tPanne,
            t_reprise: tReprise,
            duree_arret_minutes: duree,
            cause_panne: 'INCONNU',
            description: document.getElementById('description').value,
            impact: 'MINEUR',
            statut: statut,
            saisi_par: auth.getCurrentUser().id
        };
        
        const id = document.getElementById('panneId').value;
        if (id) {
            const oldPanne = pannesStore.getById(id);
            pannesStore.update(id, data);
            
            // Si l'équipement a changé, on nettoie le statut de l'ancien
            if (oldPanne && oldPanne.equipement_id !== equipementId) {
                const oldOpen = pannesStore.getAll({ equipement_id: oldPanne.equipement_id, statut: 'OUVERTE' });
                if (oldOpen.length === 0) {
                    equipementsStore.update(oldPanne.equipement_id, { statut: 'EN_SERVICE' });
                }
            }
            
            // Met à jour le statut de l'équipement courant
            if (statut === 'RESOLUE') {
                const otherOpen = pannesStore.getAll({ equipement_id: equipementId, statut: 'OUVERTE' }).filter(p => p.id !== id);
                if (otherOpen.length === 0) {
                    equipementsStore.update(equipementId, { statut: 'EN_SERVICE' });
                }
            } else {
                equipementsStore.update(equipementId, { statut: 'EN_PANNE' });
            }
        } else {
            pannesStore.create(data);
            if (statut === 'RESOLUE') {
                const otherOpen = pannesStore.getAll({ equipement_id: equipementId, statut: 'OUVERTE' });
                if (otherOpen.length === 0) {
                    equipementsStore.update(equipementId, { statut: 'EN_SERVICE' });
                }
            } else {
                equipementsStore.update(equipementId, { statut: 'EN_PANNE' });
            }
        }
        closeModal();
        loadData();
    });
    
    const onPeriodChange = () => { loadData(); };
    const onAirportChange = () => { renderPannes(container); };
    const onStoreChanged = (e) => { if (e.detail.collection === 'pannes' || e.detail.collection === 'equipements') { loadData(); } };

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

    loadData();
}
