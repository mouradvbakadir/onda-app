global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { kpi } from '../src/services/kpi.js';
import { equipementsStore, pannesStore } from '../src/services/store.js';

// Setup mock equipments
equipementsStore.getAll = () => [
    { id: 'eq1', airport_id: 'A1', heures_fonctionnement_jour: 24, nom_equipement: 'Rayon X 1' }
];

// Setup mock panne from March 10 to May 5
pannesStore.getAll = () => [
    { 
        id: 'p1', 
        equipement_id: 'eq1', 
        airport_id: 'A1',
        t_panne: '2026-03-10T10:00:00Z', 
        t_reprise: '2026-05-05T14:00:00Z',
        statut: 'RESOLUE'
    }
];

console.log("=== VÉRIFICATION D'UNE PANNE SUR 3 MOIS (10 Mars -> 5 Mai) ===\n");

const periods = ['03', '04', '05', 'all'];
const periodNames = ["Mois de Mars", "Mois d'Avril", "Mois de Mai", "Année complète"];

periods.forEach((period, idx) => {
    const res = kpi.calculateDisponibilite('A1', { period });
    console.log(`--- ${periodNames[idx]} ---`);
    console.log(`Durée de la période : ${res.periodDays} jours (${res.periodHours} h)`);
    console.log(`Temps d'arrêt total : ${Math.floor(res.arretMins / 60)}h ${res.arretMins % 60}m`);
    console.log(`Disponibilité       : ${res.disponibilite}%\n`);
});
