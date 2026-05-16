const topBackBtn = document.querySelector("#topBackBtn");
const backToCategoriesBtn = document.querySelector("#backToCategoriesBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const taskDetailsOverlay = document.querySelector("#taskDetailsOverlay");
const closeTaskDetailsBtn = document.querySelector("#closeTaskDetailsBtn");
const detailTaskName = document.querySelector("#detailTaskName");
const detailTaskDescription = document.querySelector("#detailTaskDescription");
const detailTaskAssignees = document.querySelector("#detailTaskAssignees");
const detailTaskDueDate = document.querySelector("#detailTaskDueDate");
const detailTaskDueTime = document.querySelector("#detailTaskDueTime");
const detailTaskIntensity = document.querySelector("#detailTaskIntensity");
const detailTaskPriority = document.querySelector("#detailTaskPriority");
const detailTaskTimeActive = document.querySelector("#detailTaskTimeActive");
const detailTaskStatus = document.querySelector("#detailTaskStatus");

const STATUS_TEXT = {
    inactive: "Not Active",
    active: "Active",
    verifying: "Verifying",
    finished: "Finished",
    missing: "Missing"
};

const isTerminal = (status) => status === "finished" || status === "missing";

const isPastDue = (task) => {
    if (!task.dueDate || !task.dueTime) return false;
    const due = new Date(`${task.dueDate}T${task.dueTime}`);
    return Date.now() > due.getTime();
};

const STORAGE_KEY_TASKS = "hive_leader_tasks";

const supa = () => window.hiveSupabase;
const getProjId = () => sessionStorage.getItem("hive_selected_project");
const getGrpId = () => sessionStorage.getItem("hive_grpId");

const STAT_SLUG = { 1: "inactive", 2: "active", 3: "pause", 4: "verifying", 5: "finished", 6: "missing" };

const loadTasks = async () => {
    const projId = getProjId();
    console.log("[loadTasks] projId=", projId);
    if (!projId) {
        console.error("[loadTasks] No projId found");
        return [];
    }
    const { data, error } = await supa()
        .from("TASK")
        .select("taskId, taskName, taskDesc, taskDueD, taskIntensity, taskPrio, taskResource, taskAcmD, statId, GROUPMEMBER(grpmemId, userId, USER(userDisplayName))")
        .eq("projId", Number(projId));
    console.log("[loadTasks] data=", data, "error=", error);
    if (error || !data) return [];
    return data.map(t => ({
        taskId: t.taskId,
        name: t.taskName,
        description: t.taskDesc || "",
        dueDate: t.taskDueD ? t.taskDueD.split("T")[0] : "",
        dueTime: t.taskDueD ? t.taskDueD.split("T")[1]?.slice(0,5) : "",
        intensity: t.taskIntensity || "Light",
        priority: t.taskPrio || "Low",
        resources: t.taskResource || "",
        acmD: t.taskAcmD || null,
        status: STAT_SLUG[t.statId] || "inactive",
        statId: t.statId || 1,
        assignees: Object.values(
            (t.GROUPMEMBER || []).reduce((seen, m) => {
                if (!seen[m.userId]) seen[m.userId] = { grpmemId: m.grpmemId, userId: m.userId, name: m.USER?.userDisplayName || "Member" };
                return seen;
            }, {})
        ).map(a => a.name)
    }));
};

const formatTime12h = (timeStr) => {
    if (!timeStr) return "##:## AM";
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};

const formatElapsedTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
};

const updateTaskTimer = (task, taskIndex) => {
    // Teachers view project breakdown read-only
    return task.elapsedTime || 0;
};

const closeTaskDetails = () => {
    if (!taskDetailsOverlay) return;
    taskDetailsOverlay.classList.remove("open");
    taskDetailsOverlay.setAttribute("aria-hidden", "true");
};

const openTaskDetails = (taskIndex, tasks) => {
    if (!taskDetailsOverlay) return;

    const task = tasks[taskIndex];
    if (!task) return;

    if (detailTaskName) detailTaskName.textContent = task.name || "";
    if (detailTaskDescription) detailTaskDescription.textContent = task.description || "None";
    if (detailTaskAssignees) detailTaskAssignees.textContent = (task.assignees && task.assignees.length) ? task.assignees.join(", ") : "None";
    if (detailTaskDueDate) detailTaskDueDate.textContent = task.dueDate || "N/A";
    if (detailTaskDueTime) detailTaskDueTime.textContent = task.dueTime ? formatTime12h(task.dueTime) : "N/A";

    if (detailTaskIntensity) {
        detailTaskIntensity.textContent = task.intensity || "Light";
    }

    if (detailTaskPriority) {
        detailTaskPriority.textContent = task.priority || "Low";
    }

    if (detailTaskStatus) {
        const status = task.status || "inactive";
        detailTaskStatus.textContent = STATUS_TEXT[status] || status;
        detailTaskStatus.className = `task-status ${status}`;
        detailTaskStatus.disabled = true;
    }

    if (detailTaskTimeActive) {
        const elapsedTime = updateTaskTimer(task, taskIndex);
        detailTaskTimeActive.textContent = formatElapsedTime(elapsedTime);
    }

    taskDetailsOverlay.classList.add("open");
    taskDetailsOverlay.setAttribute("aria-hidden", "false");
};

const renderTask = (task, taskIndex, targetSection) => {
    if (!targetSection) return;

    const assigneeList = (task.assignees && task.assignees.length) ? task.assignees.join(", ") : "None";
    const timeDisplay = formatTime12h(task.dueTime);
    const dateDisplay = task.dueDate || "##/##/####";

    let status = task.status || "inactive";
    if (!isTerminal(status) && status !== "verifying" && isPastDue(task)) {
        status = "missing";
    }

    const article = document.createElement("article");
    article.className = "task-card task-card-clickable";

    const priority = (task.priority || "Low").toLowerCase();
    if (priority === "high") {
        article.style.backgroundColor = "#FF8383";
    } else if (priority === "medium") {
        article.style.backgroundColor = "#FFC193";
    }

    article.innerHTML = `
        <div class="task-left">
            <h3>Task: ${task.name}</h3>
            <p>
                Assignee(s):
                <span class="assignee-info-wrap">
                    <img class="assignee-info-icon" src="../assets/Info.png" alt="Info icon">
                    <span class="assignee-tooltip">${assigneeList}</span>
                </span>
                &nbsp; Due Date: ${timeDisplay} -- ${dateDisplay}
            </p>
        </div>
        <div class="task-actions">
            <button class="task-status ${status}" type="button" disabled>${STATUS_TEXT[status] || status}</button>
        </div>
    `;

    article.addEventListener("click", () => {
        openTaskDetails(taskIndex, targetSection === document.querySelector("#tasksList") ? window.currentTasks : []);
    });

    targetSection.appendChild(article);
};

const renderAllTasks = async () => {
    const tasks = await loadTasks();
    window.currentTasks = tasks;
    const tasksList = document.querySelector("#tasksList");
    if (tasksList) tasksList.innerHTML = "";

    let pendingVerifyCount = 0;

    tasks.forEach((task, index) => {
        renderTask(task, index, tasksList);

        if ((task.status || "").toLowerCase() === "verifying") {
            pendingVerifyCount += 1;
        }
    });

    if (tasksList && tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <img src="../assets/Plus.png" class="empty-state-icon" alt="No tasks">
                <h3>No Tasks Available</h3>
                <p>There are no tasks currently listed for this project.</p>
            </div>
        `;
    }

    const summaryCards = document.querySelectorAll(".summary-card h3");
    if (summaryCards[0]) summaryCards[0].textContent = tasks.length;
    if (summaryCards[1]) summaryCards[1].textContent = pendingVerifyCount;
};

if (closeTaskDetailsBtn) {
    closeTaskDetailsBtn.addEventListener("click", closeTaskDetails);
}

if (taskDetailsOverlay) {
    taskDetailsOverlay.addEventListener("click", (event) => {
        if (event.target === taskDetailsOverlay) closeTaskDetails();
    });
}

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "t.dashb.html";
    });
}

if (groupInfoTab) {
    groupInfoTab.addEventListener("click", () => {
        const grpId = sessionStorage.getItem("hive_grpId");
        window.location.href = `t.grpviewing.html${grpId ? `?grpId=${grpId}` : ""}`;;
    });
}

if (backToCategoriesBtn) {
    backToCategoriesBtn.addEventListener("click", () => {
        window.location.href = "t.category.html";
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeTaskDetails();
    }
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

const loadAndDisplayProjectName = () => {
    const projectName = sessionStorage.getItem("hive_selected_project_name");
    const projectNameDisplay = document.querySelector(".project-name-display h2");
    if (projectName && projectNameDisplay) {
        projectNameDisplay.textContent = projectName;
    }
};

loadAndDisplayProjectName();
renderAllTasks();