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

const loadTasks = () => {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    return saved ? JSON.parse(saved) : [];
};

const formatTime12h = (timeStr) => {
    if (!timeStr) return "##:## AM";
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};

const closeTaskDetails = () => {
    if (!taskDetailsOverlay) return;
    taskDetailsOverlay.classList.remove("open");
    taskDetailsOverlay.setAttribute("aria-hidden", "true");
};

const openTaskDetails = (taskIndex) => {
    if (!taskDetailsOverlay) return;

    const tasks = loadTasks();
    const task = tasks[taskIndex];
    if (!task) return;

    if (detailTaskName) detailTaskName.textContent = task.name || "";
    if (detailTaskDescription) detailTaskDescription.textContent = task.description || "None";
    if (detailTaskAssignees) detailTaskAssignees.textContent = (task.assignees && task.assignees.length) ? task.assignees.join(", ") : "None";
    if (detailTaskDueDate) detailTaskDueDate.textContent = task.dueDate || "N/A";
    if (detailTaskDueTime) detailTaskDueTime.textContent = task.dueTime ? formatTime12h(task.dueTime) : "N/A";

    if (detailTaskStatus) {
        const status = task.status || "inactive";
        detailTaskStatus.textContent = STATUS_TEXT[status] || status;
        detailTaskStatus.className = `task-status ${status}`;
        detailTaskStatus.disabled = true;
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
    article.innerHTML = `
        <div class="task-left">
            <h3>Task: ${task.name}</h3>
            <p>
                Assignee(s):
                <span class="assignee-info-wrap">
                    <img class="assignee-info-icon" src="assets/Info.png" alt="Info icon">
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
        openTaskDetails(taskIndex);
    });

    targetSection.appendChild(article);
};

const renderAllTasks = () => {
    document.querySelectorAll(".task-card").forEach((card) => card.remove());

    const tasks = loadTasks();
    const taskSection = document.querySelector(".task-section");

    let pendingVerifyCount = 0;

    tasks.forEach((task, index) => {
        renderTask(task, index, taskSection);

        if ((task.status || "").toLowerCase() === "verifying") {
            pendingVerifyCount += 1;
        }
    });

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
        window.location.href = "t.grpviewing.html";
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
        window.location.href = "../auth/log-sign.html";
    });
}

renderAllTasks();
