const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Load Service Account
const serviceAccountPath = path.join(__dirname, 'service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error("ERROR: 'service-account.json' not found!");
    console.error("Please download it from Firebase Console -> Project Settings -> Service Accounts");
    console.error("and save it in this folder as 'service-account.json'");
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// 2. Initialize App
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function syncUsers() {
    console.log("Starting User Sync...");
    let count = 0;

    try {
        // 3. List All Users
        const listUsersResult = await auth.listUsers(1000);
        const users = listUsersResult.users;

        console.log(`Found ${users.length} users in Authentication.`);

        for (const user of users) {
            const userRef = db.collection('users').doc(user.uid);
            const doc = await userRef.get();

            const userData = {
                email: user.email,
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || null,
                // If lastSignInTime is user metadata, use it, else generic now
                lastActive: user.metadata.lastSignInTime || new Date().toISOString()
            };

            if (!doc.exists) {
                await userRef.set(userData);
                console.log(`[NEW] Linked user: ${user.email}`);
            } else {
                await userRef.update(userData);
                console.log(`[UPDATED] User: ${user.email}`);
            }
            count++;
        }

        console.log(`\nSUCCESS: Synced ${count} users to Firestore.`);
        console.log("Refesh your Admin Panel to see them!");

    } catch (error) {
        console.error('Error syncing users:', error);
    }
}

syncUsers();
