const getSupabase = () => {
    if (!window.hiveSupabase) {
        throw new Error("Supabase is not ready. Please check your internet connection and try again.");
    }

    return window.hiveSupabase;
};

const getFriendlyAuthMessage = (error) => {
    const message = error?.message || "";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("confirmation email") || lowerMessage.includes("email")) {
        return "We could not send the OTP email right now. Please check your email address, then try again in a moment.";
    }

    if (lowerMessage.includes("user not found") || lowerMessage.includes("signups not allowed")) {
        return "We could not find an account with that email. Please sign up first.";
    }

    if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many")) {
        return "Too many OTP requests. Please wait a little before trying again.";
    }

    return "Something went wrong while sending your OTP. Please try again.";
};

const showAuthNotice = (message, options = {}) => {
    const { title = "Notice", type = "info", onClose = null } = options;
    let notice = document.querySelector("#authNotice");

    if (!notice) {
        notice = document.createElement("div");
        notice.className = "auth-notice";
        notice.id = "authNotice";
        notice.setAttribute("aria-hidden", "true");
        notice.innerHTML = `
            <div class="auth-notice-content" role="dialog" aria-modal="true" aria-labelledby="authNoticeTitle">
                <div class="auth-notice-header">
                    <span class="auth-notice-icon" aria-hidden="true">!</span>
                    <h2 class="auth-notice-title" id="authNoticeTitle"></h2>
                </div>
                <p class="auth-notice-message"></p>
                <div class="auth-notice-actions">
                    <button class="auth-notice-ok" type="button">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(notice);
    }

    const icon = notice.querySelector(".auth-notice-icon");
    const titleEl = notice.querySelector(".auth-notice-title");
    const messageEl = notice.querySelector(".auth-notice-message");
    const okBtn = notice.querySelector(".auth-notice-ok");

    if (icon) icon.textContent = type === "success" ? "✓" : "!";
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    const closeNotice = () => {
        notice.classList.remove("open");
        notice.setAttribute("aria-hidden", "true");
        okBtn.removeEventListener("click", closeNotice);
        notice.removeEventListener("click", handleOverlayClick);
        if (onClose) onClose();
    };

    const handleOverlayClick = (event) => {
        if (event.target === notice) closeNotice();
    };

    okBtn.addEventListener("click", closeNotice);
    notice.addEventListener("click", handleOverlayClick);
    notice.classList.add("open");
    notice.setAttribute("aria-hidden", "false");
    okBtn.focus();
};

// TOGGLE BUTTONS
const toggleButtons = document.querySelectorAll(".toggle-btn");

// FORMS
const loginForm = document.querySelector(".lForm");
const signUpForm = document.querySelector(".sForm");

// SWITCH LOGIN / SIGNUP
const setMode = (targetMode) => {
    const isSignup = targetMode === "signup";

    toggleButtons.forEach((btn) => {
        const isActive =
            btn.dataset.target === (isSignup ? "signup" : "login");

        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (!loginForm || !signUpForm) return;

    loginForm.classList.toggle("active", !isSignup);
    signUpForm.classList.toggle("active", isSignup);
};

// URL MODE
const urlMode = new URLSearchParams(window.location.search).get("mode");

if (urlMode === "signup" || urlMode === "login") {
    setMode(urlMode);
}

// TOGGLE BUTTON EVENTS
toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setMode(button.dataset.target);
    });
});

// PASSWORD TOGGLE
document.querySelectorAll(".toggle-password").forEach((toggle) => {
    toggle.addEventListener("click", () => {
        const input = toggle.previousElementSibling;

        if (!input || input.tagName !== "INPUT") return;

        input.type = input.type === "password" ? "text" : "password";
    });
});

// LOGIN
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput = document.querySelector("#login-user");

        if (!emailInput || !emailInput.value.trim()) {
            showAuthNotice("Please enter your email.", { title: "Missing Email" });
            return;
        }

        localStorage.setItem("hive_email", emailInput.value.trim());
        localStorage.setItem("hive_auth_mode", "login");

        let error = null;

        try {
            const supabase = getSupabase();
            const result = await supabase.auth.signInWithOtp({
                email: emailInput.value.trim(),
                options: {
                    shouldCreateUser: false,
                },
            });
            error = result.error;
        } catch (authError) {
            console.error("Login OTP request failed:", authError);
            showAuthNotice(getFriendlyAuthMessage(authError), { title: "OTP Not Sent" });
            return;
        }

        if (error) {
            console.error("Login OTP request failed:", error);
            showAuthNotice(getFriendlyAuthMessage(error), { title: "OTP Not Sent" });
            return;
        }

        showAuthNotice("OTP sent to your email.", {
            title: "Check Your Email",
            type: "success",
            onClose: () => {
                window.location.href = "signverf.html";
            },
        });
    });
}

// SIGNUP
if (signUpForm) {
    signUpForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput = document.querySelector("#sign-email");
        const passwordInput = document.querySelector("#sign-pass");
        const confirmPasswordInput = document.querySelector("#confirm-pass");

        if (!emailInput || !emailInput.value.trim()) {
            showAuthNotice("Please enter your email.", { title: "Missing Email" });
            return;
        }

        if (!passwordInput || !confirmPasswordInput) return;

        if (passwordInput.value !== confirmPasswordInput.value) {
            showAuthNotice("Passwords do not match.", { title: "Check Password" });
            confirmPasswordInput.focus();
            return;
        }

        localStorage.setItem("hive_email", emailInput.value.trim());
        localStorage.setItem("hive_auth_mode", "signup");
        localStorage.setItem("hive_password", passwordInput.value.trim());

        let error = null;

        try {
            const supabase = getSupabase();
            const result = await supabase.auth.signInWithOtp({
                email: emailInput.value.trim(),
                options: {
                    shouldCreateUser: true,
                },
            });
            error = result.error;
        } catch (authError) {
            console.error("Signup OTP request failed:", authError);
            showAuthNotice(getFriendlyAuthMessage(authError), { title: "OTP Not Sent" });
            return;
        }

        if (error) {
            console.error("Signup OTP request failed:", error);
            showAuthNotice(getFriendlyAuthMessage(error), { title: "OTP Not Sent" });
            return;
        }

        showAuthNotice("OTP sent to your email.", {
            title: "Check Your Email",
            type: "success",
            onClose: () => {
                window.location.href = "signverf.html";
            },
        });
    });
}

// ZOOM PREVENTION
const blockedZoomKeys = ["+", "-", "=", "_", "0"];

window.addEventListener(
    "wheel",
    (event) => {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
        }
    },
    { passive: false }
);

window.addEventListener("keydown", (event) => {
    if (
        (event.ctrlKey || event.metaKey) &&
        blockedZoomKeys.includes(event.key)
    ) {
        event.preventDefault();
    }
});

window.addEventListener("gesturestart", (event) =>
    event.preventDefault()
);

window.addEventListener("gesturechange", (event) =>
    event.preventDefault()
);

window.addEventListener("gestureend", (event) =>
    event.preventDefault()
);

// TERMS MODAL
const termsModal = document.getElementById("termsModal");
const openTerms = document.getElementById("openTermsModal");
const closeTerms = document.getElementById("closeTerms");

if (openTerms && closeTerms && termsModal) {
    openTerms.onclick = () => {
        termsModal.style.display = "flex";
    };

    closeTerms.onclick = () => {
        termsModal.style.display = "none";
    };

    window.onclick = (e) => {
        if (e.target === termsModal) {
            termsModal.style.display = "none";
        }
    };
}
