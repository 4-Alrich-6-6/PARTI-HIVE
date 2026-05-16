const supabase     = window.hiveSupabase;
const topBackBtn   = document.querySelector("#topBackBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const categoryList = document.querySelector(".category-list");
const logoutBtn    = document.querySelector(".logout");

const getGrpId = () => new URLSearchParams(window.location.search).get("grpId") || sessionStorage.getItem("hive_grpId");

const formatDueDate = (iso) => {
    if (!iso) return "Due: --/--/----";
    const [y, m, d] = iso.split("-");
    return `Due: ${m}/${d}/${y}`;
};

// ── Get the progId for the current group ─────────────────────────────────
const getProgId = async () => {
    const grpId = getGrpId();
    if (!grpId || !supabase) return null;
    const { data, error } = await supabase
        .from("GROUP")
        .select("progId")
        .eq("grpId", Number(grpId))
        .maybeSingle();
    if (error || !data) return null;
    return data.progId;
};

// ── Load projects from Supabase via progId with task counts ────────────────
const loadProjectsFromDB = async () => {
    const progId = await getProgId();
    if (!progId) { renderAllProjects([]); return; }
    const { data, error } = await supabase
        .from("PROJECT")
        .select("projId, projName, projDueD")
        .eq("progId", progId);
    if (error || !data) { renderAllProjects([]); return; }
    
    // Fetch task counts for each project
    const projectsWithCounts = await Promise.all(
        data.map(async (p) => {
            const { count } = await supabase
                .from("TASK")
                .select("taskId", { count: "exact", head: true })
                .eq("projId", p.projId);
            return { ...p, taskCount: count || 0 };
        })
    );
    renderAllProjects(projectsWithCounts);
};

// ── Render ────────────────────────────────────────────────────────────────
const createCategoryItem = (projId, projName, taskCount, dueDate) => {
    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";
    categoryItem.innerHTML = `
        <button class="category-main-btn" type="button" data-category="${projId}">
            <span class="category-name">${projName}</span>
            <span class="category-due-date">${formatDueDate(dueDate)}</span>
            <span class="category-count">${taskCount} Task${taskCount !== 1 ? "s" : ""}</span>
        </button>
    `;
    const btn = categoryItem.querySelector(".category-main-btn");
    btn.addEventListener("click", () => {
        sessionStorage.setItem("hive_selected_project", String(projId));
        sessionStorage.setItem("hive_selected_project_name", projName);
        window.location.href = "s.memberprojectbreakdown.html";
    });
    return categoryItem;
};

const renderAllProjects = (projects) => {
    if (!categoryList) return;
    categoryList.innerHTML = "";
    if (!projects || projects.length === 0) {
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
        categoryList.appendChild(createCategoryItem(p.projId, p.projName, p.taskCount || 0, p.projDueD || null));
    });
};

// ── Events ────────────────────────────────────────────────────────────────
if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        const grpId = getGrpId();
        window.location.href = grpId ? `s.membergrpviewing.html?grpId=${grpId}` : "../s.dashb.html";
    });
}
if (groupInfoTab) {
    groupInfoTab.addEventListener("click", () => {
        const grpId = getGrpId();
        window.location.href = grpId ? `s.membergrpviewing.html?grpId=${grpId}` : "s.membergrpviewing.html";
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        showConfirmation(
            "Are you sure you want to log out?",
            () => { window.location.href = "../../auth/log-sign.html"; },
            { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
        );
    });
}

// ── Init ──────────────────────────────────────────────────────────────────
loadProjectsFromDB();
