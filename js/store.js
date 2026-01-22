/**
 * Store.js
 * Manages State & Persistence (Firestore)
 */

window.Store = {
    habits: [],
    occasions: {},
    userId: null,

    userId: null,
    isAdmin: false,

    // Admin List
    ADMIN_EMAILS: ['sahuanurag2109@proton.me'], // Exclusive Access

    // NEW: Async Load
    async load(user) {
        this.userId = user.uid;

        const email = user.email ? user.email.toLowerCase() : '';
        this.isAdmin = this.ADMIN_EMAILS.includes(email);

        console.log("Admin Check:", email, this.ADMIN_EMAILS, "Result:", this.isAdmin);

        this.habits = [];
        this.occasions = {};

        // Sync User Doc (for Admin Directory)
        this.updateUserRegistry(user);

        try {
            // 1. Fetch Habits
            // Using onSnapshot for generic "fetch once" behavior or real-time?
            // For simplicity and matching current architecture, let's just fetch once.
            // If we want real-time, we'd set listeners, but that requires more refactoring of App.js
            // If we want real-time, we'd set listeners, but that requires more refactoring of App.js
            const habitsSnap = await db.collection('users').doc(this.userId).collection('habits').get();
            habitsSnap.forEach(doc => {
                this.habits.push({ id: doc.id, ...doc.data() });
            });

            // 2. Fetch Occasions
            const occasionsDoc = await db.collection('users').doc(this.userId).collection('meta').doc('occasions').get();
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
    },

    // --- Admin Features ---

    async updateUserRegistry(user) {
        if (!user) return;
        try {
            // Ensure the parent doc users/{uid} exists so we can list it
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || null,
                lastActive: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error("Registry sync failed", e);
        }
    },

    async getAllUsers() {
        if (!this.isAdmin) return [];

        try {
            const snap = await db.collection('users').get(); // Removed limit for now to see all

            const users = [];
            snap.forEach(doc => {
                users.push({ uid: doc.id, ...doc.data() });
            });
            return users;
        } catch (e) {
            console.error("Admin: Get Users failed", e);
            return [];
        }
    },

    async getUserHabits(targetUid) {
        if (!this.isAdmin) return [];
        try {
            const snap = await db.collection('users').doc(targetUid).collection('habits').get();
            const habits = [];
            snap.forEach(doc => habits.push({ id: doc.id, ...doc.data() }));
            return habits;
        } catch (e) {
            console.error("Admin: Get User Habits failed", e);
            return [];
        }
    },

    // --- Announcement System ---

    async getAnnouncement() {
        try {
            const doc = await db.collection('settings').doc('global').get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.error("Fetch announcement failed", e);
            return null;
        }
    },

    async setAnnouncement(text, type = 'info', active = true) {
        if (!this.isAdmin) return;
        try {
            await db.collection('settings').doc('global').set({
                announcement: {
                    text,
                    type,
                    active,
                    updatedAt: new Date().toISOString(),
                    by: this.userId
                }
            }, { merge: true });
        } catch (e) {
            console.error("Set announcement failed", e);
            alert("Error setting announcement: " + e.message); // Admin feedback
        }
    }
};
