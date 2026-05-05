const topBackBtn = document.querySelector("#topBackBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const categoryList = document.querySelector(".category-list");

const STORAGE_KEY_PROJECTS = "hive_leader_projects";

const formatDueDate = (iso) => {
    if (!iso) return "Due: --/--/----";
    const [y, m, d] = iso.split("-");
    return `Due: ${m}/${d}/${y}`;
};

const loadProjects = () => {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
    return saved ? JSON.parse(saved) : null;
};

const navigateToTeacherBreakdown = (projectKey, projectName) => {
    if (projectKey) {
        localStorage.setItem("hive_selected_project", projectKey);
    }
    if (projectName) {
        localStorage.setItem("hive_selected_project_name", projectName);
    }
    window.location.href = "t.projectbreakdown.html";
};

const attachCategoryBarClick = (categoryMainButton) => {
    categoryMainButton.addEventListener("click", () => {
        const projectKey = categoryMainButton.dataset.category;
        const projectName = categoryMainButton.querySelector(".category-name")?.textContent || projectKey;
        navigateToTeacherBreakdown(projectKey, projectName);
    });
};

const createCategoryItem = (name, key, count, dueDate) => {
    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";
    categoryItem.setAttribute("role", "listitem");
    categoryItem.setAttribute("data-category", key);
    categoryItem.innerHTML = `
        <button class="category-main-btn" type="button" data-category="${key}">
            <span class="category-name">${name}</span>
            <span class="category-due-date">${formatDueDate(dueDate)}</span>
            <span class="category-count">${count} Task${count !== 1 ? "s" : ""}</span>
        </button>
    `;
    const btn = categoryItem.querySelector(".category-main-btn");
    if (btn) attachCategoryBarClick(btn);
    return categoryItem;
};

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "t.dashb.html";
    });
}

if (groupInfoTab) {
    groupInfoTab.addEventListener("click", () => {
        window.location.href = "t.grpviewing.html";
    });
}

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

const logoutBtn = document.querySelector(".logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        showConfirmation(
            "Are you sure you want to log out?",
            () => {
                window.location.href = "../auth/log-sign.html";
            },
            { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
        );
    });
}