/**
 * Antigravity - Services Data Store (Local Storage based)
 */

// Helper: Generate UUID v4
export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Generic CRUD operations for LocalStorage
class Store {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.data = this._load();
    }

    _load() {
        try {
            const stored = localStorage.getItem(`antigravity_${this.collectionName}`);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error(`Error loading collection ${this.collectionName}:`, e);
            return [];
        }
    }

    reload() {
        this.data = this._load();
    }

    _save() {
        try {
            localStorage.setItem(`antigravity_${this.collectionName}`, JSON.stringify(this.data));
            window.dispatchEvent(new CustomEvent('store-changed', { detail: { collection: this.collectionName } }));
        } catch (e) {
            console.error(`Error saving collection ${this.collectionName}:`, e);
        }
    }

    getAll(filters = {}) {
        let results = [...this.data];
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
               results = results.filter(item => item[key] === value);
            }
        }
        return results;
    }

    getById(id) {
        return this.data.find(item => item.id === id) || null;
    }

    create(item) {
        const newItem = {
            ...item,
            id: generateUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.data.push(newItem);
        this._save();
        return newItem;
    }

    update(id, updates) {
        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) return null;

        const updatedItem = {
            ...this.data[index],
            ...updates,
            updated_at: new Date().toISOString()
        };
        this.data[index] = updatedItem;
        this._save();
        return updatedItem;
    }

    delete(id) {
        const initialLength = this.data.length;
        this.data = this.data.filter(item => item.id !== id);
        if (this.data.length !== initialLength) {
            this._save();
            return true;
        }
        return false;
    }
}

// Export store instances for each entity
export const airportsStore = new Store('airports');
export const usersStore = new Store('users');
export const marchesStore = new Store('marches');
export const societesStore = new Store('societes');
export const equipementsStore = new Store('equipements');
export const preventifStore = new Store('preventif');
export const pannesStore = new Store('pannes');
export const reclamationsStore = new Store('reclamations');
export const sloConfigStore = new Store('slo_configs');

class PeriodStore {
    constructor() {
        this.selectedPeriod = localStorage.getItem('antigravity_selected_period') || 'all';
    }

    getPeriod() {
        return this.selectedPeriod;
    }

    setPeriod(period) {
        this.selectedPeriod = period;
        localStorage.setItem('antigravity_selected_period', period);
        window.dispatchEvent(new CustomEvent('period-change', { detail: { period } }));
    }
}

export const periodStore = new PeriodStore();

