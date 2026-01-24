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
        this.startClock();
        this.startDayChecker();
        this.startReminderChecker();
        this.registerServiceWorker();
        this.startReminderChecker();
        this.registerServiceWorker();
        // CalendarService.init() removed - loaded per user now

        if (window.Budget) Budget.init();

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

                // Load Calendar Session for this User
                CalendarService.loadSession(user.uid);

                // Load Data
                const success = await Store.load(user, this.pendingReferralCode);
                // Clear after use
                this.pendingReferralCode = null;

                if (success) {
                    this.render();
                    Charts.render();

                    // Check Calendar Connection
                    // Check Calendar Connection
                    // Removed updateCalendarUI call since function was deleted
                    if (!CalendarService.isConnected) {
                        // Optional: Validate if the token is still good
                        CalendarService.validateConnection().then(isValid => {
                            if (!isValid) CalendarService.setToken(null);
                        });
                    }

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
                CalendarService.reset(); // Clear calendar state
                this.dom.loginOverlay.classList.remove('hidden'); // Show login screen
            }
        });
    },

    cacheDOM() {
        this.dom = {
            habitList: document.getElementById('habit-list'),
            dateDisplay: document.getElementById('current-date'),
            currentTime: document.getElementById('current-time'),
            statCompleted: document.getElementById('stat-completed'),
            statStreak: document.getElementById('stat-streak'),
            statEfficiency: document.getElementById('stat-efficiency'),
            addBtn: document.getElementById('add-habit-btn'),
            modalOverlay: document.getElementById('modal-overlay'),
            modalTitle: document.querySelector('.modal-header h3'),
            modalSubmitBtn: document.querySelector('.form-actions button'),
            closeModalBtn: document.getElementById('close-modal'),
            habitForm: document.getElementById('habit-form'),
            habitNameInput: document.getElementById('habit-name'),
            // Time Selects
            habitTimeHour: document.getElementById('habit-time-hour'),
            habitTimeMinute: document.getElementById('habit-time-minute'),
            habitTimeAmpm: document.getElementById('habit-time-ampm'),

            habitReminderBtn: document.getElementById('habit-reminder-btn'),
            habitReminderText: document.getElementById('habit-reminder-text'),
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
            habitTimeMinute: document.getElementById('habit-time-minute'),
            habitTimeAmpm: document.getElementById('habit-time-ampm'),
            habitReminderBtn: document.getElementById('habit-reminder-btn'),
            habitReminderText: document.getElementById('habit-reminder-text'),
            habitReminderTrack: document.getElementById('habit-reminder-track'),
            habitReminderKnob: document.getElementById('habit-reminder-knob'),

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
            announcementText: document.getElementById('announcement-text'),

            // Modal Prompt
            calendarPrompt: document.getElementById('calendar-prompt'),
            modalConnectBtn: document.getElementById('modal-connect-calendar-btn')
        };

        // Date Setup moved to updateDateDisplay
        this.selectedEmoji = '💧'; // Default
    },

    bindEvents() {
        this.isLoginMode = true;

        // --- Tabs Logic ---





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
                // Toggle Referral Input
                const refContainer = document.getElementById('referral-input-container');
                if (this.isLoginMode) {
                    this.dom.emailAuthBtn.textContent = "Log In";
                    this.dom.authToggleText.textContent = "Don't have an account?";
                    this.dom.authToggleBtn.textContent = "Sign Up";
                    if (refContainer) refContainer.style.display = 'none';
                } else {
                    this.dom.emailAuthBtn.textContent = "Sign Up";
                    this.dom.authToggleText.textContent = "Already have an account?";
                    this.dom.authToggleBtn.textContent = "Log In";
                    if (refContainer) refContainer.style.display = 'block';
                }
            });
        }

        if (this.dom.emailAuthBtn) {
            this.dom.emailAuthBtn.addEventListener('click', () => {
                const email = this.dom.emailInput.value.trim();
                const password = this.dom.passwordInput.value;
                const referralCode = document.getElementById('signup-referral-code') ? document.getElementById('signup-referral-code').value.trim() : null;

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
                    // Sign Up Flow
                    // Store code in a temp var for the AuthListener to pick up or handle explicitly
                    this.pendingReferralCode = referralCode;
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
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider).catch(err => {
                    console.error("Google Login failed", err);
                    alert("Login failed: " + err.message);
                });
            });
        }

        // Modal
        this.dom.addBtn.addEventListener('click', () => {
            this.openModal();
        });

        this.dom.closeModalBtn.addEventListener('click', () => {
            this.closeModal();
        });

        this.dom.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.dom.modalOverlay) {
                this.closeModal();
            }
        });

        // Form Submit
        this.dom.habitForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = this.dom.habitNameInput.value.trim();

            // Construct Time
            let hour = parseInt(this.dom.habitTimeHour.value, 10);
            const minute = this.dom.habitTimeMinute.value;
            const ampm = this.dom.habitTimeAmpm.value;

            if (ampm === 'PM' && hour < 12) hour += 12;
            if (ampm === 'AM' && hour === 12) hour = 0;
            const time = `${String(hour).padStart(2, '0')}:${minute}`;

            const hasReminder = this.dom.habitReminderBtn.dataset.active === 'true';

            if (name) {
                if (this.editingId) {
                    // Update
                    await Store.updateHabit(this.editingId, name, '⚡', time, hasReminder);
                    this.closeModal();
                } else {
                    // Create
                    await Store.addHabit(name, '⚡', time, hasReminder);
                    this.closeModal();
                }

                // Re-render
                this.render();
                Charts.render();
            }
        });

        // Toggle Reminder Button Logic
        if (this.dom.habitReminderBtn) {
            this.dom.habitReminderBtn.addEventListener('click', () => {
                const isActive = this.dom.habitReminderBtn.dataset.active === 'true';

                if (!isActive) {
                    // Turn ON
                    if (CalendarService && CalendarService.isConnected) {
                        this.toggleReminderState(true);
                    } else {
                        // Not connected? Trigger Auth Flow
                        if (confirm("Connect Google Calendar to enable reliable background reminders?")) {
                            this.handleConnectCalendar().then(() => {
                                if (CalendarService.isConnected) {
                                    this.toggleReminderState(true);
                                }
                            });
                        }
                    }
                } else {
                    // Turn OFF
                    this.toggleReminderState(false);
                }
            });
        }

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

    async handleConnectCalendar() {
        if (!auth.currentUser) return;

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/calendar.events');

        try {
            // We use linkWithPopup or reauthenticate
            // Let's try reauth first as it's safer for existing users
            // Or if we just want the token, we can use signInWithPopup again, but that might re-trigger auth flow
            const result = await auth.currentUser.reauthenticateWithPopup(provider);
            const credential = result.credential;
            const accessToken = credential.accessToken;

            if (accessToken) {
                CalendarService.setToken(accessToken);
                alert("Google Calendar Connected! Future habits will be synced.");
                // updateCalendarUI(true); // removed
            }
        } catch (error) {
            console.error("Calendar Auth Error:", error);
            alert("Connection failed: " + error.message);
        }
    },

    // updateCalendarUI removed

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
        } else if (viewName === 'budget') {
            console.log("App: Switching to Budget View");
            Budget.render();
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

        // Init Pagination State
        this.pagination = {
            currentPage: 1,
            itemsPerPage: 7,
            allUsers: [],
            searchQuery: ''
        };

        // Subscribe
        this.adminUnsub = Store.subscribeToUsers(
            (users) => {
                console.log("Admin: Received", users.length, "users");

                // Update State
                this.pagination.allUsers = users;

                // Stats (Calc on full list)
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

                // Render Current Page
                this.renderUserTable();

                // Setup Bulk Email
                if (this.dom.adminEmailBtn) {
                    this.dom.adminEmailBtn.onclick = () => {
                        const emails = users
                            .map(u => u.email)
                            .filter(e => e && e.includes('@'))
                            .join(',');
                        window.location.href = `mailto:?bcc=${emails}&subject=Update from Orbit`;
                    };
                }
            },
            (error) => {
                this.dom.adminUserList.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align:center; padding:2rem; color:var(--danger);">
                            <i data-lucide="alert-triangle" style="margin-bottom:0.5rem;"></i><br>
                            <strong>Connection Error</strong><br>
                            ${error.message}<br>
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

        // Setup Search Listener
        const searchInput = document.getElementById('admin-user-search');
        if (searchInput && !searchInput.dataset.listening) {
            searchInput.dataset.listening = "true"; // Prevent double bind
            searchInput.addEventListener('input', (e) => {
                this.pagination.searchQuery = e.target.value.toLowerCase().trim();
                this.pagination.currentPage = 1; // Reset to first page
                this.renderUserTable();
            });
        }

        // Setup Pagination Listeners (One-time bind check)
        if (!this.paginationInitialized) {
            const prevBtn = document.getElementById('user-page-prev');
            const nextBtn = document.getElementById('user-page-next');

            if (prevBtn) {
                prevBtn.onclick = () => {
                    if (this.pagination.currentPage > 1) {
                        this.pagination.currentPage--;
                        this.renderUserTable();
                    }
                };
            }
            if (nextBtn) {
                nextBtn.onclick = () => {
                    // Start: Recalculate Max Page based on filtered list
                    const filtered = this.getFilteredUsers();
                    const maxPage = Math.ceil(filtered.length / this.pagination.itemsPerPage);
                    // End: Recalculate

                    if (this.pagination.currentPage < maxPage) {
                        this.pagination.currentPage++;
                        this.renderUserTable();
                    }
                };
            }
            this.paginationInitialized = true;
        }
    },

    getFilteredUsers() {
        const { allUsers, searchQuery } = this.pagination;
        if (!searchQuery) return allUsers;

        return allUsers.filter(u => {
            const email = (u.email || '').toLowerCase();
            const name = (u.displayName || '').toLowerCase();
            return email.includes(searchQuery) || name.includes(searchQuery);
        });
    },

    renderUserTable() {
        const { currentPage, itemsPerPage } = this.pagination;

        // Filter first
        const pageUsersFull = this.getFilteredUsers();

        const total = pageUsersFull.length;
        const totalPages = Math.ceil(total / itemsPerPage) || 1;

        // Ensure Page Validity
        if (currentPage > totalPages) this.pagination.currentPage = totalPages;
        // Also if we reset search and currentPage was 1 but effectively 0 because empty.. just ensure >= 1
        if (this.pagination.currentPage < 1) this.pagination.currentPage = 1;

        const start = (this.pagination.currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageUsers = pageUsersFull.slice(start, end);

        // Update Table
        const safeDate = (d) => {
            const date = new Date(d);
            return isNaN(date.getTime()) ? new Date(0) : date;
        };

        if (pageUsers.length === 0) {
            this.dom.adminUserList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-secondary);">No matching users found.</td></tr>';
        } else {
            this.dom.adminUserList.innerHTML = pageUsers.map(u => {
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
        }

        lucide.createIcons();
        this.bindAdminDynamicEvents();

        // Update Pagination Controls
        const prevBtn = document.getElementById('user-page-prev');
        const nextBtn = document.getElementById('user-page-next');
        const info = document.getElementById('user-page-info');

        if (info) info.textContent = `Page ${this.pagination.currentPage} of ${totalPages} (${total} total)`;
        if (prevBtn) prevBtn.disabled = this.pagination.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.pagination.currentPage === totalPages;

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

        // --- Referral Manager Logic Main ---
        const createRefBtn = document.getElementById('admin-create-ref-btn');
        if (createRefBtn) {
            createRefBtn.onclick = async () => {
                const code = document.getElementById('admin-ref-code-input').value;
                const email = document.getElementById('admin-ref-email-input').value;

                if (!code || !email) {
                    alert("Please enter both Code and Email");
                    return;
                }

                const res = await Store.createReferralCode(code, email);
                if (res.success) {
                    alert(res.message);
                    this.renderReferralStats(); // Refresh
                } else {
                    alert("Error: " + res.message);
                }
            };
        }

        // Initial Render of Stats
        this.renderReferralStats();
    },

    async renderReferralStats() {
        const stats = await Store.getReferralStats();
        const tbody = document.getElementById('admin-referral-list');
        const canvas = document.getElementById('referralChart');

        // Table
        if (tbody) {
            tbody.innerHTML = stats.map(s => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <td style="padding: 1rem; font-weight: bold; color: var(--accent);">${s.code}</td>
                    <td style="padding: 1rem; color: var(--text-secondary);">${s.ownerName}</td>
                    <td style="padding: 1rem; text-align: right; font-weight: bold;">${s.count}</td>
                </tr>
            `).join('');

            if (stats.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:1rem; color: var(--text-secondary);">No referral codes active.</td></tr>`;
            }
        }

        // Chart
        if (canvas) {
            const ctx = canvas.getContext('2d');

            // Sort by count desc
            stats.sort((a, b) => b.count - a.count);

            // Destroy old chart if exists to avoid overlay
            if (this.referralChartInstance) {
                this.referralChartInstance.destroy();
            }

            this.referralChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: stats.map(s => s.code),
                    datasets: [{
                        label: 'Referrals',
                        data: stats.map(s => s.count),
                        backgroundColor: '#6366f1',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#9ca3af', stepSize: 1 }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#9ca3af' }
                        }
                    }
                }
            });
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

                // Fetch Data Parallel
                const [habits, transactions, budgetLimit] = await Promise.all([
                    Store.getUserHabits(uid),
                    Store.getUserTransactions(uid),
                    Store.getUserBudgetLimit(uid)
                ]);

                // Calculate Stats
                let totalSpent = 0;
                let totalIncome = 0;
                transactions.forEach(t => {
                    if (t.type === 'expense') totalSpent += t.amount;
                    else totalIncome += t.amount;
                });

                // Format Money Helper
                const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

                // Build HTML
                let html = `<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                    <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 8px;">
                        <span style="font-size:0.75rem; color:var(--text-secondary);">Budget Goal</span>
                        <div style="font-weight:bold; font-size:1.1rem;">${fmt(budgetLimit)}</div>
                    </div>
                     <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 8px;">
                        <span style="font-size:0.75rem; color:var(--text-secondary);">Total Spent</span>
                        <div style="font-weight:bold; font-size:1.1rem; color:var(--danger);">${fmt(totalSpent)}</div>
                    </div>
                </div>`;

                html += `<h4 style="margin-bottom:0.5rem; border-bottom:1px solid var(--glass-border); padding-bottom:0.2rem;">Habits (${habits.length})</h4>`;

                if (habits.length === 0) {
                    html += '<p style="text-align:center; padding:0.5rem; font-size:0.9rem; color:var(--text-secondary);">No habits found.</p>';
                } else {
                    html += habits.map(h => {
                        const streak = Store.calculateStreak(h);
                        return `
                            <div style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;">
                                <div style="display:flex; align-items:center; gap:0.5rem;">
                                    <span>${h.emoji}</span>
                                    <span>${h.name}</span>
                                </div>
                                <span style="font-size: 0.8rem; color: var(--accent);">🔥 ${streak}</span>
                            </div>
                         `;
                    }).join('');
                }

                html += `<h4 style="margin-top:1rem; margin-bottom:0.5rem; border-bottom:1px solid var(--glass-border); padding-bottom:0.2rem;">Recent Transactions</h4>`;

                if (transactions.length === 0) {
                    html += '<p style="text-align:center; padding:0.5rem; font-size:0.9rem; color:var(--text-secondary);">No transactions found.</p>';
                } else {
                    // Show last 5
                    const recent = transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
                    html += recent.map(t => {
                        const isExp = t.type === 'expense';
                        return `
                             <div style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; font-size:0.9rem;">
                                <span>${t.description}</span>
                                <span style="color: ${isExp ? 'var(--danger)' : 'var(--success)'};">${isExp ? '-' : '+'} ${fmt(t.amount)}</span>
                            </div>
                        `;
                    }).join('');
                }

                this.dom.inspectorContent.innerHTML = html;
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
                    <p>No habits yet. Click "Add New Habit" to start!</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        habits.forEach(habit => {
            const isCompleted = !!habit.history[today];
            const currentStreak = Store.calculateStreak(habit);

            const el = document.createElement('div');
            el.className = 'habit-item';

            // Set data-id on buttons for robust selection
            el.innerHTML = `
                <div class="habit-left">
                    <div class="habit-emoji">${habit.emoji || '⚡'}</div>
                    <div class="habit-details">
                        <h4>${habit.name}</h4>
                        <div class="habit-streak">
                            ${habit.hasReminder && habit.time ? `<i data-lucide="clock" style="width:14px; height:14px; margin-right:4px;"></i> ${habit.time} &bull; ` : ''}
                            <i data-lucide="flame" size="14"></i> ${currentStreak} day streak
                        </div>
                    </div>
                </div>
                <div style="display:flex; align-items:center;">
                    <button class="btn-icon edit-btn" data-id="${habit.id}" title="Edit" style="color:var(--text-secondary); font-size: 0.85rem; background: transparent; border: 1px solid rgba(255,255,255,0.2); padding: 0.3rem 0.6rem; border-radius: 6px; margin-right: 0.75rem;">
                         Edit
                    </button>
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

            // Edit Event
            const editBtn = el.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openModal(habit);
                });
            }

            this.dom.habitList.appendChild(el);
        });

        lucide.createIcons();
    },

    openModal(habit = null) {
        this.dom.modalOverlay.classList.remove('hidden');

        if (habit) {
            // Edit Mode
            this.editingId = habit.id;
            this.dom.modalTitle.textContent = "Edit Habit";
            this.dom.modalSubmitBtn.textContent = "Update Habit";
            this.dom.habitNameInput.value = habit.name;

            if (habit.time) {
                const [h, m] = habit.time.split(':');
                let hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                if (hour > 12) hour -= 12;
                if (hour === 0) hour = 12;

                this.dom.habitTimeHour.value = String(hour).padStart(2, '0');
                this.dom.habitTimeMinute.value = m;
                this.dom.habitTimeAmpm.value = ampm;
            }

            this.toggleReminderState(habit.hasReminder);
        } else {
            // Create Mode
            this.editingId = null;
            this.dom.modalTitle.textContent = "Create New Habit";
            this.dom.modalSubmitBtn.textContent = "Create Habit";
            this.dom.habitNameInput.value = '';
            // Defaults
            this.dom.habitTimeHour.value = '09';
            this.dom.habitTimeMinute.value = '00';
            this.dom.habitTimeAmpm.value = 'AM';
            this.toggleReminderState(false);
        }
        this.dom.habitNameInput.focus();
    },

    closeModal() {
        this.dom.modalOverlay.classList.add('hidden');
        this.editingId = null;
    },

    updateDateDisplay() {
        if (this.dom.dateDisplay) {
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            this.dom.dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
        }
    },

    updateTimeDisplay() {
        if (this.dom.currentTime) {
            this.dom.currentTime.textContent = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    },

    startClock() {
        this.updateTimeDisplay();
        setInterval(() => this.updateTimeDisplay(), 1000);
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

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Register at root so scope includes everything
                await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker Registered');

                // Listen for messages from SW (e.g. "Done" clicked)
                navigator.serviceWorker.addEventListener('message', async (event) => {
                    if (event.data && event.data.type === 'HABIT_DONE') {
                        const { habitId } = event.data;
                        console.log("Notification 'Done' clicked for ID:", habitId);

                        // Toggle Check
                        const today = Store.getLocalDateString();
                        await Store.toggleCheck(habitId, today);

                        // Refresh UI
                        this.render();
                        Charts.render();
                    }
                });

            } catch (error) {
                console.error('SW Registration failed:', error);
            }
        }
    },

    toggleReminderState(isActive) {
        if (!this.dom.habitReminderBtn) return;

        if (isActive) {
            // Button Style
            this.dom.habitReminderBtn.dataset.active = 'true';
            this.dom.habitReminderBtn.style.background = 'var(--accent)';
            this.dom.habitReminderBtn.style.color = '#fff';
            this.dom.habitReminderBtn.style.borderColor = 'var(--accent)';
            this.dom.habitReminderBtn.style.opacity = '1';
            this.dom.habitReminderText.textContent = "Synced with Google Calendar";

            // Toggle Animation (ON)
            if (this.dom.habitReminderKnob) {
                this.dom.habitReminderKnob.style.transform = 'translateX(20px)';
                this.dom.habitReminderKnob.style.background = '#fff';
            }
            if (this.dom.habitReminderTrack) {
                this.dom.habitReminderTrack.style.background = 'rgba(0,0,0,0.2)';
            }

            lucide.createIcons({
                nameAttr: 'data-lucide',
                attrs: { class: "lucide lucide-check" },
                root: this.dom.habitReminderBtn
            });
        } else {
            // Button Style
            this.dom.habitReminderBtn.dataset.active = 'false';
            this.dom.habitReminderBtn.style.background = 'var(--bg-color)';
            this.dom.habitReminderBtn.style.color = 'var(--text-secondary)';
            this.dom.habitReminderBtn.style.borderColor = 'var(--border-color)';
            this.dom.habitReminderBtn.style.opacity = '0.7';
            this.dom.habitReminderText.textContent = "Add to Google Calendar";

            // Toggle Animation (OFF)
            if (this.dom.habitReminderKnob) {
                this.dom.habitReminderKnob.style.transform = 'translateX(0)';
                this.dom.habitReminderKnob.style.background = 'var(--text-secondary)';
            }
            if (this.dom.habitReminderTrack) {
                this.dom.habitReminderTrack.style.background = 'rgba(255,255,255,0.1)';
            }

            lucide.createIcons({
                nameAttr: 'data-lucide',
                attrs: { class: "lucide lucide-calendar" },
                root: this.dom.habitReminderBtn
            });
        }
    },

    startReminderChecker() {
        // Check every 10 seconds
        setInterval(() => {
            this.checkReminders();
        }, 10000);
    },

    async checkReminders() {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        const now = new Date();
        // Ensure 24-hour format matching input (00-23)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;

        // Prevent multiple notifications in the same minute
        if (this.lastCheckedTime === currentTime) return;
        this.lastCheckedTime = currentTime;

        const habits = Store.getHabits();

        // Attempt to get SW Registration
        let reg = null;
        if ('serviceWorker' in navigator) {
            reg = await navigator.serviceWorker.ready.catch(() => null);
        }

        habits.forEach(h => {
            // Need to handle null time or non-reminder habits
            if (h.hasReminder && h.time === currentTime) {
                const title = `Time for ${h.name}!`;
                const options = {
                    body: `Don't forget to ${h.name} ${h.emoji || '⚡'}`,
                    icon: '/icon-192.png', // Ensure this exists or use a remote URL
                    badge: '/icon-192.png',
                    requireInteraction: true,
                    data: { habitId: h.id },
                    actions: [
                        { action: 'done', title: 'Done' }
                    ]
                };

                if (reg) {
                    // Show Actionable Notification via SW
                    reg.showNotification(title, options).catch(err => console.error("SW Notification failed", err));
                } else {
                    // Fallback: Standard Notification (No Buttons)
                    const n = new Notification(title, options);
                    n.onclick = () => {
                        window.focus();
                        n.close();
                    };
                }
            }
        });
    },

    // sendTestNotification Removed

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