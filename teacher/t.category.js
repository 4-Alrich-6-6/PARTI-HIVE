const topBackBtn   = document.querySelector("#topBackBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const categoryList = document.querySelector(".category-list");

const supa     = () => window.hiveSupabase;
const getGrpId = () => new URLSearchParams(window.location.search).get("grpId") || sessionStorage.getItem("hive_grpId");

const formatDueDate = (iso) => {
    if (!iso) return "Due: --/--/----";
    const [y, m, d] = iso.split("-");
    return `Due: ${m}/${d}/${y}`;
};

// ── Get the progId for the current group ─────────────────────────────────
const getProgId = async () => {
    const grpId = getGrpId();
    if (!grpId) return null;
    const { data, error } = await supa()
        .from("GROUP")
        .select("progId")
        .eq("grpId", Number(grpId))
        .maybeSingle();
    if (error || !data) return null;
    return data.progId;
};

// ── Load projects from Supabase via progId ────────────────────────────────
const loadProjects = async () => {
    const progId = await getProgId();
    if (!progId) return [];
    const { data, error } = await supa()
        .from("PROJECT")
        .select("projId, projName")
        .eq("progId", progId);
    if (error || !data) return [];
    return data.map(p => ({ key: String(p.projId), name: p.projName, projId: p.projId }));
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
        sessionStorage.setItem("hive_selected_project", key);
        sessionStorage.setItem("hive_selected_project_name", name);
        window.location.href = "t.projectbreakdown.html";
    });
    return categoryItem;
};

const renderAllProjects = async () => {
    if (!categoryList) return;
    categoryList.innerHTML = "";
    const projects = await loadProjects();
    if (projects.length === 0) {
        categoryList.innerHTML = `
            <div class="empty-state">
                <img src="../assets/Plus.png" class="empty-state-icon" alt="No projects">
                <h3>No Projects Yet</h3>
                <p>There are no projects currently posted for this group.</p>
            </div>
        `;
        return;
    }
    projects.forEach(p => {
        categoryList.appendChild(createCategoryItem(p.name, p.key, p.count || 0, p.dueDate));
    });
};

if (topBackBtn)   topBackBtn.addEventListener("click",   () => { window.location.href = "t.dashb.html"; });
if (groupInfoTab) groupInfoTab.addEventListener("click", () => { window.location.href = "t.grpviewing.html"; });

const logoutBtn = document.querySelector(".logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        showConfirmation("Are you sure you want to log out?", () => {
            window.location.href = "../auth/log-sign.html";
        }, { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" });
    });
}

renderAllProjects();
