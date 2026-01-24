
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

window.NotificationService = {
    isNative: Capacitor.isNativePlatform(),

    async init() {
        if (!this.isNative) return;

        try {
            const perm = await LocalNotifications.requestPermissions();
            if (perm.display === 'granted') {
                console.log("Notification permissions granted");

                // Create Channel (Required for Android 8.0+)
                await LocalNotifications.createChannel({
                    id: 'orbit_reminders',
                    name: 'Habit Reminders',
                    description: 'Reminders for your daily habits',
                    importance: 5, // High
                    visibility: 1, // Public
                    sound: 'notification_sound.wav', // optional
                    vibration: true
                });
            } else {
                console.warn("Notification permissions denied");
            }
        } catch (e) {
            console.error("Error initializing notifications", e);
        }
    },

    async schedule(habit) {
        if (!this.isNative || !habit.hasReminder || !habit.time) return;

        const [hours, minutes] = habit.time.split(':').map(Number);
        const id = this.hashString(habit.id); // Valid integer ID for Android

        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: `Time for ${habit.emoji || '⚡'} ${habit.name}!`,
                        body: `Don't break your streak!`,
                        id: id,
                        schedule: {
                            on: { hour: hours, minute: minutes },
                            allowWhileIdle: true
                        },
                        channelId: 'orbit_reminders', // MUST match created channel
                        smallIcon: 'ic_launcher', // Use app icon as fallback
                        actionTypeId: '',
                        extra: null
                    }
                ]
            });
            console.log("Notification scheduled for", habit.name, "at", habit.time, "ID:", id);
        } catch (e) {
            console.error("Error scheduling notification", e);
        }
    },

    async cancel(habitId) {
        if (!this.isNative) return;
        const id = this.hashString(habitId);
        try {
            await LocalNotifications.cancel({ notifications: [{ id }] });
            console.log("Notification cancelled for", habitId);
        } catch (e) {
            console.error("Error cancelling notification", e);
        }
    },

    // Helper to generate safe Integer ID from String ID
    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash); // Ensure positive
    }
};
