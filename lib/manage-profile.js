(function () {
    const PROFILE_KEY = "hive_user_profile";

    const scriptEl = document.currentScript
        || document.querySelector('script[src*="manage-profile.js"]');
    const scriptSrc = scriptEl ? scriptEl.src : "";
    const libBaseUrl = scriptSrc.replace(/manage-profile\.js(\?.*)?$/, "");
    const assetsBaseUrl = libBaseUrl.replace(/\/lib\/$/, "/assets/");

    const ensureStylesheet = () => {
        if (document.querySelector('link[data-manage-profile="true"]')) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = libBaseUrl + "manage-profile.css";
        link.setAttribute("data-manage-profile", "true");
        document.head.appendChild(link);
    };
    ensureStylesheet();

    const STUDENT_PROGRAMS = [
        "Computer Science",
        "Information Technology",
        "EMC - Game Development",
        "EMC - Digital Animation Technology"
    ];

    const TEACHER_DEPARTMENTS = [
        "College of Computer Studies",
        "College of Education, Arts, and Sciences",
        "College of Hospitality and Tourism Management",
        "College of Business Administration",
        "College of Allied Health Sciences",
        "Personal/Private"
    ];

    const detectRole = () => {
        const path = (location.pathname.split("/").pop() || "").toLowerCase();
        return path.startsWith("t.") ? "teacher" : "student";
    };

    const role = detectRole();
    const isTeacher = role === "teacher";
    const fieldLabel = isTeacher ? "Department" : "Program";
    const options = isTeacher ? TEACHER_DEPARTMENTS : STUDENT_PROGRAMS;

    const loadProfile = () => {
        const saved = localStorage.getItem(PROFILE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                // fall through
            }
        }
        return { displayName: "", program: "", avatar: "", role };
    };

    const saveProfile = (data) => {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
    };

    const buildModal = () => {
        const overlay = document.createElement("div");
        overlay.className = "mp-overlay";
        overlay.id = "mpOverlay";
        overlay.setAttribute("aria-hidden", "true");

        const optionsHtml = options
            .map((opt) => `<option value="${opt}">${opt}</option>`)
            .join("");

        overlay.innerHTML = `
            <div class="mp-modal" role="dialog" aria-modal="true" aria-labelledby="mpTitle">
                <div class="mp-header">
                    <h2 id="mpTitle">Manage Profile</h2>
                </div>
                <div class="mp-body">
                    <div class="mp-avatar-wrap">
                        <div class="mp-avatar">
                            <img id="mpAvatarImg" src="assets/profile.png" alt="Profile picture">
                        </div>
                        <button type="button" class="mp-avatar-edit" id="mpAvatarEdit" aria-label="Change profile picture">
                            <img src="${assetsBaseUrl}Edit.png" alt="Edit">
                        </button>
                        <input type="file" id="mpAvatarInput" accept="image/*" hidden>
                    </div>
                    <div class="mp-field">
                        <label for="mpDisplayName">Display Name</label>
                        <input type="text" id="mpDisplayName" placeholder="Enter your Display Name">
                    </div>
                    <div class="mp-field">
                        <label for="mpProgram">${fieldLabel}</label>
                        <select id="mpProgram">
                            <option value="">Select ${fieldLabel}</option>
                            ${optionsHtml}
                        </select>
                    </div>
                </div>
                <div class="mp-actions">
                    <button type="button" class="mp-btn mp-btn-cancel" id="mpCancelBtn">Cancel</button>
                    <button type="button" class="mp-btn mp-btn-save" id="mpSaveBtn">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        return overlay;
    };

    const applyToSidebar = (profile) => {
        const profileBlock = document.querySelector(".profile-block");
        if (!profileBlock) return;

        const headings = profileBlock.querySelectorAll("h3");
        if (headings[0] && profile.displayName) {
            headings[0].textContent = profile.displayName;
        }
        if (headings[1] && profile.program) {
            headings[1].textContent = profile.program;
        }

        const avatarImg = profileBlock.querySelector(".avatar-circle img");
        if (avatarImg && profile.avatar) {
            avatarImg.src = profile.avatar;
        }
    };

    const init = () => {
        const profileLinks = document.querySelectorAll(".profile-link");
        if (!profileLinks.length) return;

        const overlay = buildModal();
        const modal = overlay.querySelector(".mp-modal");
        const avatarImg = overlay.querySelector("#mpAvatarImg");
        const avatarEditBtn = overlay.querySelector("#mpAvatarEdit");
        const avatarInput = overlay.querySelector("#mpAvatarInput");
        const displayNameInput = overlay.querySelector("#mpDisplayName");
        const programSelect = overlay.querySelector("#mpProgram");
        const cancelBtn = overlay.querySelector("#mpCancelBtn");
        const saveBtn = overlay.querySelector("#mpSaveBtn");

        let currentProfile = loadProfile();
        applyToSidebar(currentProfile);

        const openModal = (event) => {
            if (event) event.preventDefault();
            currentProfile = loadProfile();
            displayNameInput.value = currentProfile.displayName || "";
            programSelect.value = currentProfile.program || "";
            avatarImg.src = currentProfile.avatar || (assetsBaseUrl + "profile.png");
            overlay.classList.add("open");
            overlay.setAttribute("aria-hidden", "false");
        };

        const closeModal = () => {
            overlay.classList.remove("open");
            overlay.setAttribute("aria-hidden", "true");
        };

        profileLinks.forEach((link) => {
            link.addEventListener("click", openModal);
        });

        cancelBtn.addEventListener("click", closeModal);

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeModal();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && overlay.classList.contains("open")) {
                closeModal();
            }
        });

        avatarEditBtn.addEventListener("click", () => {
            avatarInput.click();
        });

        avatarInput.addEventListener("change", () => {
            const file = avatarInput.files && avatarInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarImg.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

        saveBtn.addEventListener("click", () => {
            const updated = {
                displayName: displayNameInput.value.trim(),
                program: programSelect.value,
                avatar: avatarImg.src && avatarImg.src.startsWith("data:") ? avatarImg.src : (currentProfile.avatar || ""),
                role
            };
            saveProfile(updated);
            applyToSidebar(updated);
            closeModal();
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
