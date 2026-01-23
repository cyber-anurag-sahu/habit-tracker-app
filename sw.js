self.addEventListener('install', (event) => {
    // Force new SW to enter the waiting phase immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Force new SW to become separate from the old one and take control
    event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'done') {
        // Handle "Done" action
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                // Prioritize visible windows
                const client = clientList.find(c => c.visibilityState === 'visible') || clientList[0];

                if (client) {
                    client.postMessage({
                        type: 'HABIT_DONE',
                        habitId: event.notification.data.habitId
                    });
                }
            })
        );
    }
    // "cancel" action just closes the notification (default behavior above)
});
