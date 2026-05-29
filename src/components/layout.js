/**
 * Amnt — Premium Layout Component
 */
import { auth } from '../services/auth.js';
import { airportsStore } from '../services/store.js';

export function renderLayout(contentRenderer) {
    return (container) => {
        const user = auth.getCurrentUser();
        if (!user) return;

        const currentHash = window.location.hash || '#/dashboard';
        const pageNames = {
            '#/dashboard': 'Tableau de bord',
            '#/marches': 'Marchés & Contrats',
            '#/societes': 'Sociétés Prestataires',
            '#/equipements': 'Équipements',
            '#/preventif': 'Maintenance Préventive',
            '#/pannes': 'Gestion des Pannes',
            '#/reclamations': 'Réclamations',
            '#/rapports': 'Rapports & Analytiques',
            '#/slo': 'Analyse SLO',
        };
        const currentPageName = pageNames[currentHash] || 'Page';

        container.innerHTML = `
            <aside class="layout-sidebar">
                <div class="sidebar-logo">
                    <div style="background: white; padding: 3px; border-radius: 6px; display: flex; align-items: center; justify-content: center; height: 30px; width: 30px;">
                        <img src="/logo.png" alt="Logo" style="height: 24px; width: auto; object-fit: contain;">
                    </div>
                    <h2>Amnt</h2>
                </div>
                
                <nav class="sidebar-nav">
                    <a href="#/dashboard" class="nav-item" data-path="#/dashboard">
                        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>
                        Tableau de bord
                    </a>
                    
                    ${user.role !== 'TECHNICIEN' ? `
                    <div class="nav-section">Référentiel</div>
                    <a href="#/marches" class="nav-item" data-path="#/marches">
                        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        Marchés
                    </a>
                    <a href="#/societes" class="nav-item" data-path="#/societes">
                        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Sociétés
                    </a>
                    <a href="#/equipements" class="nav-item" data-path="#/equipements">
                        <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                        Équipements
                    </a>
                    ` : ''}

                    <div class="nav-section">Opérations</div>
                    <a href="#/preventif" class="nav-item" data-path="#/preventif">
                        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Préventif
                    </a>
                    <a href="#/pannes" class="nav-item" data-path="#/pannes">
                        <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Pannes
                    </a>
                    <a href="#/reclamations" class="nav-item" data-path="#/reclamations">
                        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Réclamations
                    </a>

                    ${user.role !== 'TECHNICIEN' ? `
                    <div class="nav-section">Analyse</div>
                    <a href="#/rapports" class="nav-item" data-path="#/rapports">
                        <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        Rapports
                    </a>
                    <a href="#/slo" class="nav-item" data-path="#/slo">
                        <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        Analyse SLO
                    </a>
                    ` : ''}
                </nav>
                
                <div class="sidebar-footer">
                    <div class="user-avatar">${user.nom.charAt(0)}</div>
                    <div class="user-info">
                        <div class="user-name">${user.prenom} ${user.nom}</div>
                        <div class="user-role">${user.role.replace('_', ' ')}</div>
                    </div>
                    <button id="btnLogout" class="btn-ghost" style="padding: 0.25rem; color: #64748b; background: none; border: none; cursor: pointer; border-radius: 6px;" title="Déconnexion">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </button>
                </div>
            </aside>
            
            <main class="layout-main">
                <header class="layout-header">
                    <div class="flex items-center gap-2">
                        <span style="color: #94a3b8; font-size: 0.8125rem;">Accueil</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        <span style="font-size: 0.8125rem; font-weight: 500; color: #0f172a;">${currentPageName}</span>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        ${user.role === 'SUPER_ADMIN' ? `
                            <select id="airportSelector" class="form-control" style="width: 220px; font-size: 0.8125rem; padding: 0.375rem 0.625rem;">
                                <option value="all">Tous les aéroports (National)</option>
                                ${airportsStore.getAll().map(a => `<option value="${a.id}">${a.code_iata} - ${a.nom}</option>`).join('')}
                            </select>
                        ` : `
                            <span class="badge badge-neutral" style="font-size: 0.75rem;">
                                ${airportsStore.getById(user.airport_id)?.nom || 'Aéroport'}
                            </span>
                        `}
                        <span class="badge badge-info" style="font-size: 0.6875rem;">${new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                </header>
                
                <div class="layout-content" id="page-content">
                    <!-- Page content will be rendered here -->
                </div>
            </main>
        `;

        // Bind events
        document.getElementById('btnLogout').addEventListener('click', () => {
            auth.logout();
        });

        const airportSelector = document.getElementById('airportSelector');
        if (airportSelector) {
            airportSelector.value = auth.getCurrentAirportId() || 'all';
            airportSelector.addEventListener('change', (e) => {
                auth.setCurrentAirportId(e.target.value);
            });
        }

        // Highlight active nav link
        const updateNavLinks = () => {
            document.querySelectorAll('.nav-item').forEach(link => {
                if (link.getAttribute('data-path') === window.location.hash) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        };
        updateNavLinks();
        window.addEventListener('route-change', updateNavLinks);

        const cleanupLayout = () => {
            window.removeEventListener('route-change', updateNavLinks);
            window.removeEventListener('page-destroy', cleanupLayout);
        };
        window.addEventListener('page-destroy', cleanupLayout);

        // Render actual page content
        const pageContainer = document.getElementById('page-content');
        contentRenderer(pageContainer);
    };
}
