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
    ADMIN_EMAILS: ['sahuanurag2109@gmail.com'], // Exclusive Access
    heartbeatInterval: null,

    // Helper: Get Local Date String (YYYY-MM-DD)
    getLocalDateString(d = new Date()) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // NEW: Async Load
    async load(user) {
        this.userId = user.uid;

        const email = user.email ? user.email.toLowerCase() : '';
        this.isAdmin = this.ADMIN_EMAILS.includes(email);

        console.log("Admin Check:", email, this.ADMIN_EMAILS, "Result:", this.isAdmin);

        // Sync User Doc (for Admin Directory) - Await to ensure creation
        await this.updateUserRegistry(user);
        this.startUserHeartbeat(user);

        return await this.refresh();
    },

    async refresh() {
        if (!this.userId) return false;

        this.habits = [];
        this.occasions = {};

        try {
            // 1. Fetch Habits
            const habitsSnap = await db.collection('users').doc(this.userId).collection('habits').get();
            habitsSnap.forEach(doc => {
                this.habits.push({ id: doc.id, ...doc.data() });
            });

            // 2. Fetch Occasions
            const occasionsDoc = await db.collection('users').doc(this.userId).collection('meta').doc('occasions').get();
            if (occasionsDoc.exists) {
                this.occasions = occasionsDoc.data();
            }

            console.log('Data Refreshed from Firestore');
            return true;
        } catch (error) {
            console.error("Error refreshing data:", error);
            return false;
        }
    },

    getHabits() {
        return this.habits;
    },

    getStats() {
        const today = this.getLocalDateString();
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
            this.touchActivity(); // Notify Admin of activity
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
                this.touchActivity(); // Notify Admin of activity
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
            this.touchActivity(); // Notify Admin of activity
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
            console.log("Registry sync success");
        } catch (e) {
            console.error("Registry sync failed", e);
        }
    },

    startUserHeartbeat(user) {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

        // Retry sync every 2 minutes to guarantee directory presence
        this.heartbeatInterval = setInterval(() => {
            this.updateUserRegistry(user);
        }, 120000);
    },

    // NEW: Update activity without full profile write
    async touchActivity() {
        if (!this.userId) return;
        try {
            await db.collection('users').doc(this.userId).update({
                lastActive: new Date().toISOString()
            });
        } catch (e) {
            // Ignore minor sync errors for activity pings
            console.warn("Activity ping failed", e);
        }
    },

    async getAllUsers() {
        if (!this.isAdmin) return [];

        try {
            // Force fetch from server to get latest updates
            const snap = await db.collection('users').get({ source: 'server' });


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

    subscribeToUsers(onUpdate) {
        if (!this.isAdmin) return () => { };

        // Return the unsubscribe function
        return db.collection('users').onSnapshot(snapshot => {
            const users = [];
            snapshot.forEach(doc => {
                users.push({ uid: doc.id, ...doc.data() });
            });
            onUpdate(users);
        }, error => {
            console.error("Admin Users Listener Error:", error);
        });
    },

    async adminCreateUser(uid, email, displayName) {
        if (!this.isAdmin) return;
        try {
            await db.collection('users').doc(uid).set({
                email: email,
                displayName: displayName,
                photoURL: `https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff`,
                lastActive: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error("Admin manual create failed", e);
            throw e;
        }
    },

    async getUserHabits(targetUid) {
        if (!this.isAdmin) return [];
        try {
            const snap = await db.collection('users').doc(targetUid).collection('habits').get({ source: 'server' });
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
