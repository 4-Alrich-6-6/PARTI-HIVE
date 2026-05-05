(function () {
    const AUTH_KEY = "hive_user_auth";

    const scriptEl = document.currentScript
        || document.querySelector('script[src*="settings.js"]');
    const scriptSrc = scriptEl ? scriptEl.src : "";
    const libBaseUrl = scriptSrc.replace(/settings\.js(\?.*)?$/, "");
    const assetsBaseUrl = libBaseUrl.replace(/\/lib\/$/, "/assets/");

    const ensureStylesheet = () => {
        if (document.querySelector('link[data-settings="true"]')) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = libBaseUrl + "settings.css";
        link.setAttribute("data-settings", "true");
        document.head.appendChild(link);
    };
    ensureStylesheet();

    const loadAuth = () => {
        const saved = localStorage.getItem(AUTH_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return { email: "", password: "" };
            }
        }
        return { email: "", password: "" };
    };

    const saveAuth = (data) => {
        localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    };

    const maskEmail = (email) => {
        if (!email) return "Not set";
        const parts = email.split("@");
        if (parts.length !== 2) return email;
        const [name, domain] = parts;
        const visibleChars = Math.min(2, name.length);
        const masked = name.substring(0, visibleChars) + "*".repeat(Math.max(0, name.length - visibleChars));
        return masked + "@" + domain;
    };

    const maskPassword = (password) => {
        if (!password) return "Not set";
        return "*".repeat(password.length);
    };

    const buildModal = () => {
        const overlay = document.createElement("div");
        overlay.className = "settings-overlay";
        overlay.id = "settingsOverlay";
        overlay.setAttribute("aria-hidden", "true");

        overlay.innerHTML = `
            <div class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
                <div class="settings-header">
                    <h2 id="settingsTitle">Settings</h2>
                </div>
                <div class="settings-body">
                    <div class="settings-section">
                        <h3>Account Information</h3>
                        <div class="settings-info-row">
                            <span class="settings-label">Email:</span>
                            <span class="settings-value" id="settingsEmailDisplay"></span>
                            <button type="button" class="settings-btn settings-btn-mini" id="settingsEditEmailBtn">
                                <img src="${assetsBaseUrl}Edit.png" alt="Edit">
                            </button>
                        </div>
                        <div class="settings-info-row">
                            <span class="settings-label">Password:</span>
                            <span class="settings-value" id="settingsPasswordDisplay"></span>
                            <button type="button" class="settings-btn settings-btn-mini" id="settingsEditPasswordBtn">
                                <img src="${assetsBaseUrl}Edit.png" alt="Edit">
                            </button>
                        </div>
                    </div>
                </div>
                <div class="settings-actions">
                    <button type="button" class="settings-btn settings-btn-close" id="settingsCloseBtn">Close</button>
                </div>
            </div>

            <div class="settings-edit-overlay" id="settingsEditEmailOverlay" aria-hidden="true">
                <div class="settings-edit-modal" role="dialog" aria-modal="true" aria-labelledby="settingsEditEmailTitle">
                    <div class="settings-header">
                        <h2 id="settingsEditEmailTitle">Change Email</h2>
                    </div>
                    <form id="settingsEditEmailForm" class="settings-edit-form">
                        <div class="settings-form-group">
                            <label for="settingsCurrentEmail">Current Email</label>
                            <input type="email" id="settingsCurrentEmail" readonly>
                        </div>
                        <div class="settings-form-group">
                            <label for="settingsNewEmail">New Email</label>
                            <input type="email" id="settingsNewEmail" placeholder="Enter new email">
                        </div>
                        <div class="settings-form-group">
                            <label for="settingsEmailPassword">Password</label>
                            <input type="password" id="settingsEmailPassword" placeholder="Enter your password">
                        </div>
                        <div class="settings-edit-actions">
                            <button type="button" class="settings-btn settings-btn-cancel" id="settingsEditEmailCancelBtn">Cancel</button>
                            <button type="submit" class="settings-btn settings-btn-save" id="settingsEditEmailSaveBtn">Save</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="settings-edit-overlay" id="settingsEditPasswordOverlay" aria-hidden="true">
                <div class="settings-edit-modal" role="dialog" aria-modal="true" aria-labelledby="settingsEditPasswordTitle">
                    <div class="settings-header">
                        <h2 id="settingsEditPasswordTitle">Change Password</h2>
                    </div>
                    <form id="settingsEditPasswordForm" class="settings-edit-form">
                        <div class="settings-form-group">
                            <label for="settingsCurrentPassword">Current Password</label>
                            <input type="password" id="settingsCurrentPassword" placeholder="Enter current password">
                        </div>
                        <div class="settings-form-group">
                            <label for="settingsNewPassword">New Password</label>
                            <input type="password" id="settingsNewPassword" placeholder="Enter new password">
                        </div>
                        <div class="settings-form-group">
                            <label for="settingsConfirmPassword">Confirm New Password</label>
                            <input type="password" id="settingsConfirmPassword" placeholder="Confirm new password">
                        </div>
                        <div class="settings-edit-actions">
                            <button type="button" class="settings-btn settings-btn-cancel" id="settingsEditPasswordCancelBtn">Cancel</button>
                            <button type="submit" class="settings-btn settings-btn-save" id="settingsEditPasswordSaveBtn">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        return overlay;
    };

    const init = () => {
        const settingsBtns = document.querySelectorAll(".settings");
        if (!settingsBtns.length) return;

        const overlay = buildModal();
        const emailDisplay = overlay.querySelector("#settingsEmailDisplay");
        const passwordDisplay = overlay.querySelector("#settingsPasswordDisplay");
        const closeBtn = overlay.querySelector("#settingsCloseBtn");

        const editEmailOverlay = overlay.querySelector("#settingsEditEmailOverlay");
        const editEmailBtn = overlay.querySelector("#settingsEditEmailBtn");
        const editEmailCancelBtn = overlay.querySelector("#settingsEditEmailCancelBtn");
        const editEmailForm = overlay.querySelector("#settingsEditEmailForm");
        const currentEmailInput = overlay.querySelector("#settingsCurrentEmail");
        const newEmailInput = overlay.querySelector("#settingsNewEmail");
        const emailPasswordInput = overlay.querySelector("#settingsEmailPassword");

        const editPasswordOverlay = overlay.querySelector("#settingsEditPasswordOverlay");
        const editPasswordBtn = overlay.querySelector("#settingsEditPasswordBtn");
        const editPasswordCancelBtn = overlay.querySelector("#settingsEditPasswordCancelBtn");
        const editPasswordForm = overlay.querySelector("#settingsEditPasswordForm");
        const currentPasswordInput = overlay.querySelector("#settingsCurrentPassword");
        const newPasswordInput = overlay.querySelector("#settingsNewPassword");
        const confirmPasswordInput = overlay.querySelector("#settingsConfirmPassword");

        const updateDisplay = () => {
            const auth = loadAuth();
            if (emailDisplay) emailDisplay.textContent = maskEmail(auth.email);
            if (passwordDisplay) passwordDisplay.textContent = maskPassword(auth.password);
        };

        const openModal = (event) => {
            if (event) event.preventDefault();
            updateDisplay();
            overlay.classList.add("open");
            overlay.setAttribute("aria-hidden", "false");
        };

        const closeModal = () => {
            overlay.classList.remove("open");
            overlay.setAttribute("aria-hidden", "true");
        };

        const openEmailModal = () => {
            const auth = loadAuth();
            if (currentEmailInput) currentEmailInput.value = auth.email || "";
            if (newEmailInput) newEmailInput.value = "";
            if (emailPasswordInput) emailPasswordInput.value = "";
            editEmailOverlay.classList.add("open");
            editEmailOverlay.setAttribute("aria-hidden", "false");
        };

        const closeEmailModal = () => {
            editEmailOverlay.classList.remove("open");
            editEmailOverlay.setAttribute("aria-hidden", "true");
            if (editEmailForm) editEmailForm.reset();
        };

        const openPasswordModal = () => {
            if (currentPasswordInput) currentPasswordInput.value = "";
            if (newPasswordInput) newPasswordInput.value = "";
            if (confirmPasswordInput) confirmPasswordInput.value = "";
            editPasswordOverlay.classList.add("open");
            editPasswordOverlay.setAttribute("aria-hidden", "false");
        };

        const closePasswordModal = () => {
            editPasswordOverlay.classList.remove("open");
            editPasswordOverlay.setAttribute("aria-hidden", "true");
            if (editPasswordForm) editPasswordForm.reset();
        };

        settingsBtns.forEach((btn) => {
            btn.addEventListener("click", openModal);
        });

        closeBtn.addEventListener("click", closeModal);

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeModal();
        });

        editEmailOverlay.addEventListener("click", (event) => {
            if (event.target === editEmailOverlay) closeEmailModal();
        });

        editPasswordOverlay.addEventListener("click", (event) => {
            if (event.target === editPasswordOverlay) closePasswordModal();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                if (editEmailOverlay.classList.contains("open")) {
                    closeEmailModal();
                } else if (editPasswordOverlay.classList.contains("open")) {
                    closePasswordModal();
                } else if (overlay.classList.contains("open")) {
                    closeModal();
                }
            }
        });

        editEmailBtn.addEventListener("click", openEmailModal);
        editEmailCancelBtn.addEventListener("click", closeEmailModal);

        if (editEmailForm) {
            editEmailForm.addEventListener("submit", (event) => {
                event.preventDefault();

                const auth = loadAuth();
                const password = emailPasswordInput ? emailPasswordInput.value.trim() : "";
                const newEmail = newEmailInput ? newEmailInput.value.trim() : "";

                if (password !== auth.password) {
                    alert("Password is incorrect.");
                    return;
                }

                if (!newEmail) {
                    alert("Please enter a new email.");
                    return;
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                    alert("Please enter a valid email address.");
                    return;
                }

                if (typeof showConfirmation === 'function') {
                    showConfirmation(
                        `Are you sure you want to change your email to "${newEmail}"?`,
                        () => {
                            const updatedAuth = {
                                email: newEmail,
                                password: auth.password
                            };

                            saveAuth(updatedAuth);
                            updateDisplay();
                            closeEmailModal();
                            alert("Email updated successfully.");
                        },
                        { title: "Change Email", confirmText: "Change", cancelText: "Cancel" }
                    );
                } else {
                    const updatedAuth = {
                        email: newEmail,
                        password: auth.password
                    };

                    saveAuth(updatedAuth);
                    updateDisplay();
                    closeEmailModal();
                    alert("Email updated successfully.");
                }
            });
        }

        editPasswordBtn.addEventListener("click", openPasswordModal);
        editPasswordCancelBtn.addEventListener("click", closePasswordModal);

        if (editPasswordForm) {
            editPasswordForm.addEventListener("submit", (event) => {
                event.preventDefault();

                const auth = loadAuth();
                const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : "";
                const newPassword = newPasswordInput ? newPasswordInput.value.trim() : "";
                const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : "";

                if (currentPassword !== auth.password) {
                    alert("Current password is incorrect.");
                    return;
                }

                if (!newPassword) {
                    alert("Please enter a new password.");
                    return;
                }

                if (newPassword.length < 6) {
                    alert("Password must be at least 6 characters.");
                    return;
                }

                if (newPassword !== confirmPassword) {
                    alert("New passwords do not match.");
                    return;
                }

                if (typeof showConfirmation === 'function') {
                    showConfirmation(
                        "Are you sure you want to change your password?",
                        () => {
                            const updatedAuth = {
                                email: auth.email,
                                password: newPassword
                            };

                            saveAuth(updatedAuth);
                            updateDisplay();
                            closePasswordModal();
                            alert("Password updated successfully.");
                        },
                        { title: "Change Password", confirmText: "Change", cancelText: "Cancel" }
                    );
                } else {
                    const updatedAuth = {
                        email: auth.email,
                        password: newPassword
                    };

                    saveAuth(updatedAuth);
                    updateDisplay();
                    closePasswordModal();
                    alert("Password updated successfully.");
                }
            });
        }

        updateDisplay();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
