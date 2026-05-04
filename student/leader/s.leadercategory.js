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
    if (editProjectNameInput && nameEl) {
        editProjectNameInput.value = nameEl.textContent;
    }
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

if (closeProjectOptionsBtn) {
    closeProjectOptionsBtn.addEventListener("click", closeProjectOptions);
}

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

    const nameEl = activeProjectItem.querySelector(".category-name");
    const dueEl = activeProjectItem.querySelector(".category-due-date");
    const oldKey = activeProjectItem.dataset.category;
    const newKey = newName.toLowerCase().replace(/\s+/g, "-");

    if (nameEl) nameEl.textContent = newName;
    if (dueEl) dueEl.textContent = formatDueDate(newDueDate);
    activeProjectItem.dataset.category = newKey;
    activeProjectItem.dataset.dueDate = newDueDate;

    const mainBtn = activeProjectItem.querySelector(".category-main-btn");
    if (mainBtn) mainBtn.dataset.category = newKey;

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

    closeProjectOptions();
};

if (saveProjectNameBtn) {
    saveProjectNameBtn.addEventListener("click", saveProjectName);
}

if (deleteProjectBtn) {
    deleteProjectBtn.addEventListener("click", () => {
        if (!activeProjectItem) return;

        const key = activeProjectItem.dataset.category;
        activeProjectItem.remove();

        const saved = loadProjects();
        if (saved) {
            saveProjects(saved.filter((p) => p.key !== key));
        }

        closeProjectOptions();
    });
}

const STORAGE_KEY_PROJECTS = "hive_leader_projects";

const loadProjects = () => {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
    return saved ? JSON.parse(saved) : null;
};

const saveProjects = (projects) => {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
};

const navigateToLeaderBreakdown = (projectKey) => {
    if (projectKey) {
        localStorage.setItem("hive_selected_project", projectKey);
    }
    window.location.href = "s.leaderprojectbreakdown.html";
};

const attachCategoryBarClick = (categoryMainButton) => {
    categoryMainButton.addEventListener("click", () => {
        navigateToLeaderBreakdown(categoryMainButton.dataset.category);
    });
};

const attachMoreBtnClick = (moreBtn, categoryItem) => {
    moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openProjectOptions(categoryItem);
    });
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
            <img src="assets/More.png" alt="More options">
        </button>
    `;
    const btn = categoryItem.querySelector(".category-main-btn");
    if (btn) attachCategoryBarClick(btn);
    const moreBtn = categoryItem.querySelector(".more-btn");
    if (moreBtn) attachMoreBtnClick(moreBtn, categoryItem);
    return categoryItem;
};

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "../s.dashb.html";
    });
}

if (groupInfoTab) {
    groupInfoTab.addEventListener("click", () => {
        window.location.href = "s.leadergrpviewing.html";
    });
}

const closePostCategoryModal = () => {
    if (!postCategoryModalOverlay) {
        return;
    }

    postCategoryModalOverlay.classList.remove("open");
    postCategoryModalOverlay.setAttribute("aria-hidden", "true");
};

const updatePostCategorySubmitState = () => {
    if (!postCategorySubmitBtn) {
        return;
    }

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
        if (postCategoryForm) {
            postCategoryForm.reset();
        }
        updatePostCategorySubmitState();
        closePostCategoryModal();
    });
}

if (categoryNameInput) {
    categoryNameInput.addEventListener("input", updatePostCategorySubmitState);
}

if (categoryDueDateInput) {
    categoryDueDateInput.addEventListener("input", updatePostCategorySubmitState);
}

if (postCategoryModalOverlay) {
    postCategoryModalOverlay.addEventListener("click", (event) => {
        if (event.target === postCategoryModalOverlay) {
            closePostCategoryModal();
        }
    });
}

if (postCategoryForm && categoryNameInput && categoryList) {
    postCategoryForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const categoryName = categoryNameInput.value.trim();
        const dueDate = categoryDueDateInput ? categoryDueDateInput.value : "";
        if (!categoryName || !dueDate) {
            return;
        }
        if (dueDate < todayISO()) {
            return;
        }

        const categoryKey = categoryName.toLowerCase().replace(/\s+/g, "-");

        const saved = loadProjects();
        const projects = saved || [];
        projects.push({ name: categoryName, key: categoryKey, count: 0, dueDate });
        saveProjects(projects);

        const categoryItem = createCategoryItem(categoryName, categoryKey, 0, dueDate);
        categoryList.appendChild(categoryItem);

        postCategoryForm.reset();
        updatePostCategorySubmitState();
        closePostCategoryModal();
    });
}

updatePostCategorySubmitState();

const savedProjects = loadProjects();
if (savedProjects && categoryList) {
    const staticKeys = Array.from(categoryList.querySelectorAll(".category-item")).map(
        (el) => el.dataset.category
    );
    savedProjects.forEach((project) => {
        if (!staticKeys.includes(project.key)) {
            const item = createCategoryItem(project.name, project.key, project.count || 0, project.dueDate);
            categoryList.appendChild(item);
        }
    });
}

const categoryMainButtons = Array.from(document.querySelectorAll(".category-main-btn"));
categoryMainButtons.forEach((categoryMainButton) => {
    attachCategoryBarClick(categoryMainButton);
});

const staticMoreBtns = Array.from(categoryList ? categoryList.querySelectorAll(".category-item") : []);
staticMoreBtns.forEach((item) => {
    const moreBtn = item.querySelector(".more-btn");
    if (moreBtn) attachMoreBtnClick(moreBtn, item);
});
