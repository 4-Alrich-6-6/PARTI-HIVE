const topBackBtn = document.querySelector("#topBackBtn");
const backToCategoriesBtn = document.querySelector("#backToCategoriesBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const task1Badge = document.querySelector("#task1-badge");
const memberVerifyOverlay = document.querySelector("#memberVerifyOverlay");
const memberVerifyConfirmBtn = document.querySelector("#memberVerifyConfirmBtn");
const memberVerifyCancelBtn = document.querySelector("#memberVerifyCancelBtn");
const pauseVerifyChoiceOverlay = document.querySelector("#pauseVerifyChoiceOverlay");
const pauseVerifyPauseBtn = document.querySelector("#pauseVerifyPauseBtn");
const pauseVerifyVerifyBtn = document.querySelector("#pauseVerifyVerifyBtn");
const pauseVerifyCloseBtn = document.querySelector("#pauseVerifyCloseBtn");
const closePopupBtn = document.querySelector("#closePopupBtn");
const overlay = document.querySelector("#overlay");

const popupTaskName = document.querySelector(".popup-task-name");
const popupDescText = document.querySelector(".popup-desc-text");
const popupAssignees = document.querySelector(".popup-assignees");
const popupDueDate = document.querySelector("#popupDueDate");
const popupDueTime = document.querySelector("#popupDueTime");
const popupIntensity = document.querySelector("#popupIntensity");
const popupPriority = document.querySelector("#popupPriority");
const popupTimeActive = document.querySelector("#popupTimeActive");
const popupStatusDisplay = document.querySelector("#popupStatusDisplay");
const statusOptions = document.querySelector(".status-options");

const STORAGE_KEY_TASKS = "hive_leader_tasks";
const STORAGE_KEY_TASK_STATUS = "hive_member_task1_status";
const STORAGE_KEY_TASK_DUE = "hive_member_task1_due";

const STATUS_TEXT = {
    inactive: "Not Active",
    active: "Active",
    pause: "On Break",
    verifying: "Verifying",
    finished: "Finished",
    missing: "Missing"
};

const isTerminal = (s) => s === "finished" || s === "missing";

const loadTasks = () => {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    return saved ? JSON.parse(saved) : [];
};

const saveTasks = (tasks) => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
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
    const currentStatus = task.status || "inactive";
    const now = Date.now();
    
    if (!task.elapsedTime) task.elapsedTime = 0;
    
    if (currentStatus === "active") {
        if (task.lastActiveTimestamp) {
            const elapsed = now - task.lastActiveTimestamp;
            task.elapsedTime += elapsed;
        }
        task.lastActiveTimestamp = now;
    } else {
        task.lastActiveTimestamp = null;
    }
    
    const tasks = loadTasks();
    if (tasks[taskIndex]) {
        tasks[taskIndex].elapsedTime = task.elapsedTime;
        tasks[taskIndex].lastActiveTimestamp = task.lastActiveTimestamp;
        saveTasks(tasks);
    }
    
    return task.elapsedTime;
};

const openTaskDetails = (taskIndex) => {
    if (!overlay) return;

    const tasks = loadTasks();
    const task = tasks[taskIndex];
    if (!task) return;

    activeTaskIndex = taskIndex;

    if (popupTaskName) popupTaskName.textContent = task.name || "";
    if (popupDescText) popupDescText.textContent = task.description || "None";
    if (popupAssignees) popupAssignees.textContent = (task.assignees && task.assignees.length) ? task.assignees.join(", ") : "None";
    if (popupDueDate) popupDueDate.textContent = task.dueDate || "N/A";
    if (popupDueTime) popupDueTime.textContent = task.dueTime ? formatTime12h(task.dueTime) : "N/A";
    if (popupIntensity) popupIntensity.textContent = task.intensity || "Light";
    if (popupPriority) popupPriority.textContent = task.priority || "Low";

    if (popupStatusDisplay) {
        const currentStatus = task.status || "inactive";
        popupStatusDisplay.textContent = STATUS_TEXT[currentStatus] || currentStatus;
        popupStatusDisplay.className = `task-status ${currentStatus}`;
    }

    if (popupTimeActive) {
        const elapsedTime = updateTaskTimer(task, taskIndex);
        popupTimeActive.textContent = formatElapsedTime(elapsedTime);
    }

    if (statusOptions) {
        const currentStatus = task.status || "inactive";
        const buttons = statusOptions.querySelectorAll(".status-opt");
        buttons.forEach(btn => {
            btn.classList.toggle("selected", btn.dataset.status === currentStatus);
        });
    }

    overlay.classList.add("open");
};

const closeTaskDetails = () => {
    if (overlay) overlay.classList.remove("open");
    activeTaskIndex = null;
};

const renderTask = (task, taskIndex, isOwnTask, targetSection) => {
    if (!targetSection) return;

    const assigneeList = (task.assignees && task.assignees.length) ? task.assignees.join(", ") : "None";
    const timeDisplay = formatTime12h(task.dueTime);
    const dateDisplay = task.dueDate || "##/##/####";

    let status = task.status || "inactive";

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
                    <img class="assignee-info-icon" src="../../assets/Info.png" alt="Info icon">
                    <span class="assignee-tooltip">${assigneeList}</span>
                </span>
                &nbsp; Due Date: ${timeDisplay} -- ${dateDisplay}
            </p>
        </div>
        <div class="task-actions">
            <button class="task-status ${status}" type="button">${STATUS_TEXT[status] || status}</button>
        </div>
    `;

    const statusBtn = article.querySelector(".task-status");
    if (isOwnTask && !isTerminal(status)) {
        statusBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (status === "inactive") {
                updateTaskStatus(taskIndex, "active");
            } else if (status === "active") {
                activeTaskIndex = taskIndex;
                openPauseVerifyChoice(
                    () => updateTaskStatus(taskIndex, "pause"),
                    () => openVerifyModal()
                );
            } else if (status === "pause") {
                updateTaskStatus(taskIndex, "active");
            }
        });
    } else {
        statusBtn.disabled = true;
    }

    article.addEventListener("click", () => {
        openTaskDetails(taskIndex);
    });

    targetSection.appendChild(article);
};

const updateTaskStatus = (taskIndex, newStatus) => {
    const tasks = loadTasks();
    if (tasks[taskIndex]) {
        tasks[taskIndex].status = newStatus;
        updateTaskTimer(tasks[taskIndex], taskIndex);
        saveTasks(tasks);
        renderAllTasks();
    }
};

const renderAllTasks = () => {
    const taskSections = document.querySelectorAll(".task-section");
    const ownSection = taskSections[0];
    const otherSection = taskSections[1];

    if (ownSection) ownSection.querySelectorAll(".task-card").forEach(el => el.remove());
    if (otherSection) otherSection.querySelectorAll(".task-card").forEach(el => el.remove());

    const tasks = loadTasks();
    let ownCount = 0;
    let otherCount = 0;
    let pendingCount = 0;

    tasks.forEach((task, index) => {
        const isOwnTask = task.assignees && task.assignees.some(a => a.toLowerCase().includes("person 2") || a.toLowerCase().includes("you"));
        const target = isOwnTask ? ownSection : otherSection;
        renderTask(task, index, isOwnTask, target);

        if (isOwnTask) ownCount++;
        else otherCount++;
        if (task.status === "verifying") pendingCount++;
    });

    const summaryH3s = document.querySelectorAll(".summary-card h3");
    if (summaryH3s[0]) summaryH3s[0].textContent = ownCount;
    if (summaryH3s[1]) summaryH3s[1].textContent = otherCount;
    if (summaryH3s[2]) summaryH3s[2].textContent = pendingCount;
};

let activeTaskIndex = null;
let pauseVerifyCallback = null;

const openPauseVerifyChoice = (onPause, onVerify) => {
    pauseVerifyCallback = { onPause, onVerify };
    if (pauseVerifyChoiceOverlay) {
        pauseVerifyChoiceOverlay.classList.add("open");
        pauseVerifyChoiceOverlay.setAttribute("aria-hidden", "false");
    }
};

const closePauseVerifyChoice = () => {
    if (pauseVerifyChoiceOverlay) {
        pauseVerifyChoiceOverlay.classList.remove("open");
        pauseVerifyChoiceOverlay.setAttribute("aria-hidden", "true");
    }
    pauseVerifyCallback = null;
};

const isPastDue = () => {
    const due = localStorage.getItem(STORAGE_KEY_TASK_DUE);
    if (!due) return false;
    return Date.now() > new Date(due).getTime();
};

const applyBadge = (status) => {
    if (!task1Badge) return;
    task1Badge.textContent = STATUS_TEXT[status] || status;
    task1Badge.className = `task-status ${status}`;
    task1Badge.disabled = isTerminal(status) || status === "verifying";
};

let currentStatus = localStorage.getItem(STORAGE_KEY_TASK_STATUS) || "inactive";

if (!isTerminal(currentStatus) && currentStatus !== "verifying" && isPastDue()) {
    currentStatus = "missing";
    localStorage.setItem(STORAGE_KEY_TASK_STATUS, "missing");
}

applyBadge(currentStatus);

const setStatus = (newStatus) => {
    currentStatus = newStatus;
    localStorage.setItem(STORAGE_KEY_TASK_STATUS, newStatus);
    applyBadge(newStatus);
};

const openVerifyModal = () => {
    if (memberVerifyOverlay) {
        memberVerifyOverlay.classList.add("open");
        memberVerifyOverlay.setAttribute("aria-hidden", "false");
    }
};

const closeVerifyModal = () => {
    if (memberVerifyOverlay) {
        memberVerifyOverlay.classList.remove("open");
        memberVerifyOverlay.setAttribute("aria-hidden", "true");
    }
};

if (task1Badge) {
    task1Badge.addEventListener("click", () => {
        if (isTerminal(currentStatus) || currentStatus === "verifying") return;
        if (currentStatus === "inactive") setStatus("active");
        else if (currentStatus === "active") openVerifyModal();
    });
}

if (memberVerifyConfirmBtn) {
    memberVerifyConfirmBtn.addEventListener("click", () => {
        if (activeTaskIndex !== null) {
            updateTaskStatus(activeTaskIndex, "verifying");
        }
        closeVerifyModal();
    });
}

if (memberVerifyCancelBtn) {
    memberVerifyCancelBtn.addEventListener("click", closeVerifyModal);
}

if (closePopupBtn) {
    closePopupBtn.addEventListener("click", closeTaskDetails);
}

if (overlay) {
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeTaskDetails();
    });
}

if (memberVerifyOverlay) {
    memberVerifyOverlay.addEventListener("click", (e) => {
        if (e.target === memberVerifyOverlay) closeVerifyModal();
    });
}

if (pauseVerifyPauseBtn) {
    pauseVerifyPauseBtn.addEventListener("click", () => {
        if (pauseVerifyCallback && pauseVerifyCallback.onPause) pauseVerifyCallback.onPause();
        closePauseVerifyChoice();
    });
}

if (pauseVerifyVerifyBtn) {
    pauseVerifyVerifyBtn.addEventListener("click", () => {
        if (pauseVerifyCallback && pauseVerifyCallback.onVerify) pauseVerifyCallback.onVerify();
        closePauseVerifyChoice();
    });
}

if (pauseVerifyCloseBtn) {
    pauseVerifyCloseBtn.addEventListener("click", closePauseVerifyChoice);
}

if (pauseVerifyChoiceOverlay) {
    pauseVerifyChoiceOverlay.addEventListener("click", (e) => {
        if (e.target === pauseVerifyChoiceOverlay) closePauseVerifyChoice();
    });
}

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "../.dashb.html";
    });
}

if (groupInfoTab) {
    groupInfoTab.addEventListener("click", () => {
        window.location.href = "s.membergrpviewing.html";
    });
}

if (backToCategoriesBtn) {
    backToCategoriesBtn.addEventListener("click", () => {
        window.location.href = "s.membercategory.html";
    });
}

const logoutBtn = document.querySelector(".logout");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        showConfirmation(
            "Are you sure you want to log out?",
            () => {
                window.location.href = "../../auth/log-sign.html";
            },
            { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
        );
    });
}

const loadAndDisplayProjectName = () => {
    const projectName = localStorage.getItem("hive_selected_project_name");
    const projectNameDisplay = document.querySelector(".project-name-display h2");
    if (projectName && projectNameDisplay) {
        projectNameDisplay.textContent = projectName;
    }
};

loadAndDisplayProjectName();
renderAllTasks();