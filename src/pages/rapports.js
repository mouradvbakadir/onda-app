/**
 * Amnt — Rapports & Exportation Page (Premium Light Theme)
 */
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Chart from 'chart.js/auto';
import { kpi } from '../services/kpi.js';
import { auth } from '../services/auth.js';
import { societesStore, marchesStore, equipementsStore, airportsStore, periodStore } from '../services/store.js';

const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined || isNaN(minutes)) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
        return `${hrs}h ${mins}min`;
    }
    return `${mins}min`;
};

export function renderRapports(container) {
    const currentAirportId = auth.getCurrentAirportId();
    
    const now = new Date();
    const currentYear = now.getFullYear();

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1>Rapports & Analytiques</h1>
                <p class="mb-0">Vue consolidée des performances de maintenance et KPIs</p>
            </div>
            <div class="flex gap-2">
                <button id="btnExportPdf" class="btn btn-secondary">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    Export PDF
                </button>
                <button id="btnExportExcel" class="btn btn-secondary">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="17"></line><line x1="8" y1="17" x2="16" y2="13"></line></svg>
                    Export Excel
                </button>
            </div>
        </div>

        <div class="card mb-6" style="padding: 0.875rem 1.25rem;">
            <div class="flex gap-4 items-end">
                <div class="form-group w-full mb-0">
                    <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Période</label>
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
                <div class="form-group w-full mb-0">
                    <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Marché</label>
                    <select id="filterMarche" class="form-control">
                        <option value="all">Tous les marchés</option>
                    </select>
                </div>
                <div class="form-group w-full mb-0">
                    <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Société Prestataire</label>
                    <select id="filterSociete" class="form-control">
                        <option value="all">Toutes les sociétés</option>
                    </select>
                </div>
            </div>
        </div>

        <div id="dashboardContent" class="mb-8">
            <!-- Injected dynamically -->
        </div>
    `;

    const filterPeriod = document.getElementById('filterPeriod');
    const filterMarche = document.getElementById('filterMarche');
    const filterSociete = document.getElementById('filterSociete');

    let baseFilters = {};
    if (currentAirportId !== 'all') baseFilters.airport_id = currentAirportId;
    
    const marches = marchesStore.getAll(baseFilters);
    const societes = societesStore.getAll(baseFilters);

    marches.forEach(m => {
        filterMarche.innerHTML += `<option value="${m.id}">${m.numero_marche}</option>`;
    });

    const updateSocieteFilter = () => {
        const mId = filterMarche.value;
        filterSociete.innerHTML = '<option value="all">Toutes les sociétés</option>';
        societes.forEach(s => {
            if (mId === 'all' || s.marche_id === mId) {
                filterSociete.innerHTML += `<option value="${s.id}">${s.nom || s.raison_sociale}</option>`;
            }
        });
    };

    filterPeriod.value = periodStore.getPeriod();

    filterPeriod.addEventListener('change', () => {
        periodStore.setPeriod(filterPeriod.value);
    });
    filterMarche.addEventListener('change', () => {
        updateSocieteFilter();
        generateDashboard();
    });
    filterSociete.addEventListener('change', generateDashboard);

    const onPeriodChange = (e) => {
        filterPeriod.value = e.detail.period;
        generateDashboard();
    };

    const onAirportChange = () => {
        renderRapports(container);
    };

    const onStoreChanged = (e) => {
        if (['preventif', 'pannes', 'reclamations', 'equipements', 'marches', 'societes'].includes(e.detail.collection)) {
            generateDashboard();
        }
    };

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
    
    updateSocieteFilter();

    let currentExportData = [];

    const getPeriodLabel = (periodVal, year) => {
        if (periodVal === 'all') return `Année ${year}`;
        if (periodVal.startsWith('T')) return `Trimestre ${periodVal.replace('T', '')} ${year}`;
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        return `${months[parseInt(periodVal, 10) - 1]} ${year}`;
    };

    function generateDashboard() {
        const container = document.getElementById('dashboardContent');
        
        // Skeleton
        container.innerHTML = `
            <div class="kpi-grid mb-6">
                ${Array(4).fill(0).map(() => `
                <div class="kpi-card">
                    <div class="skeleton" style="width: 40px; height: 40px; border-radius: 8px;"></div>
                    <div class="kpi-content" style="flex: 1;">
                        <div class="skeleton" style="width: 60%; height: 22px; margin-bottom: 0.375rem;"></div>
                        <div class="skeleton" style="width: 40%; height: 12px;"></div>
                    </div>
                </div>
                `).join('')}
            </div>
            <div class="table-container">
                <table class="table">
                    <thead><tr><th>Société Prestataire</th><th>PRR</th><th>MRT</th><th>Pannes</th><th>Disponibilité</th></tr></thead>
                    <tbody>
                        ${Array(3).fill(0).map(() => `
                        <tr>
                            <td><div class="skeleton" style="width: 80%; height: 14px;"></div></td>
                            <td><div class="skeleton" style="width: 50%; height: 14px;"></div></td>
                            <td><div class="skeleton" style="width: 50%; height: 14px;"></div></td>
                            <td><div class="skeleton" style="width: 30%; height: 14px;"></div></td>
                            <td><div class="skeleton" style="width: 50%; height: 14px;"></div></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        setTimeout(() => {
            const pVal = filterPeriod.value;
            const mId = filterMarche.value;
            const sId = filterSociete.value;

            currentExportData = [];

            const currentYear = new Date().getFullYear();
            let periodStr = currentYear.toString();
            if (pVal !== 'all') {
                if (pVal.startsWith('T')) {
                    periodStr = `${currentYear}-Q${pVal.replace('T', '')}`;
                } else {
                    periodStr = `${currentYear}-${pVal}`;
                }
            }
            
            const periodLabel = getPeriodLabel(pVal, currentYear);

            let targetSocietes = societes;
            if (sId !== 'all') {
                targetSocietes = [societesStore.getById(sId)];
            } else if (mId !== 'all') {
                targetSocietes = societes.filter(s => s.marche_id === mId);
            }

            const filters = { period: periodStr, marcheId: mId, societeId: sId };
            const prrData = kpi.calculatePRR(currentAirportId, filters);
            const mrtData = kpi.calculateMRT(currentAirportId, filters);
            const volData = kpi.getVolumePannes(currentAirportId, filters);
            const dispData = kpi.calculateDisponibilite(currentAirportId, filters);

            const valPRR = prrData.prr !== null ? `${prrData.prr}%` : '-';
            const valMRT = mrtData.mrt !== null ? formatDuration(mrtData.mrtMinutes) : '-';
            const valVol = volData.total;
            const valDisp = dispData.disponibilite !== null ? `${dispData.disponibilite}%` : '-';

            let tableRows = '';
            targetSocietes.forEach(soc => {
                const f = { period: periodStr, societeId: soc.id, marcheId: 'all' };
                const sPrr = kpi.calculatePRR(currentAirportId, f);
                const sMrt = kpi.calculateMRT(currentAirportId, f);
                const sVol = kpi.getVolumePannes(currentAirportId, f);
                const sDisp = kpi.calculateDisponibilite(currentAirportId, f);
                
                const nom = soc.nom || soc.raison_sociale;

                tableRows += `
                    <tr>
                        <td style="font-weight: 500;">${nom}</td>
                        <td>${sPrr.prr !== null ? `<span class="badge badge-${sPrr.prr >= 90 ? 'success' : 'danger'}">${sPrr.prr}%</span>` : '-'}</td>
                        <td style="font-family: var(--font-mono); font-size: 0.8125rem;">${sMrt.mrt !== null ? formatDuration(sMrt.mrtMinutes) : '-'}</td>
                        <td>${sVol.total}</td>
                        <td>${sDisp.disponibilite !== null ? `<span class="badge badge-${sDisp.disponibilite >= 95 ? 'success' : 'warning'}">${sDisp.disponibilite}%</span>` : '-'}</td>
                    </tr>
                `;

                currentExportData.push({
                    Période: periodLabel,
                    Société: nom,
                    'PRR (%)': sPrr.prr,
                    'MRT': sMrt.mrt !== null ? formatDuration(sMrt.mrtMinutes) : '-',
                    'Pannes': sVol.total,
                    'Disponibilité (%)': sDisp.disponibilite
                });
            });

            if (targetSocietes.length === 0) {
                tableRows = `<tr><td colspan="5" class="text-center text-muted" style="padding: 2rem;">Aucune société trouvée pour ces filtres.</td></tr>`;
            }

            container.innerHTML = `
                <div class="kpi-grid mb-6">
                    <div class="kpi-card">
                        <div class="kpi-icon" style="color: #2563eb; background: #dbeafe;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div class="kpi-content">
                            <div class="kpi-value" style="color: #2563eb;">${valMRT}</div>
                            <div class="kpi-label">MRT Global</div>
                        </div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-icon" style="color: #059669; background: #d1fae5;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div class="kpi-content">
                            <div class="kpi-value" style="color: #059669;">${valPRR}</div>
                            <div class="kpi-label">PRR Global</div>
                        </div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-icon" style="color: #dc2626; background: #fee2e2;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        </div>
                        <div class="kpi-content">
                            <div class="kpi-value" style="color: #dc2626;">${valVol}</div>
                            <div class="kpi-label">Pannes Signalées</div>
                        </div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-icon" style="color: #7c3aed; background: #ede9fe;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div class="kpi-content">
                            <div class="kpi-value" style="color: #7c3aed;">${valDisp}</div>
                            <div class="kpi-label">Disponibilité Globale</div>
                        </div>
                    </div>
                </div>

                <div class="table-container">
                    <div style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">
                        <h3 style="font-size: 0.875rem; margin: 0; color: #374151;">Performances par Société — ${periodLabel}</h3>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Société Prestataire</th>
                                <th>PRR</th>
                                <th>MRT</th>
                                <th>Pannes</th>
                                <th>Disponibilité</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            `;
        }, 250);
    }

    // Export PDF
    document.getElementById('btnExportPdf').addEventListener('click', () => {
        if (currentExportData.length === 0) return alert("Aucune donnée à exporter.");
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229);
        doc.text("ONDA", 14, 20);
        
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("RAPPORT ANALYTIQUE GLOBAL", 200, 20, { align: "right" });
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        const pText = "YTD (Année en cours)";
        doc.text(`Période : ${pText}`, 200, 26, { align: "right" });
        
        doc.line(14, 30, 200, 30);

        const tableData = currentExportData.map(row => [
            row['Période'],
            row['Société'],
            row['PRR (%)'] !== null && row['PRR (%)'] !== undefined ? `${row['PRR (%)']} %` : '-',
            row['MRT'],
            row['Pannes'],
            row['Disponibilité (%)'] !== null && row['Disponibilité (%)'] !== undefined ? `${row['Disponibilité (%)']} %` : '-'
        ]);

        doc.autoTable({
            startY: 40,
            headStyles: { fillColor: [79, 70, 229] },
            head: [['Période', 'Société', 'PRR', 'MRT', 'Pannes', 'Disponibilité']],
            body: tableData,
            theme: 'grid'
        });

        doc.save(`Rapport_Global_${pText.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    });

    // Export Excel
    document.getElementById('btnExportExcel').addEventListener('click', () => {
        if (currentExportData.length === 0) return alert("Aucune donnée à exporter.");
        
        const worksheet = XLSX.utils.json_to_sheet(currentExportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rapport Global");
        
        const pText = "YTD_Consolide";
        XLSX.writeFile(workbook, `Extract_Rapport_${pText}.xlsx`);
    });

    // Initial Render
    setTimeout(generateDashboard, 0);
}
