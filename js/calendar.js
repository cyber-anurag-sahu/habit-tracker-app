/**
 * Calendar.js
 * Service for Google Calendar API
 */

window.CalendarService = {
    accessToken: null,
    isConnected: false,
    currentUserId: null,

    loadSession(userId) {
        this.currentUserId = userId;
        const token = sessionStorage.getItem(`orbit_gcal_token_${userId}`);
        if (token) {
            this.accessToken = token;
            this.isConnected = true;
            console.log("Calendar Service: Token restored for user", userId);
        } else {
            this.reset();
        }
    },

    setToken(token) {
        this.accessToken = token;
        this.isConnected = !!token;
        if (this.currentUserId) {
            if (token) {
                sessionStorage.setItem(`orbit_gcal_token_${this.currentUserId}`, token);
            } else {
                sessionStorage.removeItem(`orbit_gcal_token_${this.currentUserId}`);
            }
        }
    },

    reset() {
        this.accessToken = null;
        this.isConnected = false;
    },

    async createEvent(habit) {
        if (!this.accessToken) {
            console.warn("Calendar: No access token");
            return null;
        }

        if (!habit.time || !habit.hasReminder) return null;

        const [hours, minutes] = habit.time.split(':');

        // Calculate start time for the next occurrence
        const now = new Date();
        const startTime = new Date();
        startTime.setHours(parseInt(hours), parseInt(minutes), 0);

        // If time passed today, schedule for tomorrow? 
        // Actually, for a recurring event, we can just start it from today or tomorrow.
        // Let's safe-guard and start from today if possible, or tomorrow.
        if (startTime < now) {
            // It's fine, Google Calendar handles past start times for recurring events correctly (it just starts next instance)
        }

        const endTime = new Date(startTime);
        endTime.setMinutes(startTime.getMinutes() + 15); // 15 min block

        const event = {
            summary: `${habit.emoji} ${habit.name}`,
            description: `Orbit Habit Reminder: ${habit.name}`,
            start: {
                dateTime: startTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            recurrence: [
                'RRULE:FREQ=DAILY'
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 0 }, // At time of event
                    { method: 'popup', minutes: 10 } // 10 min before
                ]
            }
        };

        try {
            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Calendar Event Created:", data.id);
                return data.id;
            } else {
                console.error("Calendar API Error:", await response.text());
                return null;
            }
        } catch (error) {
            console.error("Calendar Network Error:", error);
            return null;
        }
    },

    async deleteEvent(eventId) {
        if (!this.accessToken || !eventId) return;

        try {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            console.log("Calendar Event Deleted:", eventId);
        } catch (error) {
            console.error("Calendar Delete Error:", error);
        }
    },

    // Check if we have valid access by making a lightweight call
    async validateConnection() {
        if (!this.accessToken) return false;
        try {
            const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    }
};