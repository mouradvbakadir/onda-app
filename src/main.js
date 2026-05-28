/**
 * Antigravity - Main Entry Point
 */
import './styles/index.css';
import { seedDatabase } from './data/seed.js';
import { Router } from './router.js';
import { renderLayout } from './components/layout.js';

// Pages
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderMarches } from './pages/marches.js';
import { renderSocietes } from './pages/societes.js';
import { renderEquipements } from './pages/equipements.js';
import { renderPreventif } from './pages/preventif.js';
import { renderPannes } from './pages/pannes.js';
import { renderReclamations } from './pages/reclamations.js';
import { renderRapports } from './pages/rapports.js';

// Initialize data
seedDatabase();

// Define routes
const routes = [
    {
        path: '#/',
        requiresAuth: false
    },
    { 
        path: '#/login', 
        component: renderLogin,
        requiresAuth: false
    },
    { 
        path: '#/dashboard', 
        component: renderLayout(renderDashboard),
        requiresAuth: true,
        roles: ['SUPER_ADMIN', 'SUPERVISEUR']
    },
    { 
        path: '#/marches', 
        component: renderLayout(renderMarches),
        requiresAuth: true,
        roles: ['SUPER_ADMIN', 'SUPERVISEUR']
    },
    { 
        path: '#/societes', 
        component: renderLayout(renderSocietes),
        requiresAuth: true,
        roles: ['SUPER_ADMIN', 'SUPERVISEUR']
    },
    { 
        path: '#/equipements', 
        component: renderLayout(renderEquipements),
        requiresAuth: true,
        roles: ['SUPER_ADMIN', 'SUPERVISEUR']
    },
    { 
        path: '#/preventif', 
        component: renderLayout(renderPreventif),
        requiresAuth: true,
        roles: ['SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN']
    },
    { 
        path: '#/pannes', 
        component: renderLayout(renderPannes),
        requiresAuth: true,
        roles: ['SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN']
    },
    { 
        path: '#/reclamations', 
        component: renderLayout(renderReclamations),
        requiresAuth: true,
        roles: ['SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN']
    },
    { 
        path: '#/rapports', 
        component: renderLayout(renderRapports),
        requiresAuth: true,
        roles: ['SUPER_ADMIN', 'SUPERVISEUR']
    }
];

// Start application
const router = new Router(routes);
window.addEventListener('DOMContentLoaded', () => {
    router.init();
});
