/**
 * Antigravity - Authentication Service
 */
import { usersStore } from './store.js';

class AuthService {
    constructor() {
        this.currentUser = this._loadSession();
    }

    _loadSession() {
        try {
            const session = localStorage.getItem('antigravity_session');
            return session ? JSON.parse(session) : null;
        } catch (e) {
            return null;
        }
    }

    _saveSession(user) {
        if (user) {
            localStorage.setItem('antigravity_session', JSON.stringify(user));
        } else {
            localStorage.removeItem('antigravity_session');
        }
        this.currentUser = user;
    }

    login(email, password) {
        // Mock authentication - just checks if user exists for now
        // In a real app, this would hash the password and check against DB
        const users = usersStore.getAll();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Create session without password
            const sessionUser = { ...user };
            delete sessionUser.password;
            this._saveSession(sessionUser);
            
            // Dispatch event for UI updates
            window.dispatchEvent(new CustomEvent('auth-change', { detail: { user: sessionUser } }));
            return { success: true, user: sessionUser };
        }
        
        return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    logout() {
        this._saveSession(null);
        window.dispatchEvent(new CustomEvent('auth-change', { detail: { user: null } }));
        window.location.hash = '#/login';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Role checking
    isSuperAdmin() {
        return this.currentUser?.role === 'SUPER_ADMIN';
    }

    isSuperviseur() {
        return this.currentUser?.role === 'SUPERVISEUR';
    }

    isTechnicien() {
        return this.currentUser?.role === 'TECHNICIEN';
    }
    
    canManageAirport(airportId) {
        if (this.isSuperAdmin()) return true;
        return this.currentUser?.airport_id === airportId;
    }

    // Getting context airport (tenant id)
    getCurrentAirportId() {
        if (!this.isAuthenticated()) return null;
        
        // Super admin can select an airport (stored in localStorage temporarily)
        if (this.isSuperAdmin()) {
            return localStorage.getItem('antigravity_selected_airport') || 'all';
        }
        
        // Others are restricted to their assigned airport
        return this.currentUser.airport_id;
    }
    
    setCurrentAirportId(airportId) {
        if (this.isSuperAdmin()) {
            localStorage.setItem('antigravity_selected_airport', airportId);
            window.dispatchEvent(new CustomEvent('airport-change', { detail: { airportId } }));
        }
    }
}

export const auth = new AuthService();
