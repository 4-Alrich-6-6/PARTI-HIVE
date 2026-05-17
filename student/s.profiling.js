const backButton = document.querySelector(".back-button");
const saveButton = document.querySelector(".save-button button");
const editProfilePicBtn = document.querySelector("#editProfilePicBtn");
const profilePicInput = document.querySelector("#profilePicInput");
const profilePicPreview = document.querySelector("#profilePicPreview");
const displayNameInput = document.querySelector("#displayNameInput");
const programSelect = document.querySelector("#program");

let avatarFile = null;

const getPositionId = async (supabase, roleName) => {
    const { data, error } = await supabase
        .from("POSITION")
        .select("posId")
        .ilike("posName", roleName)
        .maybeSingle();

    if (error) {
        console.error("Failed to load position:", error);
        return null;
    }

    return data?.posId || null;
};

// ── Load existing profile data from DB ──────────────────────────────────────
const loadProfileData = async () => {
    const supabase = window.hiveSupabase;
    if (!supabase) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData, error } = await supabase
            .from("USER")
            .select("userDisplayName, progId, avatarPath")
            .eq("userId", user.id)
            .maybeSingle();

        if (error) {
            console.error("Error loading profile:", error);
            return;
        }

        if (userData) {
            // Set display name
            if (userData.userDisplayName && displayNameInput) {
                displayNameInput.value = userData.userDisplayName;
            }

            // Set program
            if (userData.progId && programSelect) {
                programSelect.value = userData.progId;
            }

            // Set avatar preview
            if (userData.avatarPath && profilePicPreview) {
                profilePicPreview.src = userData.avatarPath;
            }
        }
    } catch (err) {
        console.error("Failed to load profile data:", err);
    }
};

// Populate program dropdown from DB
(async () => {
    if (!programSelect) return;
    const supabase = window.hiveSupabase;
    if (!supabase) return;
    const { data, error } = await supabase
        .from("PROGRAM")
        .select("progId, progName")
        .order("progId", { ascending: true });
    if (error || !data) return;
    data.forEach(prog => {
        const opt = document.createElement("option");
        opt.value = prog.progId;
        opt.textContent = prog.progName;
        programSelect.appendChild(opt);
    });
    
    // Load profile data after programs are loaded
    await loadProfileData();
})();

if (editProfilePicBtn && profilePicInput) {
    editProfilePicBtn.addEventListener("click", () => profilePicInput.click());
    profilePicInput.addEventListener("change", () => {
        const file = profilePicInput.files && profilePicInput.files[0];
        if (!file) return;
        avatarFile = file;
        const reader = new FileReader();
        reader.onload = (e) => { if (profilePicPreview) profilePicPreview.src = e.target.result; };
        reader.readAsDataURL(file);
    });
}

if (backButton) {
    backButton.addEventListener("click", () => {
        window.location.href = "../auth/profiling.html";
    });
}

if (saveButton) {
    saveButton.addEventListener("click", async () => {
        const supabase = window.hiveSupabase;
        if (!supabase) { alert("Supabase not ready."); return; }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { alert("Not logged in."); return; }

        const displayName = displayNameInput ? displayNameInput.value.trim() : "";
        const progId = programSelect && programSelect.value ? Number(programSelect.value) : null;

        if (!displayName) { alert("Please enter a display name."); return; }
        if (!progId) { alert("Please select a program."); return; }

        let posId = localStorage.getItem("hive_posId")
            ? Number(localStorage.getItem("hive_posId"))
            : null;

        if (!posId) posId = await getPositionId(supabase, "student");

        // Upload avatar if selected
        let avatarPath = null;
        if (avatarFile) {
            const filePath = `avatars/${user.id}`;
            const { error: uploadErr } = await supabase.storage
                .from("profilePicture")
                .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type });
            if (!uploadErr) {
                const { data: urlData } = supabase.storage
                    .from("profilePicture")
                    .getPublicUrl(filePath);
                avatarPath = urlData?.publicUrl || null;
                console.log("Avatar uploaded successfully:", avatarPath);
            } else {
                console.error("Avatar upload error:", uploadErr);
            }
        } else {
            // Load existing avatar path if not changing picture
            const { data: existingUser, error: fetchErr } = await supabase
                .from("USER")
                .select("avatarPath")
                .eq("userId", user.id)
                .maybeSingle();
            
            if (!fetchErr && existingUser) {
                avatarPath = existingUser.avatarPath;
                console.log("Using existing avatar:", avatarPath);
            }
        }

        const payload = {
            userId: user.id,
            userEmail: user.email,
            userDisplayName: displayName,
            posId,
            progId,
        };
        if (avatarPath) payload.avatarPath = avatarPath;

        console.log("Saving user profile with payload:", payload);

        const { error } = await supabase
            .from("USER")
            .upsert(payload, { onConflict: "userId" });

        if (error) { 
            console.error("Database save error:", error);
            alert("Failed to save profile: " + error.message); 
            return; 
        }

        console.log("Profile saved successfully to database");
        alert("Profile saved successfully!");

        localStorage.removeItem("hive_posId");
        localStorage.removeItem("hive_role");
        window.location.href = "s.dashb.html";
    });
}
