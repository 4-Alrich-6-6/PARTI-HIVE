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
                            <div style="display:flex;gap:8px;">
                                <input type="email" id="settingsNewEmail" placeholder="Enter new email" style="flex:1;">
                                <button type="button" class="settings-btn settings-btn-save" id="settingsSendOtpBtn" style="white-space:nowrap;min-width:90px;">Send OTP</button>
                            </div>
                        </div>
                        <div class="settings-form-group" id="settingsOtpGroup" style="display:none;border-top:2px solid #ffcc00;padding-top:12px;margin-top:4px;">
                            <label for="settingsEmailOtp">Enter OTP sent to your new email</label>
                            <input type="text" id="settingsEmailOtp" placeholder="6-digit code" maxlength="6" autocomplete="one-time-code" inputmode="numeric">
                        </div>
                        <p id="emailErrorMsg" style="color:#e74c3c;font-size:13px;min-height:18px;"></p>
                        <div class="settings-edit-actions">
                            <button type="button" class="settings-btn settings-btn-cancel" id="settingsEditEmailCancelBtn">Cancel</button>
                            <button type="submit" class="settings-btn settings-btn-save" id="settingsEditEmailSaveBtn" disabled>Save</button>
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
        const sendOtpBtn = overlay.querySelector("#settingsSendOtpBtn");
        const otpGroup = overlay.querySelector("#settingsOtpGroup");
        const emailOtpInput = overlay.querySelector("#settingsEmailOtp");
        const emailErrorMsg = overlay.querySelector("#emailErrorMsg");
        let emailOtpCooldown = null;

        const editPasswordOverlay = overlay.querySelector("#settingsEditPasswordOverlay");
        const editPasswordBtn = overlay.querySelector("#settingsEditPasswordBtn");
        const editPasswordCancelBtn = overlay.querySelector("#settingsEditPasswordCancelBtn");
        const editPasswordForm = overlay.querySelector("#settingsEditPasswordForm");
        const currentPasswordInput = overlay.querySelector("#settingsCurrentPassword");
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

        const resetEmailModal = () => {
            if (newEmailInput) newEmailInput.value = "";
            if (emailOtpInput) emailOtpInput.value = "";
            if (otpGroup) otpGroup.style.display = "none";
            const saveBtn = overlay.querySelector("#settingsEditEmailSaveBtn");
            if (saveBtn) saveBtn.disabled = true;
            if (sendOtpBtn) { sendOtpBtn.disabled = false; sendOtpBtn.textContent = "Send OTP"; }
            if (emailOtpCooldown) { clearInterval(emailOtpCooldown); emailOtpCooldown = null; }
            setStatus(emailErrorMsg, "");
        };

        const openEmailModal = async () => {
            const email = await loadCurrentEmail();
            if (currentEmailInput) currentEmailInput.value = email;
            resetEmailModal();
            editEmailOverlay.classList.add("open");
            editEmailOverlay.setAttribute("aria-hidden", "false");
        };

        const closeEmailModal = () => {
            editEmailOverlay.classList.remove("open");
            editEmailOverlay.setAttribute("aria-hidden", "true");
            resetEmailModal();
        };

        const startOtpCooldown = () => {
            let secs = 60;
            if (sendOtpBtn) { sendOtpBtn.disabled = true; sendOtpBtn.textContent = `Resend (${secs}s)`; }
            emailOtpCooldown = setInterval(() => {
                secs--;
                if (secs <= 0) {
                    clearInterval(emailOtpCooldown);
                    emailOtpCooldown = null;
                    if (sendOtpBtn) { sendOtpBtn.disabled = false; sendOtpBtn.textContent = "Resend OTP"; }
                } else {
                    if (sendOtpBtn) sendOtpBtn.textContent = `Resend (${secs}s)`;
                }
            }, 1000);
        };

        const openPasswordModal = () => {
            if (currentPasswordInput) currentPasswordInput.value = "";
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

        // Send OTP to new email via email change flow (does NOT create a new account)
        if (sendOtpBtn) {
            sendOtpBtn.addEventListener("click", async () => {
                console.log("Send OTP button clicked");
                const newEmail = newEmailInput ? newEmailInput.value.trim() : "";
                if (!newEmail) { setStatus(emailErrorMsg, "Please enter a new email."); return; }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setStatus(emailErrorMsg, "Please enter a valid email address."); return; }

                setStatus(emailErrorMsg, "Sending OTP...", false);
                try {
                    console.log("Sending OTP to:", newEmail);
                    const { error } = await hiveSupabase.auth.updateUser({ email: newEmail });
                    console.log("updateUser response:", { error });
                    if (error) { setStatus(emailErrorMsg, error.message || "Failed to send OTP."); return; }
                    setStatus(emailErrorMsg, `OTP sent to ${newEmail}. Check your inbox.`, false);
                    if (otpGroup) otpGroup.style.display = "block";
                    if (emailOtpInput) emailOtpInput.value = "";
                    const saveBtn = overlay.querySelector("#settingsEditEmailSaveBtn");
                    if (saveBtn) saveBtn.disabled = false;
                    startOtpCooldown();
                } catch {
                    setStatus(emailErrorMsg, "An unexpected error occurred.");
                }
            });
        }

        // Verify the email change OTP sent by Supabase to the new email
        if (editEmailForm) {
            editEmailForm.addEventListener("submit", async (e) => {
                console.log("Email form submit event fired");
                e.preventDefault();
                const newEmail = newEmailInput ? newEmailInput.value.trim() : "";
                const otp = emailOtpInput ? emailOtpInput.value.trim() : "";

                console.log("Form values:", { newEmail, otp, otpLength: otp.length });

                if (!newEmail) { setStatus(emailErrorMsg, "Please enter a new email."); console.log("No email"); return; }
                if (!otp) { setStatus(emailErrorMsg, "Please enter the OTP sent to your new email."); console.log("No OTP"); return; }

                const saveBtn = overlay.querySelector("#settingsEditEmailSaveBtn");
                if (saveBtn) saveBtn.disabled = true;
                setStatus(emailErrorMsg, "Verifying OTP...", false);

                try {
                    console.log("Verifying:", { email: newEmail, otp: otp, otpLength: otp.length, type: "email_change" });
                    
                    const { error: verifyError } = await hiveSupabase.auth.verifyOtp({
                        email: newEmail,
                        token: otp,
                        type: "email_change",
                    });

                    if (verifyError) {
                        console.error("OTP verification error:", verifyError);
                        setStatus(emailErrorMsg, "Invalid or expired OTP. Please try again.");
                        if (saveBtn) saveBtn.disabled = false;
                        return;
                    }

                    setStatus(emailErrorMsg, "Email updated successfully!", false);
                    if (emailDisplay) emailDisplay.textContent = maskEmail(newEmail);
                    setTimeout(() => closeEmailModal(), 2000);
                } catch {
                    setStatus(emailErrorMsg, "An unexpected error occurred.");
                    if (saveBtn) saveBtn.disabled = false;
                }
            });
        }

        editPasswordBtn.addEventListener("click", openPasswordModal);
        editPasswordCancelBtn.addEventListener("click", closePasswordModal);

        // Change Password — verifies current password first, then uses Supabase Auth updateUser
        if (editPasswordForm) {
            editPasswordForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const currentPassword = currentPasswordInput ? currentPasswordInput.value : "";
                const newPassword = newPasswordInput ? newPasswordInput.value.trim() : "";
                const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : "";

                if (!currentPassword) { setStatus(passwordErrorMsg, "Please enter your current password."); return; }
                if (!newPassword) { setStatus(passwordErrorMsg, "Please enter a new password."); return; }
                if (newPassword.length < 6) { setStatus(passwordErrorMsg, "Password must be at least 6 characters."); return; }
                if (newPassword !== confirmPassword) { setStatus(passwordErrorMsg, "Passwords do not match."); return; }

                const saveBtn = overlay.querySelector("#settingsEditPasswordSaveBtn");
                if (saveBtn) saveBtn.disabled = true;
                setStatus(passwordErrorMsg, "Verifying...", false);

                try {
                    // Verify current password by re-authenticating
                    const { data: { user } } = await hiveSupabase.auth.getUser();
                    const { error: signInError } = await hiveSupabase.auth.signInWithPassword({
                        email: user?.email,
                        password: currentPassword,
                    });

                    if (signInError) {
                        setStatus(passwordErrorMsg, "Current password is incorrect.");
                        if (saveBtn) saveBtn.disabled = false;
                        return;
                    }

                    setStatus(passwordErrorMsg, "Saving...", false);
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