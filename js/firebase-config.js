/**
 * Firebase Configuration
 * PASTE YOUR FIREBASE CONFIG OBJECT BELOW
 * 
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Click on your project "Orbit"
 * 3. Click the Web Icon (</>) to Add an App
 * 4. Register app (nickname: "orbit-web")
 * 5. Copy the 'const firebaseConfig = { ... }' block
 * 6. Paste it below, REPLACING the placeholder.
 */

// --- REPLACE THIS BLOCK ---
const firebaseConfig = {
    apiKey: "AIzaSyDL1jg88-Zz20Irk0CUg1q03v8InfuJ87E",
    authDomain: "orbit---daily-habit-tracker.firebaseapp.com",
    projectId: "orbit---daily-habit-tracker",
    storageBucket: "orbit---daily-habit-tracker.firebasestorage.app",
    messagingSenderId: "1028437551709",
    appId: "1:1028437551709:web:e39eb3646af845e960fbb4",
    measurementId: "G-XTVR2E9F4E"
};
// --------------------------

// Initialize Firebase (using compat libraries loaded in index.html)
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// Enable offline persistence if possible
db.enablePersistence().catch(err => {
    if (err.code == 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        console.warn('Persistence not supported by browser');
    }
});
