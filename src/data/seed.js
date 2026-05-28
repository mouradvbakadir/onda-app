/**
 * Antigravity - Initial Data Seed
 */
import { 
    generateUUID,
    airportsStore,
    usersStore,
    marchesStore,
    societesStore,
    equipementsStore,
    preventifStore,
    pannesStore,
    reclamationsStore 
} from '../services/store.js';

export function seedDatabase() {
    // Check if already seeded
    if (localStorage.getItem('antigravity_seeded_v12') === 'true') {
        return;
    }

    console.log('Seeding initial ONDA data...');

    // 1. Airports
    const airportsData = [
        { code_iata: 'CMN', code_oaci: 'GMMN', nom: 'Mohammed V', ville: 'Casablanca' },
        { code_iata: 'RAK', code_oaci: 'GMMX', nom: 'Marrakech-Ménara', ville: 'Marrakech' },
        { code_iata: 'AGA', code_oaci: 'GMAD', nom: 'Agadir-Al Massira', ville: 'Agadir' },
        { code_iata: 'TNG', code_oaci: 'GMTT', nom: 'Tanger Ibn Battouta', ville: 'Tanger' },
        { code_iata: 'FEZ', code_oaci: 'GMFF', nom: 'Fès-Saïss', ville: 'Fès' },
        { code_iata: 'RBA', code_oaci: 'GMME', nom: 'Rabat-Salé', ville: 'Rabat' },
        { code_iata: 'OUD', code_oaci: 'GMFO', nom: 'Oujda Angads', ville: 'Oujda' },
        { code_iata: 'NDR', code_oaci: 'GMMW', nom: 'Nador-Al Aroui', ville: 'Nador' },
        { code_iata: 'AHU', code_oaci: 'GMTA', nom: 'Al Hoceima - Cherif Al Idrissi', ville: 'Al Hoceima' },
        { code_iata: 'TTU', code_oaci: 'GMTN', nom: 'Tétouan - Sania Ramel', ville: 'Tétouan' },
        { code_iata: 'GLN', code_oaci: 'GMAG', nom: 'Guelmim', ville: 'Guelmim' },
        { code_iata: 'VIL', code_oaci: 'GMMH', nom: 'Dakhla', ville: 'Dakhla' },
        { code_iata: 'EUN', code_oaci: 'GMML', nom: 'Laâyoune - Hassan Ier', ville: 'Laâyoune' },
        { code_iata: 'ESU', code_oaci: 'GMMI', nom: 'Essaouira - Mogador', ville: 'Essaouira' },
        { code_iata: 'OZZ', code_oaci: 'GMMZ', nom: 'Ouarzazate', ville: 'Ouarzazate' },
        { code_iata: 'ERH', code_oaci: 'GMFK', nom: 'Errachidia - Moulay Ali Cherif', ville: 'Errachidia' },
        { code_iata: 'TTA', code_oaci: 'GMAT', nom: 'Tan-Tan - Plage Blanche', ville: 'Tan-Tan' },
        { code_iata: 'BEM', code_oaci: 'GMMD', nom: 'Béni Mellal', ville: 'Béni Mellal' },
        { code_iata: 'OZG', code_oaci: 'GMAZ', nom: 'Zagora', ville: 'Zagora' },
        { code_iata: 'UAR', code_oaci: 'GMFB', nom: 'Bouarfa', ville: 'Bouarfa' },
        { code_iata: 'IFR', code_oaci: 'GMFI', nom: 'Ifrane', ville: 'Ifrane' },
        { code_iata: 'BEN', code_oaci: 'GMMB', nom: 'Ben Slimane', ville: 'Ben Slimane' }
    ];

    const airports = airportsData.map(a => ({ ...a, id: generateUUID(), region: '' }));

    // 2. Users
    const users = [
        { id: generateUUID(), email: 'admin@onda.ma', password: 'admin', nom: 'Bakadir', prenom: 'Mourad', role: 'SUPER_ADMIN', is_active: true }
    ];

    airports.forEach(a => {
        const iataLC = a.code_iata.toLowerCase();
        users.push({
            id: generateUUID(),
            email: `sup.${iataLC}@onda.ma`,
            password: 'sup',
            nom: 'Superviseur',
            prenom: a.code_iata,
            role: 'SUPERVISEUR',
            airport_id: a.id,
            is_active: true
        });
        users.push({
            id: generateUUID(),
            email: `tech.${iataLC}@onda.ma`,
            password: 'tech',
            nom: 'Technicien',
            prenom: a.code_iata,
            role: 'TECHNICIEN',
            airport_id: a.id,
            is_active: true
        });
    });

    // 3. Variables de stockage
    const marches = [];
    const societes = [];
    const equipements = [];
    const preventif = [];
    const pannes = [];
    const reclamations = [];

    const currentYear = new Date().getFullYear();
    const currentMonthStr = new Date().toISOString().substring(0, 7);

    // Sociétés de base pour la génération aléatoire
    const baseSocietes = [
        { nom: 'ElecTech Maroc SARL', type: 'ELECTRIQUE' },
        { nom: 'AeroLight Solutions', type: 'BALISAGE' },
        { nom: 'ClimaFroid Pro', type: 'CVC' },
        { nom: 'MecaAero Maintenance', type: 'MECANIQUE' }
    ];

    // 4. Génération des données pour chaque aéroport
    airports.forEach((airport, index) => {
        // 4.1 Marches
        const marche1Id = generateUUID();
        const marche2Id = generateUUID();
        
        marches.push({ 
            id: marche1Id, airport_id: airport.id, 
            numero_marche: `0${(index % 9) + 1}/2024/${airport.code_iata}`, 
            objet: 'Maintenance des installations électriques',
            type_maintenance: 'MIXTE',
            sla_disponibilite: 98.0, sla_prr: 90.0 + (Math.random() * 8), sla_mrt: 60, 
            date_debut: `${currentYear}-01-01`, date_fin: `${currentYear+2}-12-31`, statut: 'ACTIF'
        });
        
        marches.push({ 
            id: marche2Id, airport_id: airport.id, 
            numero_marche: `1${(index % 9) + 1}/2023/${airport.code_iata}`, 
            objet: 'Entretien du balisage et CVC',
            type_maintenance: 'PREVENTIVE',
            sla_disponibilite: 99.0, sla_prr: 95.0, sla_mrt: 45,
            date_debut: `${currentYear-1}-06-01`, date_fin: `${currentYear+1}-05-31`, statut: 'ACTIF'
        });

        // 4.2 Societes
        const soc1Id = generateUUID();
        const soc2Id = generateUUID();
        const randSoc1 = baseSocietes[index % baseSocietes.length];
        const randSoc2 = baseSocietes[(index + 1) % baseSocietes.length];

        societes.push({
            id: soc1Id, airport_id: airport.id, marche_id: marche1Id,
            nom: randSoc1.nom + ' - Agence ' + airport.ville,
            equipe: [
                {
                    role: 'Chef de Projet',
                    nom: 'Chef Projet ' + randSoc1.nom.split(' ')[0],
                    email: 'cp@' + randSoc1.type.toLowerCase() + '.ma',
                    tel: '0661' + Math.floor(100000 + Math.random() * 899999)
                },
                {
                    role: 'Technicien',
                    nom: 'Technicien ' + randSoc1.nom.split(' ')[0],
                    email: 'tech@' + randSoc1.type.toLowerCase() + '.ma',
                    tel: '0662' + Math.floor(100000 + Math.random() * 899999)
                }
            ]
        });

        societes.push({
            id: soc2Id, airport_id: airport.id, marche_id: marche2Id,
            nom: randSoc2.nom + ' - Agence ' + airport.ville,
            equipe: [
                {
                    role: 'Chef de Projet',
                    nom: 'Chef Projet ' + randSoc2.nom.split(' ')[0],
                    email: 'cp@' + randSoc2.type.toLowerCase() + '.ma',
                    tel: '0661' + Math.floor(100000 + Math.random() * 899999)
                },
                {
                    role: 'Technicien',
                    nom: 'Technicien ' + randSoc2.nom.split(' ')[0],
                    email: 'tech@' + randSoc2.type.toLowerCase() + '.ma',
                    tel: '0662' + Math.floor(100000 + Math.random() * 899999)
                }
            ]
        });

        // 4.3 Equipements
        const eq1Id = generateUUID();
        const eq2Id = generateUUID();
        const eq3Id = generateUUID();

        equipements.push({ id: eq1Id, airport_id: airport.id, marche_id: marche1Id, societe_id: soc1Id, nom_equipement: `OND-T1-${airport.code_iata}`, designation: 'Onduleur Central', categorie: randSoc1.type, localisation: 'Local Technique', statut: 'EN_SERVICE' });
        equipements.push({ id: eq2Id, airport_id: airport.id, marche_id: marche1Id, societe_id: soc1Id, nom_equipement: `TGBT-${airport.code_iata}`, designation: 'Tableau Général', categorie: randSoc1.type, localisation: 'Sous-sol', statut: 'EN_SERVICE' });
        equipements.push({ id: eq3Id, airport_id: airport.id, marche_id: marche2Id, societe_id: soc2Id, nom_equipement: `SYS-${airport.code_iata}`, designation: 'Système ' + randSoc2.type, categorie: randSoc2.type, localisation: 'Piste / Aérogare', statut: 'EN_SERVICE' });

        // 4.4 Preventif (Calendar events)
        const isCompliant = Math.random() > 0.2; // 80% compliant
        const currentM = new Date().getMonth() + 1;
        const currentY = new Date().getFullYear();
        const monthPad = String(currentM).padStart(2, '0');
        
        // Event 1 (Planned & Realized)
        preventif.push({ 
            id: generateUUID(), airport_id: airport.id, societe_id: soc1Id, 
            titre: 'Visite mensuelle TGBT',
            date_planifiee: `${currentY}-${monthPad}-10`,
            date_debut_planifiee: `${currentY}-${monthPad}-10`,
            date_fin_planifiee: `${currentY}-${monthPad}-10`,
            plan_mode: 'single',
            date_realisee: isCompliant ? `${currentY}-${monthPad}-11` : null,
            date_debut_realisee: isCompliant ? `${currentY}-${monthPad}-11` : null,
            date_fin_realisee: isCompliant ? `${currentY}-${monthPad}-11` : null,
            real_mode: 'single',
            statut: isCompliant ? 'REALISEE' : 'PLANIFIEE',
            observations: isCompliant ? 'Visite OK' : 'En attente de réalisation'
        });
        
        // Event 2 (Planned only - future - range)
        preventif.push({ 
            id: generateUUID(), airport_id: airport.id, societe_id: soc2Id, 
            titre: 'Vérification Onduleurs',
            date_planifiee: `${currentY}-${monthPad}-25`,
            date_debut_planifiee: `${currentY}-${monthPad}-25`,
            date_fin_planifiee: `${currentY}-${monthPad}-27`,
            plan_mode: 'range',
            date_realisee: null,
            date_debut_realisee: null,
            date_fin_realisee: null,
            real_mode: 'single',
            statut: 'PLANIFIEE',
            observations: ''
        });

        // 4.5 Pannes & Reclamations (80% des aéroports ont une panne simulée)
        if (Math.random() > 0.2) {
            const daysAgo = Math.floor(Math.random() * 15) + 1;
            const pTime = new Date();
            pTime.setDate(pTime.getDate() - daysAgo);
            pTime.setHours(8 + Math.floor(Math.random() * 4), 0, 0); // 8h-12h
            
            const isResolved = Math.random() > 0.05; // 95% resolved
            const durationMins = 30 + Math.floor(Math.random() * 300); // 30 mins to 5 hours
            const rTime = new Date(pTime.getTime() + durationMins * 60000);
            
            const panneId = generateUUID();
            pannes.push({ 
                id: panneId, airport_id: airport.id, equipement_id: Math.random() > 0.5 ? eq1Id : eq2Id, 
                t_panne: pTime.toISOString(), t_reprise: isResolved ? rTime.toISOString() : null, 
                duree_arret_minutes: isResolved ? durationMins : null, 
                cause_panne: 'USURE', description: 'Incident technique simulé - Remonté par télégestion', 
                impact: durationMins > 180 ? 'CRITIQUE' : 'MAJEUR', 
                statut: isResolved ? 'RESOLUE' : 'OUVERTE' 
            });

            // Reclamation
            const notifTime = new Date(pTime.getTime() + 10 * 60000); // notifié 10 min après
            const reactionMins = 20 + Math.floor(Math.random() * 70); // réaction 20-90 mins
            const arrivalTime = new Date(notifTime.getTime() + reactionMins * 60000);
            
            reclamations.push({
                id: generateUUID(), airport_id: airport.id, panne_id: panneId,
                t_notification: notifTime.toISOString(), moyen_notification: 'APPLICATION',
                t_arrivee: arrivalTime.toISOString(), temps_reaction_minutes: reactionMins,
                conforme_sla: reactionMins <= 60, commentaire: 'Généré automatiquement'
            });
        }

        // Specific seed for Agadir (GMAD / AGA) - Nouveau marché
        if (airport.code_iata === 'AGA') {
            const marche3Id = generateUUID();
            const soc3Id = generateUUID();
            const eq4Id = generateUUID();

            marches.push({
                id: marche3Id,
                airport_id: airport.id,
                numero_marche: `05/2025/AGA`,
                objet: 'Maintenance des équipements mécaniques et ascenseurs',
                type_maintenance: 'MIXTE',
                sla_disponibilite: 97.0,
                sla_prr: 92.0,
                sla_mrt: 90,
                date_debut: `${currentYear}-01-01`,
                date_fin: `${currentYear+2}-12-31`,
                statut: 'ACTIF'
            });

            societes.push({
                id: soc3Id,
                airport_id: airport.id,
                marche_id: marche3Id,
                nom: 'MecaAero Maintenance - Agence Agadir',
                equipe: [
                    {
                        role: 'Chef de Projet',
                        nom: 'Chef Projet MecaAero',
                        email: 'cp@mecaaero.ma',
                        tel: '0661' + Math.floor(100000 + Math.random() * 899999)
                    },
                    {
                        role: 'Technicien',
                        nom: 'Technicien MecaAero',
                        email: 'tech@mecaaero.ma',
                        tel: '0662' + Math.floor(100000 + Math.random() * 899999)
                    }
                ]
            });

            equipements.push({
                id: eq4Id,
                airport_id: airport.id,
                marche_id: marche3Id,
                societe_id: soc3Id,
                nom_equipement: `ASC-T1-AGA`,
                designation: 'Ascenseur Terminal 1',
                categorie: 'MECANIQUE',
                localisation: 'Hall Départs',
                statut: 'EN_SERVICE'
            });
        }
    });

    // Write all to localStorage
    localStorage.setItem('antigravity_airports', JSON.stringify(airports));
    localStorage.setItem('antigravity_users', JSON.stringify(users));
    localStorage.setItem('antigravity_marches', JSON.stringify(marches));
    localStorage.setItem('antigravity_societes', JSON.stringify(societes));
    localStorage.setItem('antigravity_equipements', JSON.stringify(equipements));
    localStorage.setItem('antigravity_preventif', JSON.stringify(preventif));
    localStorage.setItem('antigravity_pannes', JSON.stringify(pannes));
    localStorage.setItem('antigravity_reclamations', JSON.stringify(reclamations));

    // Reload all stores in memory to prevent race conditions on first load
    airportsStore.reload();
    usersStore.reload();
    marchesStore.reload();
    societesStore.reload();
    equipementsStore.reload();
    preventifStore.reload();
    pannesStore.reload();
    reclamationsStore.reload();

    localStorage.setItem('antigravity_seeded_v12', 'true');
    console.log('Seed v12 (Admin name updated to Mourad Bakadir) completed successfully.');
}
