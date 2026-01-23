const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * TRIGGER: Run automatically when a new User is created in Authentication.
 * This guarantees the user appears in Firestore (Admin Panel) instantly.
 */
exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
    const db = admin.firestore();

    // Default Data
    const userData = {
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=6366f1&color=fff`,
        lastActive: new Date().toISOString(), // Mark creation time as active
        createdAt: new Date().toISOString()
    };

    try {
        await db.collection('users').doc(user.uid).set(userData, { merge: true });
        console.log(`[Auto-Sync] Created user doc for ${user.email}`);
    } catch (error) {
        console.error(`[Auto-Sync] Error creating doc for ${user.email}`, error);
    }
});