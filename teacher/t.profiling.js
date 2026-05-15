const backButton = document.querySelector(".back-button");
const saveButton = document.querySelector(".save-button button");
const editProfilePicBtn = document.querySelector("#editProfilePicBtn");
const profilePicInput = document.querySelector("#profilePicInput");
const profilePicPreview = document.querySelector("#profilePicPreview");
const displayNameInput = document.querySelector("#displayNameInput");
const programSelect = document.querySelector("#program");

let avatarFile = null;

// Populate department dropdown from DB
(async () => {
    if (!programSelect) return;
    const supabase = window.hiveSupabase;
    if (!supabase) return;
    const { data, error } = await supabase
        .from("DEPARTMENT")
        .select("deptId, deptName")
        .order("deptId", { ascending: true });
    if (error || !data) return;
    data.forEach(dept => {
        const opt = document.createElement("option");
        opt.value = dept.deptId;
        opt.textContent = dept.deptName;
        programSelect.appendChild(opt);
    });
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
        const deptId = programSelect && programSelect.value ? Number(programSelect.value) : null;

        if (!displayName) { alert("Please enter a display name."); return; }
        if (!deptId) { alert("Please select a department."); return; }

        const posId = localStorage.getItem("hive_posId")
            ? Number(localStorage.getItem("hive_posId"))
            : null;

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
            }
        }

        const payload = {
            userId: user.id,
            userEmail: user.email,
            userDisplayName: displayName,
            posId,
            deptId,
        };
        if (avatarPath) payload.avatarPath = avatarPath;

        const { error } = await supabase
            .from("USER")
            .upsert(payload, { onConflict: "userId" });

        if (error) { alert("Failed to save profile: " + error.message); return; }

        localStorage.removeItem("hive_posId");
        localStorage.removeItem("hive_role");
        window.location.href = "t.dashb.html";
    });
}