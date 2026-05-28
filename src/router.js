/**
 * Antigravity - Simple SPA Router
 */
import { auth } from './services/auth.js';

export class Router {
    constructor(routes) {
        this.routes = routes;
        this.currentRoute = null;
        this.appContainer = document.getElementById('app');
        
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    init() {
        if (!window.location.hash) {
            window.location.hash = '#/';
        }
        this.handleRoute();
    }

    handleRoute() {
        const hash = window.location.hash || '#/';
        // Simple matching for now
        let path = hash.split('?')[0];
        if (path === '#') path = '#/';

        const route = this.routes.find(r => r.path === path);

        if (!route) {
            this.appContainer.innerHTML = '<h1>404 - Non trouvé</h1>';
            return;
        }

        // Authentication guard
        if (route.requiresAuth && !auth.isAuthenticated()) {
            window.location.hash = '#/login';
            return;
        }

        // RBAC Role guard
        if (route.roles && auth.isAuthenticated()) {
            const user = auth.getCurrentUser();
            if (!route.roles.includes(user.role)) {
                this.appContainer.innerHTML = `
                    <div style="padding: 2rem; text-align: center;">
                        <h1>Accès Refusé</h1>
                        <p>Vous n'avez pas les permissions nécessaires pour voir cette page.</p>
                        <button class="btn btn-primary mt-4" onclick="window.location.hash='#/'">Retour au Dashboard</button>
                    </div>
                `;
                return;
            }
        }

        // Redirect root based on auth
        if (path === '#/') {
            if (auth.isAuthenticated()) {
                window.location.hash = '#/dashboard';
                return;
            } else {
                window.location.hash = '#/login';
                return;
            }
        }

        // Dispatch page-destroy event for existing page cleanup
        window.dispatchEvent(new CustomEvent('page-destroy'));

        // Render the component
        if (route.component) {
            route.component(this.appContainer);
        }
        
        this.currentRoute = route;
        
        // Dispatch event for active nav links
        window.dispatchEvent(new CustomEvent('route-change', { detail: { path } }));
    }
}
