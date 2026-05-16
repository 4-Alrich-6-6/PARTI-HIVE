const topBackBtn               = document.querySelector("#topBackBtn");
const groupInfoTab             = document.querySelector("#groupInfoTab");
const openPostCategoryModalBtn = document.querySelector("#openPostCategoryModalBtn");
const postCategoryModalOverlay = document.querySelector("#postCategoryModalOverlay");
const discardPostCategoryBtn   = document.querySelector("#discardPostCategoryBtn");
const postCategoryForm         = document.querySelector("#postCategoryForm");
const categoryNameInput        = document.querySelector("#categoryNameInput");
const categoryDueDateInput     = document.querySelector("#categoryDueDateInput");
const postCategorySubmitBtn    = postCategoryForm ? postCategoryForm.querySelector("button[type='submit']") : null;
const categoryList             = document.querySelector(".category-list");
const projectOptionsOverlay    = document.querySelector("#projectOptionsModalOverlay");
const editProjectNameInput     = document.querySelector("#editProjectNameInput");
const editProjectDueDateInput  = document.querySelector("#editProjectDueDateInput");
const saveProjectNameBtn       = document.querySelector("#saveProjectNameBtn");
const deleteProjectBtn         = document.querySelector("#deleteProjectBtn");
const closeProjectOptionsBtn   = document.querySelector("#closeProjectOptionsBtn");

const supa     = () => window.hiveSupabase;
const getGrpId = () => new URLSearchParams(window.location.search).get("grpId") || sessionStorage.getItem("hive_grpId");
const todayISO = () => new Date().toISOString().split("T")[0];

const formatDueDate = (iso) => {
    if (!iso) return "Due: --/--/----";
    const [y, m, d] = iso.split("-");
    return `Due: ${m}/${d}/${y}`;
};

let activeProjectItem = null;


// ── Load projects from Supabase ───────────────────────────────────────────
const loadProjects = async () => {
    const { data, error } = await supa()
        .from("PROJECT")
        .select("projId, projName, projDueD");
    if (error || !data) return [];
    
    // Fetch task count for each project
    const projectsWithCounts = await Promise.all(
        data.map(async (p) => {
            const { count } = await supa()
                .from("TASK")
                .select("taskId", { count: "exact", head: true })
                .eq("projId", p.projId);
            return {
                key: String(p.projId),
                name: p.projName,
                projId: p.projId,
                dueDate: p.projDueD || null,
                count: count || 0
            };
        })
    );
    return projectsWithCounts;
};

// ── Create category card ──────────────────────────────────────────────────
const createCategoryItem = (name, key, count, dueDate) => {
    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";
    categoryItem.setAttribute("role", "listitem");
    categoryItem.setAttribute("data-category", key);
    if (dueDate) categoryItem.setAttribute("data-due-date", dueDate);
    categoryItem.innerHTML = `
        <button class="category-main-btn" type="button" data-category="${key}">
            <span class="category-name">${name}</span>
            <span class="category-due-date">${formatDueDate(dueDate)}</span>
            <span class="category-count">${count} Task${count !== 1 ? "s" : ""}</span>
        </button>
        <button class="more-btn" type="button" aria-label="More category options">
            <img src="../../assets/More.png" alt="More options">
        </button>
    `;
    const btn = categoryItem.querySelector(".category-main-btn");
    if (btn) btn.addEventListener("click", () => {
        sessionStorage.setItem("hive_selected_project", key);
        sessionStorage.setItem("hive_selected_project_name", name);
        window.location.href = "s.leaderprojectbreakdown.html";
    });
    const moreBtn = categoryItem.querySelector(".more-btn");
    if (moreBtn) moreBtn.addEventListener("click", (e) => { e.stopPropagation(); openProjectOptions(categoryItem); });
    return categoryItem;
};

// ── Render all projects ───────────────────────────────────────────────────
const renderAllProjects = async () => {
    if (!categoryList) return;
    categoryList.innerHTML = "";
    const projects = await loadProjects();
    if (projects.length === 0) {
        categoryList.innerHTML = `
            <div class="empty-state">
                <img src="../../assets/Plus.png" class="empty-state-icon" alt="No projects">
                <h3>No Projects Yet</h3>
                <p>Click "Post Project" to create your first project and start breaking down tasks!</p>
            </div>
        `;
        return;
    }
    projects.forEach(p => {
        categoryList.appendChild(createCategoryItem(p.name, p.key, p.count, p.dueDate));
    });
};

// ── Project options modal ─────────────────────────────────────────────────
const openProjectOptions = (categoryItem) => {
    activeProjectItem = categoryItem;
    const nameEl = categoryItem.querySelector(".category-name");
    if (editProjectNameInput && nameEl) editProjectNameInput.value = nameEl.textContent;
    if (editProjectDueDateInput) {
        editProjectDueDateInput.min   = todayISO();
        editProjectDueDateInput.value = categoryItem.dataset.dueDate || "";
    }
    projectOptionsOverlay?.classList.add("open");
    projectOptionsOverlay?.setAttribute("aria-hidden", "false");
};

const closeProjectOptions = () => {
    projectOptionsOverlay?.classList.remove("open");
    projectOptionsOverlay?.setAttribute("aria-hidden", "true");
    activeProjectItem = null;
};

if (closeProjectOptionsBtn) closeProjectOptionsBtn.addEventListener("click", closeProjectOptions);
if (projectOptionsOverlay) projectOptionsOverlay.addEventListener("click", (e) => { if (e.target === projectOptionsOverlay) closeProjectOptions(); });

// ── Edit project ──────────────────────────────────────────────────────────
const saveProjectName = async () => {
    if (!activeProjectItem) return;
    const newName = editProjectNameInput ? editProjectNameInput.value.trim() : "";
    const newDue  = editProjectDueDateInput ? editProjectDueDateInput.value : "";
    if (!newName) return;
    const projId = Number(activeProjectItem.dataset.category);
    const { error } = await supa().from("PROJECT").update({ projName: newName, projDueD: newDue || null }).eq("projId", projId);
    if (error) { alert("Failed to update project: " + error.message); return; }
    await renderAllProjects();
    closeProjectOptions();
};

if (saveProjectNameBtn) saveProjectNameBtn.addEventListener("click", saveProjectName);

// ── Delete project ────────────────────────────────────────────────────────
if (deleteProjectBtn) {
    deleteProjectBtn.addEventListener("click", () => {
        if (!activeProjectItem) return;
        const projId = Number(activeProjectItem.dataset.category);
        const nameEl = activeProjectItem.querySelector(".category-name");
        const projectName = nameEl ? nameEl.textContent : "this project";
        showConfirmation(`Are you sure you want to remove the project "${projectName}"?`, async () => {
            const { error } = await supa().from("PROJECT").delete().eq("projId", projId);
            if (error) { alert("Failed to delete project: " + error.message); return; }
            await renderAllProjects();
            closeProjectOptions();
        }, { title: "Remove Project", confirmText: "Remove", cancelText: "Cancel" });
    });
}

// ── Post project ──────────────────────────────────────────────────────────
const closePostCategoryModal = () => {
    postCategoryModalOverlay?.classList.remove("open");
    postCategoryModalOverlay?.setAttribute("aria-hidden", "true");
};

const updatePostCategorySubmitState = () => {
    if (!postCategorySubmitBtn) return;
    const hasName = categoryNameInput && categoryNameInput.value.trim().length > 0;
    const hasDate = categoryDueDateInput && categoryDueDateInput.value.length > 0;
    postCategorySubmitBtn.disabled = !(hasName && hasDate);
};

if (openPostCategoryModalBtn && postCategoryModalOverlay) {
    openPostCategoryModalBtn.addEventListener("click", () => {
        if (categoryDueDateInput) categoryDueDateInput.min = todayISO();
        postCategoryModalOverlay.classList.add("open");
        postCategoryModalOverlay.setAttribute("aria-hidden", "false");
        updatePostCategorySubmitState();
    });
}

if (discardPostCategoryBtn) {
    discardPostCategoryBtn.addEventListener("click", () => {
        postCategoryForm?.reset();
        updatePostCategorySubmitState();
        closePostCategoryModal();
    });
}

if (categoryNameInput)    categoryNameInput.addEventListener("input", updatePostCategorySubmitState);
if (categoryDueDateInput) categoryDueDateInput.addEventListener("input", updatePostCategorySubmitState);
if (postCategoryModalOverlay) postCategoryModalOverlay.addEventListener("click", (e) => { if (e.target === postCategoryModalOverlay) closePostCategoryModal(); });

if (postCategoryForm) {
    postCategoryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = categoryNameInput.value.trim();
        const due  = categoryDueDateInput.value;
        if (!name || !due || due < todayISO()) return;
        showConfirmation(`Are you sure you want to post the project "${name}"?`, async () => {
            const { error } = await supa()
                .from("PROJECT")
                .insert({ projName: name, projDueD: due });
            if (error) { alert("Failed to create project: " + error.message); return; }
            await renderAllProjects();
            postCategoryForm.reset();
            updatePostCategorySubmitState();
            closePostCategoryModal();
        }, { title: "Post Project", confirmText: "Post", cancelText: "Cancel" });
    });
}

if (topBackBtn)    topBackBtn.addEventListener("click",    () => { window.location.href = "../s.dashb.html"; });
if (groupInfoTab)  groupInfoTab.addEventListener("click",  () => {
    const grpId = getGrpId();
    window.location.href = `s.leadergrpviewing.html${grpId ? "?grpId=" + grpId : ""}`;
});

const logoutBtn = document.querySelector(".logout");
if (logoutBtn) logoutBtn.addEventListener("click", () => {
    showConfirmation("Are you sure you want to log out?", () => { window.location.href = "../../auth/log-sign.html"; }, { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" });
});

// ── Init ──────────────────────────────────────────────────────────────────
renderAllProjects();