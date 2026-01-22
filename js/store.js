/**
 * Store.js
 * Manages State & Persistence (Firestore)
 */

window.Store = {
    habits: [],
    occasions: {},
    userId: null,

    // NEW: Async Load
    async load(uid) {
        this.userId = uid;
        this.habits = [];
        this.occasions = {};

        try {
            // 1. Fetch Habits
            // Using onSnapshot for generic "fetch once" behavior or real-time?
            // For simplicity and matching current architecture, let's just fetch once.
            // If we want real-time, we'd set listeners, but that requires more refactoring of App.js
            const habitsSnap = await db.collection('users').doc(uid).collection('habits').get();
            habitsSnap.forEach(doc => {
                this.habits.push({ id: doc.id, ...doc.data() });
            });

            // 2. Fetch Occasions
            const occasionsDoc = await db.collection('users').doc(uid).collection('meta').doc('occasions').get();
            if (occasionsDoc.exists) {
                this.occasions = occasionsDoc.data();
            }

            console.log('Data Loaded from Firestore');
            return true;
        } catch (error) {
            console.error("Error loading data:", error);
            return false;
        }
    },

    getHabits() {
        return this.habits;
    },

    getStats() {
        const today = new Date().toISOString().split('T')[0];
        const total = this.habits.length;
        if (total === 0) return { completed: 0, total: 0, percentage: 0, bestStreak: 0 };

        const completed = this.habits.filter(h => h.history[today]).length;
        const percentage = Math.round((completed / total) * 100);

        // Simple best streak calc for summary
        // In a real app we'd calc max streak across all habits
        // We'll return 0 here and let App.js calculate per-habit streaks or improve this later
        return { completed, total, percentage, bestStreak: 0 };
    },

    async addHabit(name, emoji) {
        if (!this.userId) return;

        const newHabit = {
            name,
            emoji: emoji || '⚡',
            history: {},
            createdAt: new Date().toISOString()
        };

        try {
            const docRef = await db.collection('users').doc(this.userId).collection('habits').add(newHabit);
            // Update local state
            const habitWithId = { id: docRef.id, ...newHabit };
            this.habits.push(habitWithId);
            return habitWithId;
        } catch (e) {
            console.error("Error adding habit", e);
        }
    },

    async toggleCheck(id, date) {
        if (!this.userId) return;

        const habit = this.habits.find(h => h.id === id);
        if (habit) {
            // Toggle local
            if (habit.history[date]) delete habit.history[date];
            else habit.history[date] = true;

            // Sync DB
            try {
                await db.collection('users').doc(this.userId).collection('habits').doc(id).update({
                    history: habit.history
                });
            } catch (e) {
                console.error("Error updating habit", e);
            }
        }
    },

    async deleteHabit(id) {
        if (!this.userId) return;

        try {
            await db.collection('users').doc(this.userId).collection('habits').doc(id).delete();
            this.habits = this.habits.filter(h => h.id !== id);
        } catch (e) {
            console.error("Delete failed", e);
        }
    },

    getOccasions() {
        return this.occasions;
    },

    async saveOccasion(date, text) {
        if (!this.userId) return;

        if (text) {
            this.occasions[date] = text;
        } else {
            delete this.occasions[date];
        }

        try {
            await db.collection('users').doc(this.userId).collection('meta').doc('occasions').set(this.occasions);
        } catch (e) {
            console.error("Occasion save failed", e);
        }
    }
};
