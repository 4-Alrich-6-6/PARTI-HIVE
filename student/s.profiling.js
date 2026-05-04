const PROFILE_KEY = "hive_user_profile";

const backButton = document.querySelector(".back-button");
const saveButton = document.querySelector(".save-button button");
const editProfilePicBtn = document.querySelector("#editProfilePicBtn");
const profilePicInput = document.querySelector("#profilePicInput");
const profilePicPreview = document.querySelector("#profilePicPreview");
const displayNameInput = document.querySelector("#displayNameInput");
const programSelect = document.querySelector("#program");

const loadProfile = () => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return {};
        }
    }
    return {};
};

const existing = loadProfile();
if (existing.displayName && displayNameInput) displayNameInput.value = existing.displayName;
if (existing.program && programSelect) programSelect.value = existing.program;
if (existing.avatar && profilePicPreview) profilePicPreview.src = existing.avatar;

if (editProfilePicBtn && profilePicInput) {
    editProfilePicBtn.addEventListener("click", () => {
        profilePicInput.click();
    });

    profilePicInput.addEventListener("change", () => {
        const file = profilePicInput.files && profilePicInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (profilePicPreview) profilePicPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

if (backButton) {
    backButton.addEventListener("click", () => {
        window.location.href = "../auth/profiling.html";
    });
}

if (saveButton) {
    saveButton.addEventListener("click", () => {
        const profile = {
            displayName: displayNameInput ? displayNameInput.value.trim() : "",
            program: programSelect ? programSelect.value : "",
            avatar: profilePicPreview && profilePicPreview.src && profilePicPreview.src.startsWith("data:")
                ? profilePicPreview.src
                : (existing.avatar || ""),
            role: "student"
        };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        window.location.href = "s.dashb.html";
    });
}
