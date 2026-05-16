(function () {
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

    const maskEmail = (email) => {
        if (!email) return "Not set";
        const [name, domain] = email.split("@");
        if (!domain) return email;
        const visible = Math.min(2, name.length);
        return name.substring(0, visible) + "*".repeat(Math.max(0, name.length - visible)) + "@" + domain;
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
                            <span class="settings-value" id="settingsEmailDisplay">Loading...</span>
                            <button type="button" class="settings-btn settings-btn-mini" id="settingsEditEmailBtn">
                                <img src="${assetsBaseUrl}Edit.png" alt="Edit">
                            </button>
                        </div>
                        <div class="settings-info-row">
                            <span class="settings-label">Password:</span>
                            <span class="settings-value">••••••••</span>
                            <button type="button" class="settings-btn settings-btn-mini" id="settingsEditPasswordBtn">
                                <img src="${assetsBaseUrl}Edit.png" alt="Edit">
                            </button>
                        </div>
                    </div>
                    <p id="settingsStatusMsg" style="color:#e74c3c;font-size:13px;margin-top:8px;min-height:18px;"></p>
                </div>
                <div class="settings-actions">
                    <button type="button" class="settings-btn settings-btn-close" id="settingsCloseBtn">Close</button>
                </div>
            </div>

            <!-- Change Email Modal -->
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
                        <p id="emailErrorMsg" style="color:#e74c3c;font-size:13px;min-height:18px;"></p>
                        <div class="settings-edit-actions">
                            <button type="button" class="settings-btn settings-btn-cancel" id="settingsEditEmailCancelBtn">Cancel</button>
                            <button type="submit" class="settings-btn settings-btn-save" id="settingsEditEmailSaveBtn">Save</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Change Password Modal -->
            <div class="settings-edit-overlay" id="settingsEditPasswordOverlay" aria-hidden="true">
                <div class="settings-edit-modal" role="dialog" aria-modal="true" aria-labelledby="settingsEditPasswordTitle">
                    <div class="settings-header">
                        <h2 id="settingsEditPasswordTitle">Change Password</h2>
                    </div>
                    <form id="settingsEditPasswordForm" class="settings-edit-form">
                        <div class="settings-form-group">
                            <label for="settingsNewPassword">New Password</label>
                            <input type="password" id="settingsNewPassword" placeholder="Enter new password">
                        </div>
                        <div class="settings-form-group">
                            <label for="settingsConfirmPassword">Confirm New Password</label>
                            <input type="password" id="settingsConfirmPassword" placeholder="Confirm new password">
                        </div>
                        <p id="passwordErrorMsg" style="color:#e74c3c;font-size:13px;min-height:18px;"></p>
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
        const statusMsg = overlay.querySelector("#settingsStatusMsg");
        const closeBtn = overlay.querySelector("#settingsCloseBtn");

        const editEmailOverlay = overlay.querySelector("#settingsEditEmailOverlay");
        const editEmailBtn = overlay.querySelector("#settingsEditEmailBtn");
        const editEmailCancelBtn = overlay.querySelector("#settingsEditEmailCancelBtn");
        const editEmailForm = overlay.querySelector("#settingsEditEmailForm");
        const currentEmailInput = overlay.querySelector("#settingsCurrentEmail");
        const newEmailInput = overlay.querySelector("#settingsNewEmail");
        const emailErrorMsg = overlay.querySelector("#emailErrorMsg");

        const editPasswordOverlay = overlay.querySelector("#settingsEditPasswordOverlay");
        const editPasswordBtn = overlay.querySelector("#settingsEditPasswordBtn");
        const editPasswordCancelBtn = overlay.querySelector("#settingsEditPasswordCancelBtn");
        const editPasswordForm = overlay.querySelector("#settingsEditPasswordForm");
        const newPasswordInput = overlay.querySelector("#settingsNewPassword");
        const confirmPasswordInput = overlay.querySelector("#settingsConfirmPassword");
        const passwordErrorMsg = overlay.querySelector("#passwordErrorMsg");

        const setStatus = (el, msg, isError = true) => {
            if (!el) return;
            el.textContent = msg;
            el.style.color = isError ? "#e74c3c" : "#27ae60";
        };

        // Load and display current email from Supabase Auth
        const loadCurrentEmail = async () => {
            try {
                const { data: { user } } = await hiveSupabase.auth.getUser();
                if (user?.email && emailDisplay) {
                    emailDisplay.textContent = maskEmail(user.email);
                }
                return user?.email || "";
            } catch {
                return "";
            }
        };

        const openModal = async (event) => {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            window.HiveLoading?.hide();
            setStatus(statusMsg, "");
            await loadCurrentEmail();
            overlay.classList.add("open");
            overlay.setAttribute("aria-hidden", "false");
        };

        const closeModal = () => {
            overlay.classList.remove("open");
            overlay.setAttribute("aria-hidden", "true");
        };

        const openEmailModal = async () => {
            const email = await loadCurrentEmail();
            if (currentEmailInput) currentEmailInput.value = email;
            if (newEmailInput) newEmailInput.value = "";
            setStatus(emailErrorMsg, "");
            editEmailOverlay.classList.add("open");
            editEmailOverlay.setAttribute("aria-hidden", "false");
        };

        const closeEmailModal = () => {
            editEmailOverlay.classList.remove("open");
            editEmailOverlay.setAttribute("aria-hidden", "true");
            if (editEmailForm) editEmailForm.reset();
            setStatus(emailErrorMsg, "");
        };

        const openPasswordModal = () => {
            if (newPasswordInput) newPasswordInput.value = "";
            if (confirmPasswordInput) confirmPasswordInput.value = "";
            setStatus(passwordErrorMsg, "");
            editPasswordOverlay.classList.add("open");
            editPasswordOverlay.setAttribute("aria-hidden", "false");
        };

        const closePasswordModal = () => {
            editPasswordOverlay.classList.remove("open");
            editPasswordOverlay.setAttribute("aria-hidden", "true");
            if (editPasswordForm) editPasswordForm.reset();
            setStatus(passwordErrorMsg, "");
        };

        // Settings button click — stop propagation to avoid loading screen
        settingsBtns.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                openModal(e);
            });
        });

        closeBtn.addEventListener("click", closeModal);
        overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
        editEmailOverlay.addEventListener("click", (e) => { if (e.target === editEmailOverlay) closeEmailModal(); });
        editPasswordOverlay.addEventListener("click", (e) => { if (e.target === editPasswordOverlay) closePasswordModal(); });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (editEmailOverlay.classList.contains("open")) closeEmailModal();
                else if (editPasswordOverlay.classList.contains("open")) closePasswordModal();
                else if (overlay.classList.contains("open")) closeModal();
            }
        });

        editEmailBtn.addEventListener("click", openEmailModal);
        editEmailCancelBtn.addEventListener("click", closeEmailModal);

        // Change Email — uses Supabase Auth updateUser
        if (editEmailForm) {
            editEmailForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const newEmail = newEmailInput ? newEmailInput.value.trim() : "";

                if (!newEmail) { setStatus(emailErrorMsg, "Please enter a new email."); return; }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setStatus(emailErrorMsg, "Please enter a valid email address."); return; }

                const saveBtn = overlay.querySelector("#settingsEditEmailSaveBtn");
                if (saveBtn) saveBtn.disabled = true;
                setStatus(emailErrorMsg, "Saving...", false);

                const confirm = () => new Promise((resolve) => {
                    if (typeof showConfirmation === "function") {
                        showConfirmation(
                            `Change your email to "${newEmail}"?`,
                            () => resolve(true),
                            { title: "Change Email", confirmText: "Change", cancelText: "Cancel" }
                        );
                        // If user cancels, resolve false via a small trick
                        const cancelBtnEl = document.querySelector(".confirmation-cancel, .confirm-cancel, #confirmCancelBtn");
                        if (cancelBtnEl) {
                            const origClick = cancelBtnEl.onclick;
                            cancelBtnEl.addEventListener("click", () => resolve(false), { once: true });
                        }
                    } else {
                        resolve(window.confirm(`Change your email to "${newEmail}"?`));
                    }
                });

                try {
                    const { error } = await hiveSupabase.auth.updateUser({ email: newEmail });

                    if (error) {
                        setStatus(emailErrorMsg, error.message || "Failed to update email.");
                        if (saveBtn) saveBtn.disabled = false;
                        return;
                    }

                    setStatus(emailErrorMsg, "A confirmation link has been sent to your new email. Please verify it to complete the change.", false);
                    emailDisplay.textContent = maskEmail(newEmail);
                    setTimeout(() => closeEmailModal(), 3000);
                } catch (err) {
                    setStatus(emailErrorMsg, "An unexpected error occurred.");
                } finally {
                    if (saveBtn) saveBtn.disabled = false;
                }
            });
        }

        editPasswordBtn.addEventListener("click", openPasswordModal);
        editPasswordCancelBtn.addEventListener("click", closePasswordModal);

        // Change Password — uses Supabase Auth updateUser
        if (editPasswordForm) {
            editPasswordForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const newPassword = newPasswordInput ? newPasswordInput.value.trim() : "";
                const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : "";

                if (!newPassword) { setStatus(passwordErrorMsg, "Please enter a new password."); return; }
                if (newPassword.length < 6) { setStatus(passwordErrorMsg, "Password must be at least 6 characters."); return; }
                if (newPassword !== confirmPassword) { setStatus(passwordErrorMsg, "Passwords do not match."); return; }

                const saveBtn = overlay.querySelector("#settingsEditPasswordSaveBtn");
                if (saveBtn) saveBtn.disabled = true;
                setStatus(passwordErrorMsg, "Saving...", false);

                try {
                    const { error } = await hiveSupabase.auth.updateUser({ password: newPassword });

                    if (error) {
                        setStatus(passwordErrorMsg, error.message || "Failed to update password.");
                        if (saveBtn) saveBtn.disabled = false;
                        return;
                    }

                    setStatus(passwordErrorMsg, "Password updated successfully!", false);
                    setTimeout(() => closePasswordModal(), 2000);
                } catch (err) {
                    setStatus(passwordErrorMsg, "An unexpected error occurred.");
                } finally {
                    if (saveBtn) saveBtn.disabled = false;
                }
            });
        }

        // Load email on init
        loadCurrentEmail();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();