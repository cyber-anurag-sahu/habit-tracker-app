
// --- Phone Auth Helpers ---

switchAuthTab(tab) {
    if (tab === 'email') {
        this.dom.tabEmail.classList.add('active');
        this.dom.tabPhone.classList.remove('active');
        this.dom.tabEmail.style.borderBottomColor = 'var(--accent)';
        this.dom.tabEmail.style.color = 'var(--text-primary)';
        this.dom.tabPhone.style.borderBottomColor = 'transparent';
        this.dom.tabPhone.style.color = 'var(--text-secondary)';

        this.dom.emailAuthForm.style.display = 'block';
        this.dom.phoneAuthForm.style.display = 'none';
    } else {
        this.dom.tabPhone.classList.add('active');
        this.dom.tabEmail.classList.remove('active');
        this.dom.tabPhone.style.borderBottomColor = 'var(--accent)';
        this.dom.tabPhone.style.color = 'var(--text-primary)';
        this.dom.tabEmail.style.borderBottomColor = 'transparent';
        this.dom.tabEmail.style.color = 'var(--text-secondary)';

        this.dom.phoneAuthForm.style.display = 'block';
        this.dom.emailAuthForm.style.display = 'none';

        // Initialize Recaptcha only when needed
        if (!window.recaptchaVerifier) {
            this.setupRecaptcha();
        }
    }
},

setupRecaptcha() {
    if (window.recaptchaVerifier) return; // Already setup

    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible', // or 'normal'
        'callback': (response) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            console.log("Recaptcha verified");
        },
        'expired-callback': () => {
            // Reset reCAPTCHA?
            console.log("Recaptcha expired");
        }
    });
    window.recaptchaVerifier.render();
},

    async handleSendOTP() {
    const phoneNumber = this.dom.phoneInput.value.trim();
    if (!phoneNumber) {
        alert("Please enter a phone number.");
        return;
    }

    // Regex check (simple)
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        alert("Please enter a valid phone number with country code (e.g., +15550001234)");
        return;
    }

    this.dom.sendOtpBtn.textContent = "Sending...";
    this.dom.sendOtpBtn.disabled = true;

    try {
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, appVerifier);

        // SMS sent. Prompt user to type the code.
        window.confirmationResult = confirmationResult;

        this.dom.phoneStep1.style.display = 'none';
        this.dom.phoneStep2.style.display = 'block';
        this.dom.otpInput.focus();

    } catch (error) {
        console.error("SMS Error:", error);
        alert("Error sending SMS: " + error.message);

        // Reset ReCaptcha if needed
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.render().then(widgetId => {
                grecaptcha.reset(widgetId);
            });
        }
    } finally {
        this.dom.sendOtpBtn.textContent = "Send OTP";
        this.dom.sendOtpBtn.disabled = false;
    }
},

    async handleVerifyOTP() {
    const code = this.dom.otpInput.value.trim();
    if (!code || code.length < 6) {
        alert("Please enter the 6-digit code.");
        return;
    }

    this.dom.verifyOtpBtn.textContent = "Verifying...";
    this.dom.verifyOtpBtn.disabled = true;

    try {
        const result = await window.confirmationResult.confirm(code);
        const user = result.user;
        console.log("Phone login success:", user);
        // App.init listener will handle the rest

    } catch (error) {
        console.error("OTP Error:", error);
        alert("Incorrect code. Please try again.");
    } finally {
        this.dom.verifyOtpBtn.textContent = "Verify & Login";
        this.dom.verifyOtpBtn.disabled = false;
    }
},