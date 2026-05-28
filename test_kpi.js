import { kpi } from './src/services/kpi.js';
import { equipementsStore } from './src/services/store.js';

// Setup mock data
const mockEqs = [
    { id: '1', airport_id: '1', heures_fonctionnement_jour: 24 },
    { id: '2', airport_id: '1', heures_fonctionnement_jour: 24 }
];
equipementsStore.getAll = () => mockEqs;

console.log(kpi.calculateDisponibilite('1', { period: 'all' }));
console.log(kpi.calculateDisponibilite('1', { period: 'CUSTOM_2026-04-15_2026-06-15' }));
