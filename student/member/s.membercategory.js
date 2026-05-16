const topBackBtn = document.querySelector("#topBackBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const categoryList = document.querySelector(".category-list");
const logoutBtn = document.querySelector(".logout");

const supa = () => window.hiveSupabase;
const getGrpId = () => new URLSearchParams(window.location.search).get("grpId") || sessionStorage.getItem("hive_grpId");

const formatDueDate = (iso) => {
    if (!iso) return "Due: --/--/----";
    const [y, m, d] = String(iso).split("-");
    return y && m && d ? `Due: ${m}/${d}/${y}` : "Due: --/--/----";
};

const renderMessage = (title, body) => {
    if (!categoryList) return;
    categoryList.innerHTML = `
        <div class="empty-state">
            <img src="../../assets/Plus.png" class="empty-state-icon" alt="No projects">
            <h3>${title}</h3>
            <p>${body}</p>
        </div>
    `;
};

const getGroup = async () => {
    const grpId = getGrpId();
    if (!grpId || !supa()) return null;

    const { data, error } = await supa()
        .from("GROUP")
        .select("grpId, progId")
        .eq("grpId", Number(grpId))
        .maybeSingle();

    if (error) {
        console.error("Failed to load group:", error);
        return null;
    }

    return data;
};

const getProjectIdColumn = async () => {
    const projIdCheck = await supa()
        .from("PROJECT")
        .select("projId")
        .limit(1);

    if (!projIdCheck.error) return "projId";

    const progIdCheck = await supa()
        .from("PROJECT")
        .select("progId")
        .limit(1);

    return progIdCheck.error ? null : "progId";
};

const getProjectIdsFromGroupTasks = async (grpId) => {
    const { data: taskLinks, error: linkError } = await supa()
        .from("GROUPMEMBER")
        .select("taskId")
        .eq("grpId", Number(grpId))
        .not("taskId", "is", null);

    if (linkError) {
        console.error("Failed to load task links:", linkError);
        return [];
    }

    const taskIds = Array.from(new Set((taskLinks || []).map((row) => row.taskId).filter(Boolean)));
    if (!taskIds.length) return [];

    const { data: tasks, error: taskError } = await supa()
        .from("TASK")
        .select("projId")
        .in("taskId", taskIds);

    if (taskError) {
        console.error("Failed to load task projects:", taskError);
        return [];
    }

    return Array.from(new Set((tasks || []).map((task) => task.projId).filter(Boolean)));
};

const loadProjectsFromDB = async () => {
    if (!categoryList) return;
    categoryList.innerHTML = "";

    if (!supa()) {
        renderMessage("Database Not Ready", "Please refresh the page and try again.");
        return;
    }

    const grpId = getGrpId();
    if (!grpId) {
        renderMessage("No Group Selected", "Go back to your dashboard and open a group first.");
        return;
    }

    const projectIdColumn = await getProjectIdColumn();
    if (!projectIdColumn) {
        renderMessage("Could Not Load Projects", "PROJECT table id column was not found.");
        return;
    }

    const group = await getGroup();
    const projectIds = new Set(await getProjectIdsFromGroupTasks(grpId));

    if (projectIdColumn === "progId" && group?.progId) {
        projectIds.add(group.progId);
    }

    if (!projectIds.size) {
        renderAllProjects([]);
        return;
    }

    const { data, error } = await supa()
        .from("PROJECT")
        .select(`${projectIdColumn}, projName, projDueD`)
        .in(projectIdColumn, Array.from(projectIds));

    if (error) {
        console.error("Failed to load projects:", error);
        renderMessage("Could Not Load Projects", error.message || "Please try again later.");
        return;
    }

    const projects = data || [];
    if (!projects.length) {
        renderAllProjects([]);
        return;
    }

    const projectsWithCounts = await Promise.all(
        projects.map(async (project) => {
            const projectId = project[projectIdColumn];
            const { count, error: countError } = await supa()
                .from("TASK")
                .select("taskId", { count: "exact", head: true })
                .eq("projId", projectId);

            if (countError) console.error("Failed to count tasks:", countError);
            return { ...project, projectId, taskCount: count || 0 };
        })
    );

    renderAllProjects(projectsWithCounts);
};

const createCategoryItem = (projId, projName, taskCount, dueDate) => {
    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";
    categoryItem.innerHTML = `
        <button class="category-main-btn" type="button" data-category="${projId}">
            <span class="category-name"></span>
            <span class="category-due-date">${formatDueDate(dueDate)}</span>
            <span class="category-count">${taskCount} Task${taskCount !== 1 ? "s" : ""}</span>
        </button>
    `;

    const btn = categoryItem.querySelector(".category-main-btn");
    const nameEl = categoryItem.querySelector(".category-name");
    if (nameEl) nameEl.textContent = projName || `Project ${projId}`;

    btn.addEventListener("click", () => {
        sessionStorage.setItem("hive_grpId", String(getGrpId()));
        sessionStorage.setItem("hive_selected_project", String(projId));
        sessionStorage.setItem("hive_selected_project_name", projName || `Project ${projId}`);
        window.location.href = `s.memberprojectbreakdown.html?grpId=${getGrpId()}`;
    });

    return categoryItem;
};

const renderAllProjects = (projects) => {
    if (!categoryList) return;
    categoryList.innerHTML = "";

    if (!projects || projects.length === 0) {
        renderMessage("No Projects Available", "There are no projects currently active for this group.");
        return;
    }

    projects.forEach((project) => {
        categoryList.appendChild(createCategoryItem(
            project.projectId,
            project.projName,
            project.taskCount || 0,
            project.projDueD
        ));
    });
};

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

window.addEventListener("load", loadProjectsFromDB);
