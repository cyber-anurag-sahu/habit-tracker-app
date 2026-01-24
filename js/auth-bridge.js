
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';

// Expose to global window object for vanilla JS access
window.NativeAuth = {
    isNative: Capacitor.isNativePlatform(),

    signInWithGoogle: async (options = {}) => {
        try {
            // Options might contain { scopes: [...] }
            const result = await FirebaseAuthentication.signInWithGoogle(options);
            return result;
        } catch (error) {
            console.error('Native Google Sign-In Error:', error);
            throw error;
        }
    },

    signOut: async () => {
        await FirebaseAuthentication.signOut();
    }
};
