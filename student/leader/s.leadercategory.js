const topBackBtn = document.querySelector("#topBackBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const openPostCategoryModalBtn = document.querySelector("#openPostCategoryModalBtn");
const postCategoryModalOverlay = document.querySelector("#postCategoryModalOverlay");
const discardPostCategoryBtn = document.querySelector("#discardPostCategoryBtn");
const postCategoryForm = document.querySelector("#postCategoryForm");
const categoryNameInput = document.querySelector("#categoryNameInput");
const categoryDueDateInput = document.querySelector("#categoryDueDateInput");
const postCategorySubmitBtn = postCategoryForm ? postCategoryForm.querySelector("button[type='submit']") : null;
const categoryList = document.querySelector(".category-list");
const projectOptionsOverlay = document.querySelector("#projectOptionsModalOverlay");
const editProjectNameInput = document.querySelector("#editProjectNameInput");
const editProjectDueDateInput = document.querySelector("#editProjectDueDateInput");
const saveProjectNameBtn = document.querySelector("#saveProjectNameBtn");
const deleteProjectBtn = document.querySelector("#deleteProjectBtn");
const closeProjectOptionsBtn = document.querySelector("#closeProjectOptionsBtn");

const todayISO = () => new Date().toISOString().split("T")[0];

const formatDueDate = (iso) => {
    if (!iso) return "Due: --/--/----";
    const [y, m, d] = iso.split("-");
    return `Due: ${m}/${d}/${y}`;
};

let activeProjectItem = null;

const openProjectOptions = (categoryItem) => {
    activeProjectItem = categoryItem;
    const nameEl = categoryItem.querySelector(".category-name");
    if (editProjectNameInput && nameEl) editProjectNameInput.value = nameEl.textContent;
    if (editProjectDueDateInput) {
        editProjectDueDateInput.min = todayISO();
        editProjectDueDateInput.value = categoryItem.dataset.dueDate || "";
    }
    if (projectOptionsOverlay) {
        projectOptionsOverlay.classList.add("open");
        projectOptionsOverlay.setAttribute("aria-hidden", "false");
    }
};

const closeProjectOptions = () => {
    if (projectOptionsOverlay) {
        projectOptionsOverlay.classList.remove("open");
        projectOptionsOverlay.setAttribute("aria-hidden", "true");
    }
    activeProjectItem = null;
};

if (closeProjectOptionsBtn) closeProjectOptionsBtn.addEventListener("click", closeProjectOptions);

if (projectOptionsOverlay) {
    projectOptionsOverlay.addEventListener("click", (e) => {
        if (e.target === projectOptionsOverlay) closeProjectOptions();
    });
}

const saveProjectName = () => {
    if (!activeProjectItem) return;
    const newName = editProjectNameInput ? editProjectNameInput.value.trim() : "";
    if (!newName) return;
    const newDueDate = editProjectDueDateInput ? editProjectDueDateInput.value : "";
    if (newDueDate && newDueDate < todayISO()) return;
    const oldKey = activeProjectItem.dataset.category;
    const newKey = newName.toLowerCase().replace(/\s+/g, "-");
    const saved = loadProjects();
    if (saved) {
        const idx = saved.findIndex((p) => p.key === oldKey);
        if (idx !== -1) {
            saved[idx].name = newName;
            saved[idx].key = newKey;
            saved[idx].dueDate = newDueDate;
            saveProjects(saved);
        }
    }
    renderAllProjects();
    closeProjectOptions();
};

if (saveProjectNameBtn) saveProjectNameBtn.addEventListener("click", saveProjectName);

if (deleteProjectBtn) {
    deleteProjectBtn.addEventListener("click", () => {
        if (!activeProjectItem) return;
        const key = activeProjectItem.dataset.category;
        const nameEl = activeProjectItem.querySelector(".category-name");
        const projectName = nameEl ? nameEl.textContent : "this project";
        showConfirmation(`Are you sure you want to remove the project "${projectName}"?`, () => {
            const saved = loadProjects();
            if (saved) saveProjects(saved.filter((p) => p.key !== key));
            renderAllProjects();
            closeProjectOptions();
        }, { title: "Remove Project", confirmText: "Remove", cancelText: "Cancel" });
    });
}

const STORAGE_KEY_PROJECTS = "hive_leader_projects";

const loadProjects = () => {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
    return saved ? JSON.parse(saved) : [];
};

const saveProjects = (projects) => {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
};

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
        localStorage.setItem("hive_selected_project", key);
        localStorage.setItem("hive_selected_project_name", name);
        window.location.href = "s.leaderprojectbreakdown.html";
    });
    const moreBtn = categoryItem.querySelector(".more-btn");
    if (moreBtn) moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openProjectOptions(categoryItem);
    });
    return categoryItem;
};

const renderAllProjects = () => {
    if (!categoryList) return;
    categoryList.innerHTML = "";
    const projects = loadProjects();
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
        categoryList.appendChild(createCategoryItem(p.name, p.key, p.count || 0, p.dueDate));
    });
};

if (topBackBtn) topBackBtn.addEventListener("click", () => { window.location.href = "../s.dashb.html"; });
if (groupInfoTab) groupInfoTab.addEventListener("click", () => { window.location.href = "s.leadergrpviewing.html"; });

const closePostCategoryModal = () => {
    if (!postCategoryModalOverlay) return;
    postCategoryModalOverlay.classList.remove("open");
    postCategoryModalOverlay.setAttribute("aria-hidden", "true");
};

const updatePostCategorySubmitState = () => {
    if (!postCategorySubmitBtn) return;
    const hasProjectName = categoryNameInput && categoryNameInput.value.trim().length > 0;
    const hasDueDate = categoryDueDateInput && categoryDueDateInput.value.length > 0;
    postCategorySubmitBtn.disabled = !(hasProjectName && hasDueDate);
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
        if (postCategoryForm) postCategoryForm.reset();
        updatePostCategorySubmitState();
        closePostCategoryModal();
    });
}

if (categoryNameInput) categoryNameInput.addEventListener("input", updatePostCategorySubmitState);
if (categoryDueDateInput) categoryDueDateInput.addEventListener("input", updatePostCategorySubmitState);

if (postCategoryModalOverlay) {
    postCategoryModalOverlay.addEventListener("click", (e) => {
        if (e.target === postCategoryModalOverlay) closePostCategoryModal();
    });
}

if (postCategoryForm) {
    postCategoryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = categoryNameInput.value.trim();
        const due = categoryDueDateInput.value;
        if (!name || !due || due < todayISO()) return;
        showConfirmation(`Are you sure you want to post the project "${name}"?`, () => {
            const projects = loadProjects();
            projects.push({ name, key: name.toLowerCase().replace(/\s+/g, "-"), count: 0, dueDate: due });
            saveProjects(projects);
            renderAllProjects();
            postCategoryForm.reset();
            updatePostCategorySubmitState();
            closePostCategoryModal();
        }, { title: "Post Project", confirmText: "Post", cancelText: "Cancel" });
    });
}

const logoutBtn = document.querySelector(".logout");
if (logoutBtn) logoutBtn.addEventListener("click", () => {
    showConfirmation("Are you sure you want to log out?", () => { window.location.href = "../../auth/log-sign.html"; }, { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" });
});

renderAllProjects();
