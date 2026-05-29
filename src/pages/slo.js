/**
 * Amnt — Analyse SLO Page
 */
import { kpi } from '../services/kpi.js';
import { auth } from '../services/auth.js';
import { societesStore, marchesStore, periodStore, sloConfigStore } from '../services/store.js';

const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined || isNaN(minutes)) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hrs > 0) {
        return `${hrs}h ${mins}min`;
    }
    return `${mins}min`;
};

export function renderSlo(container) {
    const currentAirportId = auth.getCurrentAirportId();

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1>Analyse SLO</h1>
                <p class="mb-0">Calcul des niveaux de service par trimestre et par marché</p>
            </div>
        </div>

        <div class="card mb-6" style="padding: 0.875rem 1.25rem;">
            <div class="flex gap-4 items-end">
                <div class="form-group w-full mb-0">
                    <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Trimestre</label>
                    <select id="filterPeriod" class="form-control">
                        <option value="T1">Trimestre 1 (Jan - Mar)</option>
                        <option value="T2">Trimestre 2 (Avr - Juin)</option>
                        <option value="T3">Trimestre 3 (Juil - Sept)</option>
                        <option value="T4">Trimestre 4 (Oct - Déc)</option>
                    </select>
                </div>
                <div class="form-group w-full mb-0">
                    <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Marché</label>
                    <select id="filterMarche" class="form-control">
                        <!-- Options injectées -->
                    </select>
                </div>
                <div class="form-group w-full mb-0">
                    <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Société Prestataire</label>
                    <select id="filterSociete" class="form-control">
                        <!-- Options injectées -->
                    </select>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md-grid-cols-2 gap-6">
            <!-- Configuration Panel -->
            <div class="card" style="padding: 1.5rem;">
                <h3 class="mb-4 text-slate-800 font-medium">Configuration des Seuils & Coefficients</h3>
                <form id="configForm">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="form-group mb-0">
                            <label class="form-label">Seuil PRR (%)</label>
                            <input type="number" id="seuil_prr" class="form-control" step="any" required>
                        </div>
                        <div class="form-group mb-0">
                            <label class="form-label">Coefficient PRR</label>
                            <input type="number" id="coef_prr" class="form-control" step="any" required>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="form-group mb-0">
                            <label class="form-label">Seuil MRT (Heures)</label>
                            <input type="number" id="seuil_mrt" class="form-control" step="any" required>
                        </div>
                        <div class="form-group mb-0">
                            <label class="form-label">Coefficient MRT</label>
                            <input type="number" id="coef_mrt" class="form-control" step="any" required>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="form-group mb-0">
                            <label class="form-label">Seuil Disponibilité (%)</label>
                            <input type="number" id="seuil_dispo" class="form-control" step="any" required>
                        </div>
                        <div class="form-group mb-0">
                            <label class="form-label">Coefficient Disponibilité</label>
                            <input type="number" id="coef_dispo" class="form-control" step="any" required>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary w-full">Enregistrer la Configuration</button>
                    <div id="saveSuccess" class="badge badge-success mt-3 hidden w-full justify-center">Configuration sauvegardée</div>
                </form>
            </div>

            <!-- Results Panel -->
            <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column;">
                <h3 class="mb-4 text-slate-800 font-medium">Résultats du Calcul SLO</h3>
                <div id="sloResultsContainer" style="flex: 1;">
                    <!-- Results dynamically injected here -->
                </div>
            </div>
        </div>
    `;

    const filterPeriod = document.getElementById('filterPeriod');
    const filterMarche = document.getElementById('filterMarche');
    const filterSociete = document.getElementById('filterSociete');
    const configForm = document.getElementById('configForm');

    // Populate selects
    let baseFilters = {};
    if (currentAirportId !== 'all') baseFilters.airport_id = currentAirportId;
    
    const marches = marchesStore.getAll(baseFilters);
    const societes = societesStore.getAll(baseFilters);

    if (marches.length > 0) {
        marches.forEach(m => {
            filterMarche.innerHTML += `<option value="${m.id}">${m.numero_marche}</option>`;
        });
    } else {
        filterMarche.innerHTML = '<option value="">Aucun marché</option>';
    }

    const updateSocieteFilter = () => {
        const mId = filterMarche.value;
        filterSociete.innerHTML = '';
        const filteredSocietes = societes.filter(s => s.marche_id === mId);
        
        if (filteredSocietes.length > 0) {
            filteredSocietes.forEach(s => {
                filterSociete.innerHTML += `<option value="${s.id}">${s.nom || s.raison_sociale}</option>`;
            });
        } else {
            filterSociete.innerHTML = '<option value="">Aucune société</option>';
        }
    };

    const loadConfig = () => {
        const sId = filterSociete.value;
        if (!sId) {
            configForm.reset();
            return;
        }

        // Get config from sloConfigStore or set defaults
        let configs = sloConfigStore.getAll({ societe_id: sId });
        let config = configs.length > 0 ? configs[0] : null;

        if (!config) {
            // Get defaults from Marche SLA if available
            const mId = filterMarche.value;
            const marche = marches.find(m => m.id === mId);
            config = {
                seuil_prr: marche ? (marche.sla_prr || 90) : 90,
                seuil_mrt: marche ? ((marche.sla_mrt || 60) / 60) : 1,
                seuil_dispo: marche ? (marche.sla_disponibilite || 98) : 98,
                coef_prr: 1,
                coef_mrt: 1,
                coef_dispo: 1
            };
        }

        document.getElementById('seuil_prr').value = config.seuil_prr;
        document.getElementById('coef_prr').value = config.coef_prr;
        document.getElementById('seuil_mrt').value = config.seuil_mrt;
        document.getElementById('coef_mrt').value = config.coef_mrt;
        document.getElementById('seuil_dispo').value = config.seuil_dispo;
        document.getElementById('coef_dispo').value = config.coef_dispo;
    };

    const generateResults = () => {
        const container = document.getElementById('sloResultsContainer');
        const pVal = filterPeriod.value;
        const mId = filterMarche.value;
        const sId = filterSociete.value;

        if (!sId) {
            container.innerHTML = '<div class="empty-state">Veuillez sélectionner une société.</div>';
            return;
        }

        // Parse Config
        const seuil_prr = parseFloat(document.getElementById('seuil_prr').value) || 0;
        const coef_prr = parseFloat(document.getElementById('coef_prr').value) || 0;
        
        const seuil_mrt_heures = parseFloat(document.getElementById('seuil_mrt').value) || 0;
        const seuil_mrt_minutes = seuil_mrt_heures * 60;
        const coef_mrt = parseFloat(document.getElementById('coef_mrt').value) || 0;
        
        const seuil_dispo = parseFloat(document.getElementById('seuil_dispo').value) || 0;
        const coef_dispo = parseFloat(document.getElementById('coef_dispo').value) || 0;

        const totalCoefs = coef_prr + coef_mrt + coef_dispo;

        if (totalCoefs === 0) {
            container.innerHTML = '<div class="alert alert-warning">La somme des coefficients doit être supérieure à 0.</div>';
            return;
        }

        // Period formatting
        const currentYear = new Date().getFullYear();
        const periodStr = `${currentYear}-Q${pVal.replace('T', '')}`;
        const filters = { period: periodStr, marcheId: mId, societeId: sId };

        // Fetch Data
        const prrData = kpi.calculatePRR(currentAirportId, filters);
        const mrtData = kpi.calculateMRT(currentAirportId, filters);
        const dispData = kpi.calculateDisponibilite(currentAirportId, filters);

        const real_prr = prrData.prr !== null ? prrData.prr : 100; // If no data, assume 100% compliant logically or N/A
        const real_mrt = mrtData.mrtMinutes !== null && mrtData.mrtMinutes !== undefined ? mrtData.mrtMinutes : 0;
        const real_dispo = dispData.disponibilite !== null ? dispData.disponibilite : 100;

        // Calculate Conformité Indices (between 0.0 and 1.0)
        let indice_prr = 1.0;
        if (prrData.prr !== null) {
            indice_prr = (real_prr >= seuil_prr) ? 1.0 : (real_prr / seuil_prr);
        }

        let indice_mrt = 1.0;
        if (mrtData.mrtMinutes !== null && mrtData.mrtMinutes !== undefined) {
            // NB: La formule de calcul du MRT (seuil/résultat) s'applique uniquement lorsque le résultat dépasse strictement le seuil MRT défini. Si non, l'indice MRT est ramené à 1.
            indice_mrt = (real_mrt > seuil_mrt_minutes) ? (seuil_mrt_minutes / real_mrt) : 1.0;
        }

        let indice_dispo = 1.0;
        if (dispData.disponibilite !== null) {
            indice_dispo = (real_dispo >= seuil_dispo) ? 1.0 : (real_dispo / seuil_dispo);
        }

        // SLO = Sum(Conformités * Coef) / Sum(Coef) to normalize as an overall index
        const global_slo_index = ((indice_prr * coef_prr) + (indice_mrt * coef_mrt) + (indice_dispo * coef_dispo)) / totalCoefs;
        const global_slo_percent = global_slo_index * 100;

        container.innerHTML = `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem;">
                <div class="flex justify-between items-center mb-4 pb-4" style="border-bottom: 1px solid #cbd5e1;">
                    <div>
                        <span class="text-slate-500 font-medium block" style="font-size: 0.85rem;">SLO Global Obtenu</span>
                        <span class="text-slate-400 font-mono text-xs">SLO = Σ (Conformités × Coef)</span>
                    </div>
                    <div class="text-right">
                        <span style="font-size: 2.25rem; font-weight: 700; color: ${global_slo_percent >= 100 ? '#059669' : (global_slo_percent >= 90 ? '#d97706' : '#dc2626')};">
                            ${global_slo_percent.toFixed(2)}%
                        </span>
                        <span class="text-slate-400 font-mono block text-xs" style="margin-top: -4px;">Indice: ${global_slo_index.toFixed(3)}</span>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <!-- PRR -->
                    <div style="border-bottom: 1px dashed #e2e8f0; padding-bottom: 0.75rem;">
                        <div class="flex justify-between items-center text-sm mb-1">
                            <span class="text-slate-700"><strong>PRR</strong> (Seuil: ${seuil_prr}%)</span>
                            <span class="badge badge-${real_prr >= seuil_prr ? 'success' : 'danger'}">
                                ${real_prr >= seuil_prr ? 'CONFORME' : 'NON CONFORME'}
                            </span>
                        </div>
                        <div class="flex justify-between items-center text-xs text-slate-500 font-mono">
                            <span>Réel: ${prrData.prr !== null ? real_prr + '%' : 'N/A'}</span>
                            <span>Conformité (Indice): <strong class="text-slate-800">${indice_prr.toFixed(3)}</strong> (Coef: ${coef_prr})</span>
                        </div>
                    </div>
                    
                    <!-- MRT -->
                    <div style="border-bottom: 1px dashed #e2e8f0; padding-bottom: 0.75rem;">
                        <div class="flex justify-between items-center text-sm mb-1">
                            <span class="text-slate-700"><strong>MRT</strong> (Seuil: ${seuil_mrt_heures}h / ${seuil_mrt_minutes}min)</span>
                            <span class="badge badge-${real_mrt <= seuil_mrt_minutes ? 'success' : 'danger'}">
                                ${real_mrt <= seuil_mrt_minutes ? 'CONFORME' : 'NON CONFORME'}
                            </span>
                        </div>
                        <div class="flex justify-between items-center text-xs text-slate-500 font-mono">
                            <span>Réel: ${mrtData.mrtMinutes !== null ? formatDuration(real_mrt) : 'N/A'}</span>
                            <span>Conformité (Indice): <strong class="text-slate-800">${indice_mrt.toFixed(3)}</strong> (Coef: ${coef_mrt})</span>
                        </div>
                    </div>
                    
                    <!-- Disponibilité -->
                    <div style="padding-bottom: 0.25rem;">
                        <div class="flex justify-between items-center text-sm mb-1">
                            <span class="text-slate-700"><strong>Disponibilité</strong> (Seuil: ${seuil_dispo}%)</span>
                            <span class="badge badge-${real_dispo >= seuil_dispo ? 'success' : 'danger'}">
                                ${real_dispo >= seuil_dispo ? 'CONFORME' : 'NON CONFORME'}
                            </span>
                        </div>
                        <div class="flex justify-between items-center text-xs text-slate-500 font-mono">
                            <span>Réel: ${dispData.disponibilite !== null ? real_dispo + '%' : 'N/A'}</span>
                            <span>Conformité (Indice): <strong class="text-slate-800">${indice_dispo.toFixed(3)}</strong> (Coef: ${coef_dispo})</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 0.75rem; margin-top: 1rem;">
                <span style="font-size: 0.75rem; font-weight: 600; color: #15803d; display: block; margin-bottom: 0.25rem;">📝 Règles contractuelles appliquées :</span>
                <ul class="text-slate-600 text-xs" style="margin: 0; padding-left: 1rem; list-style-type: disc;">
                    <li><strong>Indice MRT</strong> : Si le résultat dépasse le seuil (${seuil_mrt_heures}h), la formule de calcul s'applique : <code>Seuil / Résultat</code> (soit <code>${seuil_mrt_minutes} / Réel</code>). Sinon, l'indice est ramené à <strong>1.000</strong>.</li>
                    <li><strong>Calcul du SLO</strong> : Somme des Conformités pondérée par leurs coefficients respectifs : <code>SLO = (Σ Conformité × Coef) / Σ Coef</code>.</li>
                </ul>
            </div>
        `;
    };

    // Event Listeners
    filterMarche.addEventListener('change', () => {
        updateSocieteFilter();
        loadConfig();
        generateResults();
    });

    filterSociete.addEventListener('change', () => {
        loadConfig();
        generateResults();
    });

    filterPeriod.addEventListener('change', generateResults);

    configForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const sId = filterSociete.value;
        const mId = filterMarche.value;
        
        if (!sId) return;

        const config = {
            societe_id: sId,
            marche_id: mId,
            seuil_prr: parseFloat(document.getElementById('seuil_prr').value),
            coef_prr: parseFloat(document.getElementById('coef_prr').value),
            seuil_mrt: parseFloat(document.getElementById('seuil_mrt').value),
            coef_mrt: parseFloat(document.getElementById('coef_mrt').value),
            seuil_dispo: parseFloat(document.getElementById('seuil_dispo').value),
            coef_dispo: parseFloat(document.getElementById('coef_dispo').value)
        };

        // Check if exists
        const existing = sloConfigStore.getAll({ societe_id: sId });
        if (existing.length > 0) {
            sloConfigStore.update(existing[0].id, config);
        } else {
            sloConfigStore.create(config);
        }

        const successMsg = document.getElementById('saveSuccess');
        successMsg.classList.remove('hidden');
        successMsg.classList.add('flex');
        setTimeout(() => {
            successMsg.classList.add('hidden');
            successMsg.classList.remove('flex');
        }, 3000);

        generateResults();
    });

    // Handle initial airport change if any
    const onAirportChange = () => {
        renderSlo(container);
    };
    window.addEventListener('airport-change', onAirportChange, { once: true });

    const cleanup = () => {
        window.removeEventListener('airport-change', onAirportChange);
        window.removeEventListener('page-destroy', cleanup);
    };
    window.addEventListener('page-destroy', cleanup);

    // Initial load
    updateSocieteFilter();
    loadConfig();
    
    // Default to current quarter
    const currentMonth = new Date().getMonth() + 1;
    let defaultQ = 'T1';
    if (currentMonth >= 4 && currentMonth <= 6) defaultQ = 'T2';
    if (currentMonth >= 7 && currentMonth <= 9) defaultQ = 'T3';
    if (currentMonth >= 10 && currentMonth <= 12) defaultQ = 'T4';
    filterPeriod.value = defaultQ;
    
    setTimeout(generateResults, 100);
}
