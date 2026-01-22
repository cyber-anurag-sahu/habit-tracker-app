/**
 * App.js
 * Main UI Logic
 */

const App = {
    async init() {
        this.cacheDOM();
        this.bindEvents();

        // Auth Listener
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('User logged in:', user.email);
                this.dom.loginOverlay.classList.add('hidden'); // Hide login screen

                // Show personalized greeting if possible
                if (user.photoURL && this.dom.userGreeting) {
                    // Could update UI to show avatar, but for now just load data
                }

                // Load Data
                const success = await Store.load(user.uid);
                if (success) {
                    this.render();
                    Charts.render();
                }
            } else {
                console.log('User logged out');
                this.dom.loginOverlay.classList.remove('hidden'); // Show login screen
            }
        });
    },

    cacheDOM() {
        this.dom = {
            habitList: document.getElementById('habit-list'),
            dateDisplay: document.getElementById('current-date'),
            statCompleted: document.getElementById('stat-completed'),
            statStreak: document.getElementById('stat-streak'),
            statEfficiency: document.getElementById('stat-efficiency'),
            addBtn: document.getElementById('add-habit-btn'),
            modalOverlay: document.getElementById('modal-overlay'),
            closeModalBtn: document.getElementById('close-modal'),
            habitForm: document.getElementById('habit-form'),
            habitNameInput: document.getElementById('habit-name'),
            emojiOptions: document.querySelectorAll('.emoji-opt'),
            navBtns: document.querySelectorAll('.nav-btn'),
            views: document.querySelectorAll('.view'),

            // New Elements
            loginOverlay: document.getElementById('login-overlay'),
            loginBtn: document.getElementById('google-login-btn')
        };

        // Date Setup
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        this.dom.dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);

        this.selectedEmoji = '💧'; // Default
    },

    bindEvents() {
        // Login
        if (this.dom.loginBtn) {
            this.dom.loginBtn.addEventListener('click', () => {
                auth.signInWithPopup(provider).catch(err => {
                    console.error("Login failed", err);
                    alert("Login failed: " + err.message);
                });
            });
        }

        // Modal
        this.dom.addBtn.addEventListener('click', () => {
            this.dom.modalOverlay.classList.remove('hidden');
            this.dom.habitNameInput.focus();
        });

        this.dom.closeModalBtn.addEventListener('click', () => {
            this.dom.modalOverlay.classList.add('hidden');
        });

        this.dom.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.dom.modalOverlay) {
                this.dom.modalOverlay.classList.add('hidden');
            }
        });

        // Form Submit
        this.dom.habitForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = this.dom.habitNameInput.value.trim();
            if (name) {
                // Async Add
                await Store.addHabit(name, '⚡');
                this.dom.habitNameInput.value = '';
                this.dom.modalOverlay.classList.add('hidden');

                // Re-render
                this.render();
                Charts.render();
            }
        });

        // Navigation
        this.dom.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const viewName = btn.dataset.view;
                this.switchView(viewName);
            });
        });

        // Calendar Navigation
        const prevBtn = document.getElementById('month-prev');
        const nextBtn = document.getElementById('month-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                Charts.changeMonth(-1);
                lucide.createIcons();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                Charts.changeMonth(1);
                lucide.createIcons();
            });
        }

        // Occasion Modal Logic
        const occasionModal = document.getElementById('occasion-modal-overlay');
        const closeOccasionBtn = document.getElementById('close-occasion-modal');
        const occasionForm = document.getElementById('occasion-form');
        const occasionDateInput = document.getElementById('occasion-date-input');
        const occasionTextInput = document.getElementById('occasion-text');
        const occasionTitle = document.getElementById('occasion-date-title');

        // Close
        closeOccasionBtn.addEventListener('click', () => occasionModal.classList.add('hidden'));
        occasionModal.addEventListener('click', (e) => {
            if (e.target === occasionModal) occasionModal.classList.add('hidden');
        });

        // Calendar Grid Delegation for Day Clicks
        const yearContainer = document.getElementById('year-container');
        if (yearContainer) {
            yearContainer.addEventListener('click', (e) => {
                const dayEl = e.target.closest('.mini-day');
                if (dayEl && !dayEl.classList.contains('empty')) {
                    const dateStr = dayEl.dataset.date;
                    const occasions = Store.getOccasions();

                    // Open Modal
                    occasionModal.classList.remove('hidden');
                    occasionDateInput.value = dateStr;
                    occasionTitle.textContent = `Set Occasion: ${dateStr}`;
                    occasionTextInput.value = occasions[dateStr] || '';
                    occasionTextInput.focus();
                }
            });
        }

        // Save Occasion
        occasionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const date = occasionDateInput.value;
            const text = occasionTextInput.value.trim();

            await Store.saveOccasion(date, text);
            occasionModal.classList.add('hidden');

            // Refresh calendar
            Charts.renderCalendar(Store.getHabits());
        });
    },

    switchView(viewName) {
        // Update Buttons
        this.dom.navBtns.forEach(btn => {
            if (btn.dataset.view === viewName) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Update Views
        this.dom.views.forEach(view => {
            if (view.id === `view-${viewName}`) {
                view.classList.remove('hidden');
                view.classList.add('active');
            } else {
                view.classList.add('hidden');
                view.classList.remove('active');
            }
        });

        if (viewName === 'analytics') {
            Charts.render();
        }
    },

    render() {
        const habits = Store.getHabits();
        const today = new Date().toISOString().split('T')[0];

        // 1. Render Stats
        const stats = Store.getStats();
        this.dom.statCompleted.textContent = `${stats.completed}/${stats.total}`;
        this.dom.statStreak.textContent = `${stats.bestStreak} days`;
        this.dom.statEfficiency.textContent = `${stats.percentage}%`;

        // 2. Render List
        this.dom.habitList.innerHTML = '';

        if (habits.length === 0) {
            this.dom.habitList.innerHTML = `
                <div class="empty-state" style="text-align:center; color:var(--text-secondary); padding:2rem;">
                    <i data-lucide="clipboard-list" style="width:48px;height:48px;margin-bottom:1rem;opacity:0.5;"></i>
                    <p>No habits yet. Click "New Habit" to start!</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        habits.forEach(habit => {
            const isCompleted = !!habit.history[today];
            const currentStreak = this.calculateStreak(habit);

            const el = document.createElement('div');
            el.className = 'habit-item';
            
            // Set data-id on buttons for robust selection
            el.innerHTML = `
                <div class="habit-left">
                    <div class="habit-emoji">${habit.emoji || '⚡'}</div>
                    <div class="habit-details">
                        <h4>${habit.name}</h4>
                        <div class="habit-streak">
                            <i data-lucide="flame" size="14"></i> ${currentStreak} day streak
                        </div>
                    </div>
                </div>
                <div style="display:flex; align-items:center;">
                    <button class="check-btn ${isCompleted ? 'completed' : ''}" data-id="${habit.id}">
                        <i data-lucide="check"></i>
                    </button>
                    <button class="delete-btn" data-id="${habit.id}" data-name="${habit.name}">
                        <i data-lucide="trash-2" size="18"></i>
                    </button>
                </div>
            `;

            // Check Event
            const checkBtn = el.querySelector('.check-btn');
            checkBtn.addEventListener('click', async (e) => {
                // FIXED: Use closest() to get the button even if icon is clicked
                const btn = e.target.closest('.check-btn');
                const id = btn.dataset.id;
                
                await Store.toggleCheck(id, today);
                this.render();
                Charts.render();

                // Animation effect
                if (!isCompleted) {
                    confettiEffect(btn);
                }
            });

            // Delete Event
            const deleteBtn = el.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                // FIXED: Use closest() to guarantee we get the ID
                const btn = e.target.closest('.delete-btn');
                const id = btn.dataset.id;
                const name = btn.dataset.name;

                console.log("Deleting ID:", id); // Debug log

                if (confirm(`Delete habit "${name}"?`)) {
                    await Store.deleteHabit(id);
                    this.render();
                    Charts.render();
                }
            });

            this.dom.habitList.appendChild(el);
        });

        lucide.createIcons();
    },

    calculateStreak(habit) {
        let streak = 0;
        let d = new Date();
        const today = d.toISOString().split('T')[0];

        // If checked today, include it. If not, start check from yesterday.
        if (habit.history[today]) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            // Check yesterday
            d.setDate(d.getDate() - 1);
        }

        while (true) {
            const dayStr = d.toISOString().split('T')[0];
            if (habit.history[dayStr]) {
                streak++;
                d.setDate(d.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }
};

// Simple Confetti (Bonus visual)
function confettiEffect(btn) {
    btn.style.transform = "scale(1.2)";
    setTimeout(() => btn.style.transform = "scale(1)", 200);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});