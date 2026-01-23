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
    async load(user, referralCode = null) {
        this.userId = user.uid;

        const email = user.email ? user.email.toLowerCase() : '';
        this.isAdmin = this.ADMIN_EMAILS.includes(email);

        console.log("Admin Check:", email, this.ADMIN_EMAILS, "Result:", this.isAdmin);

        // Sync User Doc (for Admin Directory) - Await to ensure creation
        // Pass referralCode if present (only used if new user)
        await this.updateUserRegistry(user, referralCode);
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

    calculateStreak(habit) {
        let streak = 0;
        let d = new Date();
        const today = this.getLocalDateString(d);

        // If checked today, include it. If not, start check from yesterday.
        if (habit.history[today]) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            // Check yesterday
            d.setDate(d.getDate() - 1);
        }

        while (true) {
            const dayStr = this.getLocalDateString(d);
            if (habit.history[dayStr]) {
                streak++;
                d.setDate(d.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    },

    getStats() {
        const today = this.getLocalDateString();
        const total = this.habits.length;
        if (total === 0) return { completed: 0, total: 0, percentage: 0, bestStreak: 0 };

        const completed = this.habits.filter(h => h.history[today]).length;
        const percentage = Math.round((completed / total) * 100);

        // Calculate "Perfect Day" Streak (Consequently completion of ALL habits)
        let perfectStreak = 0;
        let d = new Date();
        const todayStr = this.getLocalDateString(d);

        // 1. Check Today (if all done, start count)
        const allDoneToday = this.habits.every(h => h.history[todayStr]);
        if (allDoneToday) {
            perfectStreak++;
        }

        // 2. Check Backwards
        d.setDate(d.getDate() - 1); // Start from yesterday
        while (true) {
            const dayStr = this.getLocalDateString(d);
            const allDone = this.habits.every(h => h.history[dayStr]);
            if (allDone) {
                perfectStreak++;
                d.setDate(d.getDate() - 1);
            } else {
                break;
            }
        }

        return { completed, total, percentage, bestStreak: perfectStreak };
    },

    async addHabit(name, emoji, time = null, hasReminder = false) {
        if (!this.userId) return;

        const newHabit = {
            name,
            emoji: emoji || '⚡',
            time,
            hasReminder,
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

    async updateHabit(id, name, emoji, time, hasReminder) {
        if (!this.userId) return;

        const timeData = {
            name,
            emoji: emoji || '⚡',
            time,
            hasReminder
        };

        try {
            await db.collection('users').doc(this.userId).collection('habits').doc(id).update(timeData);

            // Update local state
            const habit = this.habits.find(h => h.id === id);
            if (habit) {
                Object.assign(habit, timeData);
            }
            this.touchActivity(); // Notify Admin
        } catch (e) {
            console.error("Error updating habit", e);
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

    async checkUserExists(uid) {
        try {
            const doc = await db.collection('users').doc(uid).get();
            return doc.exists;
        } catch (e) {
            console.error("Check user failed", e);
            return false; // Assume new or error safe
        }
    },

    async updateUserRegistry(user, referralCode = null) {
        if (!user) return;
        try {
            const userRef = db.collection('users').doc(user.uid);

            // Check if user exists to prevent overwriting 'referredBy' on subsequent logins
            const doc = await userRef.get();
            const dataToUpdate = {
                email: user.email,
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || null,
                lastActive: new Date().toISOString()
            };

            if (!doc.exists) {
                // New User
                if (referralCode) {
                    // Normalize code
                    referralCode = referralCode.toUpperCase().trim();

                    // Validate Code Existence
                    const codeRef = db.collection('referralCodes').doc(referralCode);
                    const codeDoc = await codeRef.get();

                    if (codeDoc.exists) {
                        dataToUpdate.referredBy = referralCode;
                        // Increment Counter
                        codeRef.update({
                            count: firebase.firestore.FieldValue.increment(1)
                        });
                    }
                }
            }

            await userRef.set(dataToUpdate, { merge: true });
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

    // --- Referral System ---

    async createReferralCode(code, ownerEmail) {
        if (!this.isAdmin) return { success: false, message: "Unauthorized" };

        code = code.toUpperCase().trim();
        if (code.length < 3) return { success: false, message: "Code too short" };

        try {
            // 1. Check if code exists
            const codeDoc = await db.collection('referralCodes').doc(code).get();
            if (codeDoc.exists) return { success: false, message: "Code already exists" };

            // 2. Resolve Email to UID
            let ownerUid = null;
            let ownerName = 'Unknown';

            const userSnapshot = await db.collection('users').where('email', '==', ownerEmail).limit(1).get();
            if (userSnapshot.empty) {
                return { success: false, message: "User email not found in registry" };
            }

            const userDoc = userSnapshot.docs[0];
            ownerUid = userDoc.id;
            ownerName = userDoc.data().displayName || 'User';

            // 3. Create Code
            await db.collection('referralCodes').doc(code).set({
                ownerUid: ownerUid,
                ownerName: ownerName,
                createdAt: new Date().toISOString(),
                count: 0
            });

            return { success: true, message: `Code ${code} created for ${ownerName}` };

        } catch (e) {
            console.error("Create Referral Failed", e);
            return { success: false, message: e.message };
        }
    },

    async getReferralStats() {
        if (!this.isAdmin) return [];
        try {
            const snap = await db.collection('referralCodes').get();
            const stats = [];
            snap.forEach(doc => {
                stats.push({ code: doc.id, ...doc.data() });
            });
            return stats;
        } catch (e) {
            console.error("Get Referral Stats Failed", e);
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
