const topBackBtn = document.querySelector("#topBackBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const openPostCategoryModalBtn = document.querySelector("#openPostCategoryModalBtn");
const postCategoryModalOverlay = document.querySelector("#postCategoryModalOverlay");
const discardPostCategoryBtn = document.querySelector("#discardPostCategoryBtn");
const postCategoryForm = document.querySelector("#postCategoryForm");
const categoryNameInput = document.querySelector("#categoryNameInput");
const postCategorySubmitBtn = postCategoryForm ? postCategoryForm.querySelector("button[type='submit']") : null;
const categoryList = document.querySelector(".category-list");
const projectOptionsOverlay = document.querySelector("#projectOptionsModalOverlay");
const editProjectNameInput = document.querySelector("#editProjectNameInput");
const saveProjectNameBtn = document.querySelector("#saveProjectNameBtn");
const deleteProjectBtn = document.querySelector("#deleteProjectBtn");
const closeProjectOptionsBtn = document.querySelector("#closeProjectOptionsBtn");

let activeProjectItem = null;

const openProjectOptions = (categoryItem) => {
    activeProjectItem = categoryItem;
    const nameEl = categoryItem.querySelector(".category-name");
    if (editProjectNameInput && nameEl) {
        editProjectNameInput.value = nameEl.textContent;
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

    const nameEl = activeProjectItem.querySelector(".category-name");
    const oldKey = activeProjectItem.dataset.category;
    const newKey = newName.toLowerCase().replace(/\s+/g, "-");

    if (nameEl) nameEl.textContent = newName;
    activeProjectItem.dataset.category = newKey;

    const mainBtn = activeProjectItem.querySelector(".category-main-btn");
    if (mainBtn) mainBtn.dataset.category = newKey;

    const saved = loadProjects();
    if (saved) {
        const idx = saved.findIndex((p) => p.key === oldKey);
        if (idx !== -1) {
            saved[idx].name = newName;
            saved[idx].key = newKey;
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

const createCategoryItem = (name, key, count) => {
    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";
    categoryItem.setAttribute("role", "listitem");
    categoryItem.setAttribute("data-category", key);
    categoryItem.innerHTML = `
        <button class="category-main-btn" type="button" data-category="${key}">
            <span class="category-name">${name}</span>
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
        window.location.href = "s.dashb.html";
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
    postCategorySubmitBtn.disabled = !hasProjectName;
};

if (openPostCategoryModalBtn && postCategoryModalOverlay) {
    openPostCategoryModalBtn.addEventListener("click", () => {
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
        if (!categoryName) {
            return;
        }

        const categoryKey = categoryName.toLowerCase().replace(/\s+/g, "-");

        const saved = loadProjects();
        const projects = saved || [];
        projects.push({ name: categoryName, key: categoryKey, count: 0 });
        saveProjects(projects);

        const categoryItem = createCategoryItem(categoryName, categoryKey, 0);
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
            const item = createCategoryItem(project.name, project.key, project.count || 0);
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
