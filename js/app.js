/**
 * App.js
 * Main UI Logic
 */

const App = {
    async init() {
        this.cacheDOM();
        this.bindEvents();
        this.checkAnnouncement(); // Check on load

        // Setup Date & Day Checker
        this.updateDateDisplay();
        this.startDayChecker();

        this.adminUnsub = null;

        // Auth Listener
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('User logged in:', user.email);
                this.dom.loginOverlay.classList.add('hidden'); // Hide login screen

                // Show personalized greeting if possible
                if (user.photoURL && this.dom.userGreeting) {
                    // Could update UI to show avatar, but for now just load data
                }

                // Update Profile UI
                if (this.dom.userDisplayName) {
                    // Prefer Display Name, fallback to email prefix
                    const name = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
                    this.dom.userDisplayName.textContent = name;
                }
                if (this.dom.userAvatar) {
                    // Use photoURL if available, else UI Avatars
                    const name = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
                    this.dom.userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;
                }

                // Load Data
                const success = await Store.load(user);
                if (success) {
                    this.render();
                    Charts.render();

                    // Show Admin Button if applicable
                    const adminBtn = document.getElementById('nav-admin-btn');
                    const dashboardBtn = document.querySelector('button[data-view="dashboard"]');
                    const analyticsBtn = document.querySelector('button[data-view="analytics"]');

                    // Always show Dashboard & Analytics
                    if (dashboardBtn) dashboardBtn.style.display = 'flex';
                    if (analyticsBtn) analyticsBtn.style.display = 'flex';

                    if (Store.isAdmin) {
                        // Admin gets the extra button
                        if (adminBtn) adminBtn.style.display = 'flex';
                    } else {
                        // Normal users do not
                        if (adminBtn) adminBtn.style.display = 'none';
                    }

                    // Default to Dashboard for everyone
                    this.switchView('dashboard');
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
            loginBtn: document.getElementById('google-login-btn'),

            // Email Auth Elements
            emailInput: document.getElementById('email-input'),
            passwordInput: document.getElementById('password-input'),
            togglePasswordBtn: document.getElementById('toggle-password-btn'),
            emailAuthBtn: document.getElementById('email-auth-btn'),
            emailAuthBtn: document.getElementById('email-auth-btn'),
            authToggleBtn: document.getElementById('auth-toggle-btn'),
            authToggleText: document.getElementById('auth-toggle-text'),
            forgotPasswordBtn: document.getElementById('forgot-password-btn'),

            // User Profile Elements
            logoutBtn: document.getElementById('logout-btn'),
            userAvatar: document.getElementById('user-avatar'),
            userDisplayName: document.getElementById('user-display-name'),

            // Admin Elements
            adminUserList: document.getElementById('admin-user-list'),
            adminTotalUsers: document.getElementById('admin-total-users'),
            adminActiveUsers: document.getElementById('admin-active-users'),
            adminUserList: document.getElementById('admin-user-list'),
            adminTotalUsers: document.getElementById('admin-total-users'),
            adminActiveUsers: document.getElementById('admin-active-users'),
            adminEmailBtn: document.getElementById('admin-email-btn'),

            // Enhanced Admin
            adminAnnouncementInput: document.getElementById('admin-announcement-input'),
            adminAnnouncementType: document.getElementById('admin-announcement-type'),
            adminPostBtn: document.getElementById('admin-post-announcement'),
            adminClearBtn: document.getElementById('admin-clear-announcement'),
            inspectorModal: document.getElementById('inspector-modal'),
            closeInspectorBtn: document.getElementById('close-inspector-btn'),
            inspectorContent: document.getElementById('inspector-content'),
            inspectorTitle: document.getElementById('inspector-title'),

            // Announcement
            announcementBanner: document.getElementById('announcement-banner'),
            announcementText: document.getElementById('announcement-text')
        };

        // Date Setup moved to updateDateDisplay
        this.selectedEmoji = '💧'; // Default
    },

    bindEvents() {
        this.isLoginMode = true;

        // --- Tabs Logic ---



        if (this.dom.loginBtn) {
            this.dom.loginBtn.addEventListener('click', () => {
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider).catch(error => {
                    console.error("Login failed:", error);
                    alert("Login failed: " + error.message);
                });
            });
        }

        // --- Tabs Logic ---
        if (this.dom.tabEmail && this.dom.tabPhone) {
            this.dom.tabEmail.addEventListener('click', () => this.switchAuthTab('email'));
            this.dom.tabPhone.addEventListener('click', () => this.switchAuthTab('phone'));
        }

        // --- Phone Auth Logic ---
        if (this.dom.sendOtpBtn) {
            this.dom.sendOtpBtn.addEventListener('click', () => this.handleSendOTP());
        }
        if (this.dom.verifyOtpBtn) {
            this.dom.verifyOtpBtn.addEventListener('click', () => this.handleVerifyOTP());
        }
        if (this.dom.backToPhoneBtn) {
            this.dom.backToPhoneBtn.addEventListener('click', () => {
                this.dom.phoneStep1.style.display = 'block';
                this.dom.phoneStep2.style.display = 'none';
                this.confirmationResult = null;
            });
        }

        if (this.dom.loginBtn) {
            this.dom.loginBtn.addEventListener('click', () => {
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider).catch(error => {
                    console.error("Login failed:", error);
                    alert("Login failed: " + error.message);
                });
            });
        }

        // --- Tabs Logic ---
        if (this.dom.tabEmail && this.dom.tabPhone) {
            this.dom.tabEmail.addEventListener('click', () => this.switchAuthTab('email'));
            this.dom.tabPhone.addEventListener('click', () => this.switchAuthTab('phone'));
        }

        // --- Phone Auth Logic ---
        if (this.dom.sendOtpBtn) {
            this.dom.sendOtpBtn.addEventListener('click', () => this.handleSendOTP());
        }
        if (this.dom.verifyOtpBtn) {
            this.dom.verifyOtpBtn.addEventListener('click', () => this.handleVerifyOTP());
        }
        if (this.dom.backToPhoneBtn) {
            this.dom.backToPhoneBtn.addEventListener('click', () => {
                this.dom.phoneStep1.style.display = 'block';
                this.dom.phoneStep2.style.display = 'none';
                this.confirmationResult = null;
            });
        }

        // --- Email Auth Logic ---
        if (this.dom.authToggleBtn) {
            this.dom.authToggleBtn.addEventListener('click', () => {
                this.isLoginMode = !this.isLoginMode;
                if (this.isLoginMode) {
                    this.dom.emailAuthBtn.textContent = "Log In";
                    this.dom.authToggleText.textContent = "Don't have an account?";
                    this.dom.authToggleBtn.textContent = "Sign Up";
                } else {
                    this.dom.emailAuthBtn.textContent = "Sign Up";
                    this.dom.authToggleText.textContent = "Already have an account?";
                    this.dom.authToggleBtn.textContent = "Log In";
                }
            });
        }

        if (this.dom.emailAuthBtn) {
            this.dom.emailAuthBtn.addEventListener('click', () => {
                const email = this.dom.emailInput.value.trim();
                const password = this.dom.passwordInput.value;

                if (!email || !password) {
                    alert("Please enter both email and password.");
                    return;
                }

                const handleError = (err) => {
                    console.error("Auth Error:", err);
                    let msg = "An error occurred. Please try again.";

                    if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                        msg = "Invalid email or password. If you don't have an account, please switch to 'Sign Up'.";
                    } else if (err.code === 'auth/email-already-in-use') {
                        msg = "This email is already registered. Please Log In.";
                    } else if (err.code === 'auth/weak-password') {
                        msg = "Password should be at least 6 characters.";
                    } else if (err.code === 'auth/invalid-email') {
                        msg = "Please enter a valid email address.";
                    } else if (err.code === 'auth/operation-not-allowed') {
                        msg = "Email/Password login is not enabled in Firebase Console.";
                    }

                    alert(msg);
                };

                if (this.isLoginMode) {
                    auth.signInWithEmailAndPassword(email, password).catch(handleError);
                } else {
                    auth.createUserWithEmailAndPassword(email, password).catch(handleError);
                }
            });
        }

        if (this.dom.forgotPasswordBtn) {
            this.dom.forgotPasswordBtn.addEventListener('click', () => {
                const email = this.dom.emailInput.value.trim();
                this.handlePasswordReset(email);
            });
        }

        // --- Logout ---
        if (this.dom.logoutBtn) {
            this.dom.logoutBtn.addEventListener('click', () => {
                auth.signOut().then(() => {
                    console.log("Logged out");
                    // Data clearing if needed
                    this.dom.habitList.innerHTML = '';
                    // The auth listener handles redirecting/showing overlay
                }).catch(err => {
                    console.error("Logout failed", err);
                });
            });
        }

        if (this.dom.togglePasswordBtn) {
            this.dom.togglePasswordBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent focus loss issues or form submission
                const type = this.dom.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                this.dom.passwordInput.setAttribute('type', type);

                // Toggle Icon
                const iconName = type === 'password' ? 'eye' : 'eye-off';
                this.dom.togglePasswordBtn.innerHTML = `<i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>`;
                lucide.createIcons({
                    nameAttr: 'data-lucide',
                    attrs: {
                        class: "lucide lucide-" + iconName
                    },
                    root: this.dom.togglePasswordBtn
                });
            });
        }

        // --- Google Login ---
        if (this.dom.loginBtn) {
            this.dom.loginBtn.addEventListener('click', () => {
                auth.signInWithPopup(provider).catch(err => {
                    console.error("Google Login failed", err);
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



        // --- Admin Listeners ---
        if (this.dom.adminPostBtn) {
            this.dom.adminPostBtn.addEventListener('click', async () => {
                const text = this.dom.adminAnnouncementInput.value.trim();
                const type = this.dom.adminAnnouncementType.value;
                if (text) {
                    await Store.setAnnouncement(text, type, true);
                    alert('Announcement Posted!');
                    this.checkAnnouncement();
                }
            });
        }
        if (this.dom.adminClearBtn) {
            this.dom.adminClearBtn.addEventListener('click', async () => {
                if (confirm('Clear current announcement?')) {
                    await Store.setAnnouncement('', 'info', false);
                    this.dom.adminAnnouncementInput.value = '';
                    this.checkAnnouncement();
                }
            });
        }
        // Inspector Modal
        if (this.dom.closeInspectorBtn) {
            this.dom.closeInspectorBtn.addEventListener('click', () => {
                this.dom.inspectorModal.classList.add('hidden');
            });
        }
        if (this.dom.inspectorModal) {
            this.dom.inspectorModal.addEventListener('click', (e) => {
                if (e.target === this.dom.inspectorModal) this.dom.inspectorModal.classList.add('hidden');
            });
        }
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

        // Check announcement periodically (e.g. on view switch or timer? For now just on load & manual call)
        this.checkAnnouncement();

        // Clean up Admin listener if leaving admin
        if (viewName !== 'admin' && this.adminUnsub) {
            this.adminUnsub();
            this.adminUnsub = null;
        }

        if (viewName === 'analytics') {
            Charts.render();
        } else if (viewName === 'admin') {
            this.renderAdmin();
        }
    },

    async checkAnnouncement() {
        const data = await Store.getAnnouncement();
        if (data && data.announcement && data.announcement.active) {
            const { text, type } = data.announcement;
            this.dom.announcementBanner.style.display = 'flex';
            this.dom.announcementText.textContent = text;

            // Colors
            const colors = {
                'info': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                'alert': 'linear-gradient(135deg, #ef4444, #f87171)',
                'success': 'linear-gradient(135deg, #22c55e, #4ade80)'
            };
            this.dom.announcementBanner.style.background = colors[type] || colors['info'];
        } else {
            this.dom.announcementBanner.style.display = 'none';
        }
    },

    async renderAdmin() {
        if (!Store.isAdmin) return;

        // If already listening, do nothing (or we could re-subscribe)
        if (this.adminUnsub) return;

        // Visual Feedback
        this.dom.adminUserList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-secondary);">Connecting to Real-time Stream...</td></tr>';

        // Subscribe
        this.adminUnsub = Store.subscribeToUsers(
            (users) => {
                console.log("Admin: Received", users.length, "users");

                // Stats
                const total = users.length;
                const activeThreshold = new Date();
                activeThreshold.setHours(activeThreshold.getHours() - 24);

                // Safe date parsing helper
                const safeDate = (d) => {
                    const date = new Date(d);
                    return isNaN(date.getTime()) ? new Date(0) : date;
                };

                const activeCount = users.filter(u => safeDate(u.lastActive) > activeThreshold).length;

                this.dom.adminTotalUsers.textContent = total;
                this.dom.adminActiveUsers.textContent = activeCount;

                // Table Render
                this.dom.adminUserList.innerHTML = users.map(u => {
                    const lastActive = safeDate(u.lastActive);
                    const lastActiveStr = lastActive.getFullYear() === 1970 ? 'Never' : lastActive.toLocaleDateString() + ' ' + lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                            <img src="${u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || 'User'}&background=6366f1&color=fff`}" 
                                 style="width: 32px; height: 32px; border-radius: 50%;">
                            <span>${u.displayName || 'Unknown'}</span>
                        </td>
                        <td style="padding: 1rem; color: var(--text-secondary);">${u.email || 'No Email'}</td>
                        <td style="padding: 1rem; color: var(--text-secondary);">${lastActiveStr}</td>
                        <td style="padding: 1rem; text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
                             <button class="btn-icon inspect-btn" data-uid="${u.uid}" data-name="${u.displayName}" title="View Habits" style="background: rgba(255,255,255,0.1);">
                                <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                            </button>
                        </td>
                    </tr>
                `}).join('');

                lucide.createIcons();
                this.bindAdminDynamicEvents();

                // Setup Bulk Email
                if (this.dom.adminEmailBtn) {
                    this.dom.adminEmailBtn.onclick = () => {
                        // Gather all emails, filter out empty ones
                        const emails = users
                            .map(u => u.email)
                            .filter(e => e && e.includes('@'))
                            .join(',');

                        // Open default mail client with BCC (to hide emails from each other)
                        window.location.href = `mailto:?bcc=${emails}&subject=Update from Orbit`;
                    };
                }
            },
            (error) => {
                // Error Display
                this.dom.adminUserList.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align:center; padding:2rem; color:var(--danger);">
                            <i data-lucide="alert-triangle" style="margin-bottom:0.5rem;"></i><br>
                            <strong>Connection Error</strong><br>
                            ${error.message}<br>
                            <span style="font-size:0.8rem; opacity:0.8;">Check Firebase Console > Firestore > Rules</span>
                        </td>
                    </tr>`;
                lucide.createIcons();
            }
        );

        // Setup Manual Refresh Button
        const refreshBtn = document.getElementById('admin-refresh-btn');
        if (refreshBtn) {
            refreshBtn.onclick = () => {
                if (this.adminUnsub) {
                    this.adminUnsub();
                    this.adminUnsub = null;
                }
                this.renderAdmin(); // Re-connect
            };
        }

        // Setup Manual Add Button
        const addUserBtn = document.getElementById('admin-add-user-btn');
        if (addUserBtn) {
            addUserBtn.onclick = async () => {
                const uid = prompt("Enter the User UID (from Firebase Console):");
                if (!uid) return;

                const email = prompt("Enter User Email:");
                if (!email) return;

                const name = prompt("Enter Display Name:");
                if (!name) return;

                try {
                    await Store.adminCreateUser(uid, email, name);
                    alert("User record created! They should appear in the list instantly.");
                } catch (e) {
                    alert("Error creating user: " + e.message);
                }
            };
        }
    },

    bindAdminDynamicEvents() {
        const inspectBtns = document.querySelectorAll('.inspect-btn');
        inspectBtns.forEach(btn => {
            btn.onclick = async (e) => {
                const uid = btn.dataset.uid;
                const name = btn.dataset.name;

                this.dom.inspectorModal.classList.remove('hidden');
                this.dom.inspectorTitle.textContent = `Inspecting: ${name}`;
                this.dom.inspectorContent.innerHTML = '<p style="color:var(--text-secondary)">Loading user data...</p>';

                // Fetch Data
                const habits = await Store.getUserHabits(uid);

                if (habits.length === 0) {
                    this.dom.inspectorContent.innerHTML = '<p style="text-align:center; padding:1rem;">No habits found for this user.</p>';
                } else {
                    this.dom.inspectorContent.innerHTML = habits.map(h => {
                        // Calc Streak
                        const streak = this.calculateStreak(h);
                        return `
                            <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                                <div style="display:flex; align-items:center; gap:0.5rem;">
                                    <span>${h.emoji}</span>
                                    <strong>${h.name}</strong>
                                </div>
                                <div style="color: var(--accent); font-size: 0.9rem;">
                                    🔥 ${streak} day streak
                                </div>
                            </div>
                         `;
                    }).join('');
                }
            };
        });
    },

    render() {
        const habits = Store.getHabits();
        const today = Store.getLocalDateString();

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
        const today = Store.getLocalDateString(d);

        // If checked today, include it. If not, start check from yesterday.
        if (habit.history[today]) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            // Check yesterday
            d.setDate(d.getDate() - 1);
        }

        while (true) {
            const dayStr = Store.getLocalDateString(d);
            if (habit.history[dayStr]) {
                streak++;
                d.setDate(d.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    },

    updateDateDisplay() {
        if (this.dom.dateDisplay) {
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            this.dom.dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
        }
    },

    startDayChecker() {
        // Track the last known date string (e.g., "Mon Jan 01 2024")
        this.lastDateStr = new Date().toDateString();

        // Check every minute if the day has changed
        setInterval(async () => {
            const now = new Date();
            const currentDateStr = now.toDateString();

            if (currentDateStr !== this.lastDateStr) {
                console.log("Day changed! Resetting view...", currentDateStr);
                this.lastDateStr = currentDateStr;

                // Refresh Data from Cloud (Sync)
                await Store.refresh();

                // Refresh UI
                this.updateDateDisplay();
                this.render();
                Charts.render();

                // Refresh Admin if active
                if (this.dom.adminUserList.offsetParent !== null) {
                    this.renderAdmin();
                }
            }
        }, 60000);
    },

    async handlePasswordReset(email) {
        if (!email) {
            alert("Please enter your email address first.");
            return;
        }

        try {
            await auth.sendPasswordResetEmail(email);
            alert("Password reset email sent! Please check your inbox.");
        } catch (error) {
            console.error("Reset Error:", error);
            alert("Error: " + error.message);
        }
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