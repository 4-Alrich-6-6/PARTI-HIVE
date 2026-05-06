const topBackBtn = document.querySelector("#topBackBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const categoryList = document.querySelector(".category-list");

const STORAGE_KEY_PROJECTS = "hive_leader_projects"; // Shared with leader for prototype consistency

const loadProjects = () => {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
    return saved ? JSON.parse(saved) : [];
};

const formatDueDate = (iso) => {
    if (!iso) return "Due: --/--/----";
    const [y, m, d] = iso.split("-");
    return `Due: ${m}/${d}/${y}`;
};

const createCategoryItem = (name, key, count, dueDate) => {
    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";
    categoryItem.innerHTML = `
        <button class="category-main-btn" type="button" data-category="${key}">
            <span class="category-name">${name}</span>
            <span class="category-due-date">${formatDueDate(dueDate)}</span>
            <span class="category-count">${count} Task${count !== 1 ? "s" : ""}</span>
        </button>
    `;
    const btn = categoryItem.querySelector(".category-main-btn");
    btn.addEventListener("click", () => {
        localStorage.setItem("hive_selected_project", key);
        localStorage.setItem("hive_selected_project_name", name);
        window.location.href = "s.memberprojectbreakdown.html";
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
                <h3>No Projects Available</h3>
                <p>There are no projects currently active for this group.</p>
            </div>
        `;
        return;
    }
    projects.forEach(p => {
        categoryList.appendChild(createCategoryItem(p.name, p.key, p.count || 0, p.dueDate));
    });
};

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => { window.location.href = "../s.dashb.html"; });
}

if (groupInfoTab) {
    groupInfoTab.addEventListener("click", () => { window.location.href = "s.membergrpviewing.html"; });
}

const logoutBtn = document.querySelector(".logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        showConfirmation("Are you sure you want to log out?", () => {
            window.location.href = "../../auth/log-sign.html";
        }, { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" });
    });
}

renderAllProjects();
