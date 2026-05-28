/**
 * Antigravity - KPI Calculation Engine
 */
import { 
    preventifStore, 
    pannesStore, 
    reclamationsStore, 
    equipementsStore, 
    marchesStore,
    societesStore
} from './store.js';

class KPIEngine {
    
    /**
     * Helper to check if a date string falls within a specified period
     * Pure string parsing, 100% timezone-independent and deterministic.
     * @param {string} dateStr - Date string in YYYY-MM-DD... format
     * @param {string} period - e.g., 'all', '2026', '2026-Q1', '2026-05', 'T1', '05'
     */
    isDateInPeriod(dateStr, period) {
        if (!dateStr) return false;
        
        const year = dateStr.substring(0, 4);
        const monthStr = dateStr.substring(5, 7);
        const month = parseInt(monthStr, 10);
        
        if (isNaN(parseInt(year, 10)) || isNaN(month)) return false;
        
        const currentYear = new Date().getFullYear().toString();
        
        let targetYear = currentYear;
        let periodType = 'all';
        
        if (period && period.startsWith('CUSTOM_')) {
            const parts = period.split('_');
            if (parts.length >= 3) {
                const startStr = parts[1];
                const endStr = parts[2];
                return dateStr >= startStr && dateStr <= endStr + 'T23:59:59';
            }
        }
        
        if (period && period !== 'all') {
            if (period.length === 4) {
                targetYear = period;
                periodType = 'all';
            } else if (period.includes('-Q')) {
                const parts = period.split('-Q');
                targetYear = parts[0];
                periodType = 'T' + parts[1];
            } else if (period.includes('-')) {
                const parts = period.split('-');
                targetYear = parts[0];
                periodType = parts[1];
            } else if (period.startsWith('T') || period.match(/^\d{2}$/)) {
                periodType = period;
            }
        }
        
        if (year !== targetYear) return false;
        
        if (periodType === 'all') return true;
        
        if (periodType.startsWith('T')) {
            const quarter = Math.floor((month - 1) / 3) + 1;
            return `T${quarter}` === periodType;
        } else {
            return monthStr === periodType;
        }
    }

    /**
     * Indicateur 1: PRR (Planning Respect Rate)
     * Calculé comme le miroir mathématique exact des lignes du tableau de Maintenance Préventive.
     */
    calculatePRR(airportId, filters) {
        const { societeId, marcheId, period } = filters;
        let pFilters = {};
        if (airportId && airportId !== 'all') pFilters.airport_id = airportId;
        
        const allInterventions = preventifStore.getAll(pFilters);
        
        const relevantInterventions = allInterventions.filter(inv => {
            if (societeId && societeId !== 'all' && inv.societe_id !== societeId) return false;
            
            if (marcheId && marcheId !== 'all') {
                const soc = societesStore.getById(inv.societe_id);
                if (!soc || soc.marche_id !== marcheId) return false;
            }
            
            const planDate = inv.date_planifiee;
            return this.isDateInPeriod(planDate, period);
        });

        if (relevantInterventions.length === 0) return { prr: null, count: 0 };

        let totalPrrScores = 0;

        relevantInterventions.forEach(inv => {
            let score = 0;
            if (inv.statut === 'REALISEE') {
                const planDate = inv.date_planifiee ? inv.date_planifiee.split('T')[0] : '';
                const realDate = inv.date_realisee ? inv.date_realisee.split('T')[0] : '';
                if (planDate && realDate && realDate <= planDate) {
                    score = 100;
                }
            }
            totalPrrScores += score;
        });

        let prr = totalPrrScores / relevantInterventions.length;

        return {
            prr: parseFloat(prr.toFixed(2)),
            count: relevantInterventions.length
        };
    }

    /**
     * Helper: Get period start/end date strings for bounding downtime calculations
     * Returns { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
     */
    _getPeriodBounds(period) {
        const currentYear = new Date().getFullYear();
        let year = currentYear;
        let startMonth = 1;
        let endMonth = 12;

        if (period && period.startsWith('CUSTOM_')) {
            const parts = period.split('_');
            if (parts.length >= 3) {
                const start = parts[1];
                const end = parts[2];
                const d1 = new Date(start);
                const d2 = new Date(end);
                const diffMs = d2 - d1;
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
                return { start, end, daysInPeriod: days };
            }
        }

        if (!period || period === 'all') {
            // Full current year
        } else if (period.length === 4) {
            year = parseInt(period, 10);
        } else if (period.match(/^\d{4}-Q[1-4]$/)) {
            year = parseInt(period.substring(0, 4), 10);
            const q = parseInt(period.substring(6, 7), 10);
            startMonth = (q - 1) * 3 + 1;
            endMonth = startMonth + 2;
        } else if (period.match(/^\d{4}-\d{2}$/)) {
            const [y, m] = period.split('-');
            year = parseInt(y, 10);
            startMonth = parseInt(m, 10);
            endMonth = startMonth;
        }

        const sm = String(startMonth).padStart(2, '0');
        const lastDay = new Date(year, endMonth, 0).getDate();
        const em = String(endMonth).padStart(2, '0');

        return {
            start: `${year}-${sm}-01`,
            end: `${year}-${em}-${String(lastDay).padStart(2, '0')}`,
            daysInPeriod: this._countDaysInPeriod(year, startMonth, endMonth)
        };
    }

    /**
     * Helper: Count total days across months [startMonth..endMonth] in a given year
     */
    _countDaysInPeriod(year, startMonth, endMonth) {
        let total = 0;
        for (let m = startMonth; m <= endMonth; m++) {
            total += new Date(year, m, 0).getDate();
        }
        return total;
    }

    /**
     * Indicateur 2 : Disponibilité (D)
     * 
     * Formule : D = (Temps Théorique − Temps d'Arrêt) / Temps Théorique × 100
     * 
     * Optimisations v3 (Calcul mensuel strict) :
     *  - Le calcul s'effectue mois par mois, en scindant les pannes par mois.
     *  - Les durées d'arrêt de chaque mois sont calculées indépendamment, puis agrégées.
     */
    calculateDisponibilite(airportId, filters) {
        const { societeId, marcheId, period } = filters;
        let eqFilters = {};
        if (airportId && airportId !== 'all') eqFilters.airport_id = airportId;
        if (societeId && societeId !== 'all') eqFilters.societe_id = societeId;
        if (marcheId && marcheId !== 'all') eqFilters.marche_id = marcheId;
        
        const equipements = equipementsStore.getAll(eqFilters);
        if (equipements.length === 0) return { disponibilite: null, monthlyDetails: [] };

        // O(1) lookup via Set
        const equipementIdSet = new Set(equipements.map(e => e.id));

        const bounds = this._getPeriodBounds(period);
        const periodStartMs = new Date(bounds.start + 'T00:00:00').getTime();
        const periodEndMs = new Date(bounds.end + 'T23:59:59').getTime();
        
        // Fetch pannes
        let panneFilters = {};
        if (airportId && airportId !== 'all') panneFilters.airport_id = airportId;
        const pannes = pannesStore.getAll(panneFilters);

        const now = new Date();
        const nowMs = now.getTime();
        
        const startYear = new Date(periodStartMs).getFullYear();
        const endYear = new Date(periodEndMs).getFullYear();
        const startMonth = new Date(periodStartMs).getMonth() + 1;
        const endMonth = new Date(periodEndMs).getMonth() + 1;

        let totalDowntimeMins = 0;
        let totalTheoreticalMins = 0;
        let pannesCount = 0;
        const monthlyDetails = [];

        // Itérer sur tous les mois inclus dans la période personnalisée
        let currentY = startYear;
        let currentM = startMonth;
        
        while (currentY < endYear || (currentY === endYear && currentM <= endMonth)) {
            const mMonthStartMs = new Date(currentY, currentM - 1, 1).getTime();
            const mMonthEndMs = new Date(currentY, currentM, 0, 23, 59, 59, 999).getTime();

            // Les bornes effectives de ce mois en fonction de la période demandée
            const effectiveStartMs = Math.max(mMonthStartMs, periodStartMs);
            const effectiveEndMs = Math.min(mMonthEndMs, periodEndMs);
            
            // Capping: Ne pas calculer le temps théorique dans le futur
            const actualEndMs = Math.min(effectiveEndMs, nowMs);

            if (effectiveStartMs <= effectiveEndMs) {
                let monthTheoMins = 0;
                let monthDowntimeMins = 0;
                let monthDispo = '-';

                if (effectiveStartMs <= actualEndMs) {
                    let fractionOfDay;
                    if (actualEndMs === nowMs) {
                        // Temps en cours: calcul exact jusqu'à la milliseconde actuelle
                        fractionOfDay = (actualEndMs - effectiveStartMs) / (1000 * 60 * 60 * 24);
                    } else {
                        // Période passée: on arrondit au nombre de jours complets
                        fractionOfDay = Math.round((actualEndMs - effectiveStartMs + 1000) / (1000 * 60 * 60 * 24));
                    }
                    
                    // Le temps théorique est désormais basé sur la durée civile de la période
                    monthTheoMins = fractionOfDay * 24 * 60;

                    const eqIntervals = new Map();

                    pannes.forEach(p => {
                        if (!equipementIdSet.has(p.equipement_id)) return;

                        const tPanneMs = new Date(p.t_panne).getTime();
                        if (isNaN(tPanneMs)) return;

                        let downStartMs = tPanneMs;
                        let downEndMs;

                        if (p.t_reprise) {
                            downEndMs = new Date(p.t_reprise).getTime();
                            if (isNaN(downEndMs)) return;
                        } else if (p.statut !== 'RESOLUE') {
                            downEndMs = nowMs;
                        } else {
                            return;
                        }

                        // Intersection stricte pour les bornes effectives du mois courant (et plafonné à nowMs)
                        const clampedStart = Math.max(downStartMs, effectiveStartMs);
                        const clampedEnd = Math.min(downEndMs, actualEndMs);

                        if (clampedEnd > clampedStart) {
                            if (!eqIntervals.has(p.equipement_id)) eqIntervals.set(p.equipement_id, []);
                            eqIntervals.get(p.equipement_id).push([clampedStart, clampedEnd]);
                            if (currentY === startYear && currentM === startMonth) pannesCount++;
                        }
                    });

                    for (const intervals of eqIntervals.values()) {
                        if (intervals.length === 0) continue;
                        
                        intervals.sort((a, b) => a[0] - b[0]);
                        let merged = [intervals[0]];
                        
                        for (let i = 1; i < intervals.length; i++) {
                            let last = merged[merged.length - 1];
                            let current = intervals[i];
                            if (current[0] <= last[1]) {
                                last[1] = Math.max(last[1], current[1]);
                            } else {
                                merged.push(current);
                            }
                        }
                        
                        let eqDowntimeMs = 0;
                        for (const interval of merged) {
                            eqDowntimeMs += (interval[1] - interval[0]);
                        }
                        monthDowntimeMins += Math.floor(eqDowntimeMs / 60000);
                    }

                    if (monthTheoMins > 0) {
                        monthDispo = ((monthTheoMins - monthDowntimeMins) / monthTheoMins) * 100;
                        monthDispo = Math.max(0, Math.min(monthDispo, 100));
                        monthDispo = parseFloat(monthDispo.toFixed(2));
                    } else {
                        monthDispo = 100;
                    }

                    totalTheoreticalMins += monthTheoMins;
                    totalDowntimeMins += monthDowntimeMins;
                }

                monthlyDetails.push({
                    month: currentM,
                    year: currentY,
                    theoriqueMins: monthTheoMins,
                    arretMins: monthDowntimeMins,
                    disponibilite: monthDispo
                });
            }
            
            currentM++;
            if (currentM > 12) {
                currentM = 1;
                currentY++;
            }
        }

        let disponibilite = 100;
        if (totalTheoreticalMins > 0) {
            disponibilite = ((totalTheoreticalMins - totalDowntimeMins) / totalTheoreticalMins) * 100;
            disponibilite = Math.max(0, Math.min(disponibilite, 100));
        }

        return {
            disponibilite: parseFloat(disponibilite.toFixed(2)),
            theoriqueMins: totalTheoreticalMins,
            arretMins: totalDowntimeMins,
            pannesCount,
            monthlyDetails,
            periodDays: bounds.daysInPeriod,
            periodHours: bounds.daysInPeriod * 24
        };
    }

    /**
     * Indicateur 3 : MRT (Mean Reaction Time)
     * 
     * MRT = Σ(t_arrivee − t_notification) / nombre de réclamations
     * 
     * Optimisations v2 :
     *  - Map<panneId, panne> pour résolution O(1) au lieu de O(n²)
     *  - Filtrage direct des pannes par airport_id
     *  - Fallback intelligent : temps_reaction_minutes → (t_notification → t_arrivee) → (t_panne → t_arrivee)
     *  - Résultats enrichis avec min/max
     */
    calculateMRT(airportId, filters) {
        const { societeId, marcheId, period } = filters;
        let eqFilters = {};
        if (airportId && airportId !== 'all') eqFilters.airport_id = airportId;
        if (societeId && societeId !== 'all') eqFilters.societe_id = societeId;
        if (marcheId && marcheId !== 'all') eqFilters.marche_id = marcheId;
        
        const equipements = equipementsStore.getAll(eqFilters);
        const equipementIdSet = new Set(equipements.map(e => e.id));
        
        // Fetch pannes with airport filter for performance
        let panneFilters = {};
        if (airportId && airportId !== 'all') panneFilters.airport_id = airportId;
        const allPannes = pannesStore.getAll(panneFilters);

        // Build O(1) lookup map : panneId → panne
        const panneMap = new Map();
        allPannes.forEach(p => panneMap.set(p.id, p));
        
        const allReclamations = reclamationsStore.getAll();
        
        let totalReactionMins = 0;
        let count = 0;
        let minReaction = Infinity;
        let maxReaction = 0;

        allReclamations.forEach(r => {
            // Must have arrival date to calculate MRT
            const arrivalStr = r.t_arrivee || r.date_arrivee;
            if (!arrivalStr) return;

            // Filter by period based on reclamation's signalement date
            const sigDate = r.date_signalement || r.t_notification || r.created_at;
            if (!this.isDateInPeriod(sigDate, period)) return;

            // Find associated panne via Map (O(1))
            const panne = panneMap.get(r.panne_id);
            if (!panne) return;

            // Must belong to one of our filtered equipements
            if (!equipementIdSet.has(panne.equipement_id)) return;

            // Calculate reaction time in minutes dynamically to ensure sync with Reclamations table
            let reactionMins = null;
            const startStr = r.t_notification || r.date_signalement || panne.t_panne;
            const endStr = arrivalStr;
            if (startStr && endStr) {
                const start = new Date(startStr);
                const end = new Date(endStr);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    const diff = Math.floor((end - start) / 60000);
                    reactionMins = diff > 0 ? diff : 0;
                }
            }

            if (reactionMins !== null && reactionMins >= 0) {
                totalReactionMins += reactionMins;
                count++;
                if (reactionMins < minReaction) minReaction = reactionMins;
                if (reactionMins > maxReaction) maxReaction = reactionMins;
            }
        });

        if (count === 0) return { mrt: null, count: 0 };

        const avgMins = totalReactionMins / count;
        const mrtHours = avgMins / 60;

        return {
            mrt: parseFloat(mrtHours.toFixed(1)),
            mrtMinutes: Math.floor(avgMins),
            count,
            totalMins: totalReactionMins,
            minMinutes: minReaction === Infinity ? 0 : minReaction,
            maxMinutes: maxReaction
        };
    }

    /**
     * Volume de pannes (Pour Dashboard)
     */
    getVolumePannes(airportId, filters) {
        const { societeId, marcheId, period } = filters;
        let eqFilters = {};
        if (airportId && airportId !== 'all') eqFilters.airport_id = airportId;
        if (societeId && societeId !== 'all') eqFilters.societe_id = societeId;
        if (marcheId && marcheId !== 'all') eqFilters.marche_id = marcheId;
        
        const equipements = equipementsStore.getAll(eqFilters);
        const equipementIds = equipements.map(e => e.id);
        
        const allPannes = pannesStore.getAll();
        const relevantPannes = allPannes.filter(p => equipementIds.includes(p.equipement_id) && this.isDateInPeriod(p.t_panne, period));
        
        // Group by Equipement
        const byEquipement = {};
        relevantPannes.forEach(p => {
            byEquipement[p.equipement_id] = (byEquipement[p.equipement_id] || 0) + 1;
        });
        
        return {
            total: relevantPannes.length,
            byEquipement
        };
    }

    /**
     * Get complete KPI report for a given market/company (Legacy support for old reports)
     */
    getSocieteKPIs(airportId, marcheId, societeId, yearMonth) {
        const filters = { societeId, marcheId, period: yearMonth };
        const prrData = this.calculatePRR(airportId, filters);
        const dData = this.calculateDisponibilite(airportId, filters);
        const mrtData = this.calculateMRT(airportId, filters);
        
        const marche = marchesStore.getById(marcheId);
        let slas = {
            prr: { conforme: null, seuil: null },
            d: { conforme: null, seuil: null },
            mrt: { conforme: null, seuil: null }
        };

        let hasPenalties = false;

        if (marche) {
            if (prrData.prr !== null) {
                const conforme = prrData.prr >= marche.sla_prr;
                slas.prr = { conforme, seuil: marche.sla_prr };
                if (!conforme) hasPenalties = true;
            }
            if (dData.disponibilite !== null) {
                const conforme = dData.disponibilite >= marche.sla_disponibilite;
                slas.d = { conforme, seuil: marche.sla_disponibilite };
                if (!conforme) hasPenalties = true;
            }
            if (mrtData.mrt !== null) {
                const conforme = mrtData.mrt <= marche.sla_mrt;
                slas.mrt = { conforme, seuil: marche.sla_mrt };
                if (!conforme) hasPenalties = true;
            }
        }

        return {
            prr: prrData,
            disponibilite: dData,
            mrt: mrtData,
            slas,
            hasPenalties,
            marche: marche || null
        };
    }
}

export const kpi = new KPIEngine();
