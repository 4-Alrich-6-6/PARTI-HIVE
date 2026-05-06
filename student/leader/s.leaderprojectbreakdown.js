const topBackBtn = document.querySelector("#topBackBtn");
const backToCategoriesBtn = document.querySelector("#backToCategoriesBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const openPostTaskModalBtn = document.querySelector("#openPostTaskModalBtn");
const postTaskModalOverlay = document.querySelector("#postTaskModalOverlay");
const discardPostTaskBtn = document.querySelector("#discardPostTaskBtn");
const postTaskForm = document.querySelector("#postTaskForm");
const postTaskSubmitBtn = postTaskForm ? postTaskForm.querySelector("button[type='submit']") : null;
const taskNameInput = postTaskForm ? postTaskForm.querySelector("#taskNameInput") : null;
const dueDateInput = postTaskForm ? postTaskForm.querySelector("#dueDateInput") : null;
const dueTimeInput = postTaskForm ? postTaskForm.querySelector("#dueTimeInput") : null;
const assigneeInputs = postTaskForm ? Array.from(postTaskForm.querySelectorAll("input[name='assignees']")) : [];
const taskDescriptionInput = postTaskForm ? postTaskForm.querySelector("#taskDescriptionInput") : null;
const verifyChoiceOverlay = document.querySelector("#verifyChoiceOverlay");
const verifyFinishBtn = document.querySelector("#verifyFinishBtn");
const verifyReviseBtn = document.querySelector("#verifyReviseBtn");
const verifyCloseBtn = document.querySelector("#verifyCloseBtn");
const pauseFinishChoiceOverlay = document.querySelector("#pauseFinishChoiceOverlay");
const pauseFinishPauseBtn = document.querySelector("#pauseFinishPauseBtn");
const pauseFinishFinishBtn = document.querySelector("#pauseFinishFinishBtn");
const pauseFinishCloseBtn = document.querySelector("#pauseFinishCloseBtn");
const taskSettingsOverlay = document.querySelector("#taskSettingsOverlay");
const openEditTaskInfoBtn = document.querySelector("#openEditTaskInfoBtn");
const openManualStatusBtn = document.querySelector("#openManualStatusBtn");
const openRemoveTaskConfirmBtn = document.querySelector("#openRemoveTaskConfirmBtn");
const discardTaskSettingsBtn = document.querySelector("#discardTaskSettingsBtn");
const editTaskInfoOverlay = document.querySelector("#editTaskInfoOverlay");
const editTaskInfoForm = document.querySelector("#editTaskInfoForm");
const discardEditTaskInfoBtn = document.querySelector("#discardEditTaskInfoBtn");
const saveEditTaskInfoBtn = document.querySelector("#saveEditTaskInfoBtn");
const editTaskNameInput = editTaskInfoForm ? editTaskInfoForm.querySelector("#editTaskNameInput") : null;
const editTaskDescriptionInput = editTaskInfoForm ? editTaskInfoForm.querySelector("#editTaskDescriptionInput") : null;
const editDueDateInput = editTaskInfoForm ? editTaskInfoForm.querySelector("#editDueDateInput") : null;
const editDueTimeInput = editTaskInfoForm ? editTaskInfoForm.querySelector("#editDueTimeInput") : null;
const editAssigneeInputs = editTaskInfoForm ? Array.from(editTaskInfoForm.querySelectorAll("input[name='editAssignees']")) : [];
const manualStatusOverlay = document.querySelector("#manualStatusOverlay");
const manualStatusButtons = Array.from(document.querySelectorAll("[data-manual-status]"));
const discardManualStatusBtn = document.querySelector("#discardManualStatusBtn");
const removeTaskConfirmOverlay = document.querySelector("#removeTaskConfirmOverlay");
const confirmRemoveTaskBtn = document.querySelector("#confirmRemoveTaskBtn");
const discardRemoveTaskBtn = document.querySelector("#discardRemoveTaskBtn");
const taskDetailsOverlay = document.querySelector("#taskDetailsOverlay");
const closeTaskDetailsBtn = document.querySelector("#closeTaskDetailsBtn");
const detailTaskName = document.querySelector("#detailTaskName");
const detailTaskDescription = document.querySelector("#detailTaskDescription");
const detailTaskAssignees = document.querySelector("#detailTaskAssignees");
const detailTaskDueDate = document.querySelector("#detailTaskDueDate");
const detailTaskDueTime = document.querySelector("#detailTaskDueTime");
const detailTaskStatus = document.querySelector("#detailTaskStatus");
const detailTaskTimeActive = document.querySelector("#detailTaskTimeActive");

let activeTaskIndex = null;

const STATUS_TEXT = {
    inactive: "Not Active",
    active: "Active",
    pause: "On Break",
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

const applyStatusToBtn = (btn, status) => {
    btn.textContent = STATUS_TEXT[status] || status;
    btn.className = `task-status ${status}`;
    btn.disabled = isTerminal(status) || status === "verifying";
};

let verifyChoiceCallback = null;
let pauseFinishCallback = null;

const openVerifyChoice = (onFinish, onRevise) => {
    verifyChoiceCallback = { onFinish, onRevise };
    if (verifyChoiceOverlay) {
        verifyChoiceOverlay.classList.add("open");
        verifyChoiceOverlay.setAttribute("aria-hidden", "false");
    }
};

const closeVerifyChoice = () => {
    if (verifyChoiceOverlay) {
        verifyChoiceOverlay.classList.remove("open");
        verifyChoiceOverlay.setAttribute("aria-hidden", "true");
    }
    verifyChoiceCallback = null;
};

const openPauseFinishChoice = (onPause, onFinish) => {
    pauseFinishCallback = { onPause, onFinish };
    if (pauseFinishChoiceOverlay) {
        pauseFinishChoiceOverlay.classList.add("open");
        pauseFinishChoiceOverlay.setAttribute("aria-hidden", "false");
    }
};

const closePauseFinishChoice = () => {
    if (pauseFinishChoiceOverlay) {
        pauseFinishChoiceOverlay.classList.remove("open");
        pauseFinishChoiceOverlay.setAttribute("aria-hidden", "true");
    }
    pauseFinishCallback = null;
};

if (verifyFinishBtn) {
    verifyFinishBtn.addEventListener("click", () => {
        if (verifyChoiceCallback && verifyChoiceCallback.onFinish) verifyChoiceCallback.onFinish();
        closeVerifyChoice();
    });
}

if (verifyReviseBtn) {
    verifyReviseBtn.addEventListener("click", () => {
        if (verifyChoiceCallback && verifyChoiceCallback.onRevise) verifyChoiceCallback.onRevise();
        closeVerifyChoice();
    });
}

if (verifyCloseBtn) {
    verifyCloseBtn.addEventListener("click", closeVerifyChoice);
}

if (verifyChoiceOverlay) {
    verifyChoiceOverlay.addEventListener("click", (e) => {
        if (e.target === verifyChoiceOverlay) closeVerifyChoice();
    });
}

if (pauseFinishPauseBtn) {
    pauseFinishPauseBtn.addEventListener("click", () => {
        if (pauseFinishCallback && pauseFinishCallback.onPause) pauseFinishCallback.onPause();
        closePauseFinishChoice();
    });
}

if (pauseFinishFinishBtn) {
    pauseFinishFinishBtn.addEventListener("click", () => {
        if (pauseFinishCallback && pauseFinishCallback.onFinish) pauseFinishCallback.onFinish();
        closePauseFinishChoice();
    });
}

if (pauseFinishCloseBtn) {
    pauseFinishCloseBtn.addEventListener("click", closePauseFinishChoice);
}

if (pauseFinishChoiceOverlay) {
    pauseFinishChoiceOverlay.addEventListener("click", (e) => {
        if (e.target === pauseFinishChoiceOverlay) closePauseFinishChoice();
    });
}

const attachLeaderStatusBtn = (statusBtn, task, isOwnTask, taskIndex) => {
    const updateStatus = (newStatus) => {
        task.status = newStatus;
        const tasks = loadTasks();
        if (tasks[taskIndex]) tasks[taskIndex].status = newStatus;
        updateTaskTimer(task, taskIndex);
        saveTasks(tasks);
        applyStatusToBtn(statusBtn, newStatus);
    };

    statusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const current = task.status || "inactive";

        if (isTerminal(current)) return;

        if (isOwnTask) {
            if (current === "inactive") updateStatus("active");
            else if (current === "active") {
                openPauseFinishChoice(
                    () => updateStatus("pause"),
                    () => updateStatus("finished")
                );
            } else if (current === "pause") {
                updateStatus("active");
            }
        } else {
            if (current === "inactive") updateStatus("active");
            else if (current === "active") updateStatus("missing");
            else if (current === "verifying") {
                openVerifyChoice(
                    () => updateStatus("finished"),
                    () => updateStatus("active")
                );
            }
        }
    });
};

const STORAGE_KEY_TASKS = "hive_leader_tasks";

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

const renderTask = (task, taskIndex, isOwnTask, targetSection) => {
    if (!targetSection) return;

    const assigneeList = (task.assignees && task.assignees.length) ? task.assignees.join(", ") : "None";
    const timeDisplay = formatTime12h(task.dueTime);
    const dateDisplay = task.dueDate || "##/##/####";

    let status = task.status || "inactive";
    if (!isTerminal(status) && status !== "verifying" && isPastDue(task)) {
        status = "missing";
        task.status = "missing";
        const tasks = loadTasks();
        if (tasks[taskIndex]) tasks[taskIndex].status = "missing";
        saveTasks(tasks);
    }

    const article = document.createElement("article");
    article.className = "task-card";

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
            <button class="more-btn" type="button" aria-label="More task options">
                <img src="../../assets/More.png" alt="More options">
            </button>
        </div>
    `;

    const statusBtn = article.querySelector(".task-status");
    if (isTerminal(status) || status === "verifying") statusBtn.disabled = true;
    else statusBtn.disabled = false;
    attachLeaderStatusBtn(statusBtn, task, isOwnTask, taskIndex);

    const moreBtn = article.querySelector(".more-btn");
    if (moreBtn) {
        moreBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            openTaskSettings(taskIndex);
        });
    }

    article.classList.add("task-card-clickable");
    article.setAttribute("data-dynamic", "true");

    article.addEventListener("click", () => {
        openTaskDetails(taskIndex);
    });

    targetSection.appendChild(article);
};

const renderAllTasks = () => {
    const tasks = loadTasks();
    const yourTasksList = document.querySelector("#yourTasksList");
    const otherTasksList = document.querySelector("#otherTasksList");
    
    if (yourTasksList) yourTasksList.innerHTML = "";
    if (otherTasksList) otherTasksList.innerHTML = "";

    let ownCount = 0;
    let otherCount = 0;
    let pendingVerifyCount = 0;

    tasks.forEach((task, index) => {
        const isOwnTask = task.assignees && task.assignees.some(a => a.toLowerCase().includes("leader") || a.toLowerCase().includes("you"));
        const targetSection = isOwnTask ? yourTasksList : otherTasksList;
        renderTask(task, index, isOwnTask, targetSection);

        if (isOwnTask) {
            ownCount += 1;
        } else {
            otherCount += 1;
        }

        if ((task.status || "").toLowerCase() === "verifying") {
            pendingVerifyCount += 1;
        }
    });

    if (yourTasksList && ownCount === 0) {
        yourTasksList.innerHTML = `
            <div class="empty-state">
                <img src="../../assets/Plus.png" class="empty-state-icon" alt="No tasks">
                <h3>No Tasks Assigned</h3>
                <p>You have no personal tasks assigned to this project yet.</p>
            </div>
        `;
    }
    if (otherTasksList && otherCount === 0) {
        otherTasksList.innerHTML = `
            <div class="empty-state">
                <img src="../../assets/Plus.png" class="empty-state-icon" alt="No tasks">
                <h3>No Other Tasks</h3>
                <p>There are no other tasks currently listed for this project.</p>
            </div>
        `;
    }

    const summaryCards = document.querySelectorAll(".summary-card h3");
    if (summaryCards[0]) summaryCards[0].textContent = ownCount;
    if (summaryCards[1]) summaryCards[1].textContent = otherCount;
    if (summaryCards[2]) summaryCards[2].textContent = pendingVerifyCount;
};

const closeTaskSettings = () => {
    if (!taskSettingsOverlay) return;
    taskSettingsOverlay.classList.remove("open");
    taskSettingsOverlay.setAttribute("aria-hidden", "true");
};

const openTaskSettings = (taskIndex) => {
    if (!taskSettingsOverlay) return;
    activeTaskIndex = taskIndex;
    taskSettingsOverlay.classList.add("open");
    taskSettingsOverlay.setAttribute("aria-hidden", "false");
};

const closeEditTaskInfo = () => {
    if (!editTaskInfoOverlay) return;
    editTaskInfoOverlay.classList.remove("open");
    editTaskInfoOverlay.setAttribute("aria-hidden", "true");
};

const updateEditTaskSubmitState = () => {
    if (!saveEditTaskInfoBtn) return;
    const hasTaskName = editTaskNameInput && editTaskNameInput.value.trim().length > 0;
    const hasDueDate = editDueDateInput && editDueDateInput.value.length > 0;
    const hasDueTime = editDueTimeInput && editDueTimeInput.value.length > 0;
    const hasAssignee = editAssigneeInputs.some((input) => input.checked);
    saveEditTaskInfoBtn.disabled = !(hasTaskName && hasDueDate && hasDueTime && hasAssignee);
};

const openEditTaskInfo = () => {
    if (!editTaskInfoOverlay || activeTaskIndex === null) return;
    const tasks = loadTasks();
    const task = tasks[activeTaskIndex];
    if (!task) return;
    if (editTaskNameInput) editTaskNameInput.value = task.name || "";
    if (editTaskDescriptionInput) editTaskDescriptionInput.value = task.description || "";
    if (editDueDateInput) {
        editDueDateInput.min = new Date().toISOString().split("T")[0];
        editDueDateInput.value = task.dueDate || "";
    }
    if (editDueTimeInput) editDueTimeInput.value = task.dueTime || "";
    if (document.getElementById("editIntensityInput")) document.getElementById("editIntensityInput").value = task.intensity || "Light";
    if (document.getElementById("editPriorityInput")) document.getElementById("editPriorityInput").value = task.priority || "Low";
    const selectedAssignees = (task.assignees || []).map((assignee) => assignee.toLowerCase());
    editAssigneeInputs.forEach((input) => {
        const label = input.closest("label");
        const text = label ? label.querySelector("span").textContent.trim().toLowerCase() : "";
        input.checked = selectedAssignees.includes(text);
    });
    updateEditTaskSubmitState();
    editTaskInfoOverlay.classList.add("open");
    editTaskInfoOverlay.setAttribute("aria-hidden", "false");
};

const closeManualStatus = () => {
    if (!manualStatusOverlay) return;
    manualStatusOverlay.classList.remove("open");
    manualStatusOverlay.setAttribute("aria-hidden", "true");
};

const openManualStatus = () => {
    if (!manualStatusOverlay || activeTaskIndex === null) return;
    manualStatusOverlay.classList.add("open");
    manualStatusOverlay.setAttribute("aria-hidden", "false");
};

const closeRemoveTaskConfirm = () => {
    if (!removeTaskConfirmOverlay) return;
    removeTaskConfirmOverlay.classList.remove("open");
    removeTaskConfirmOverlay.setAttribute("aria-hidden", "true");
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
    if (document.getElementById("detailTaskIntensity")) document.getElementById("detailTaskIntensity").textContent = task.intensity || "Light";
    if (document.getElementById("detailTaskPriority")) document.getElementById("detailTaskPriority").textContent = task.priority || "Low";
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

const openRemoveTaskConfirm = () => {
    if (!removeTaskConfirmOverlay || activeTaskIndex === null) return;
    removeTaskConfirmOverlay.classList.add("open");
    removeTaskConfirmOverlay.setAttribute("aria-hidden", "false");
};

if (topBackBtn) topBackBtn.addEventListener("click", () => { window.location.href = "../s.dashb.html"; });
if (groupInfoTab) groupInfoTab.addEventListener("click", () => { window.location.href = "s.leadergrpviewing.html"; });
if (backToCategoriesBtn) backToCategoriesBtn.addEventListener("click", () => { window.location.href = "s.leadercategory.html"; });
if (discardTaskSettingsBtn) discardTaskSettingsBtn.addEventListener("click", closeTaskSettings);
if (taskSettingsOverlay) taskSettingsOverlay.addEventListener("click", (e) => { if (e.target === taskSettingsOverlay) closeTaskSettings(); });
if (openEditTaskInfoBtn) openEditTaskInfoBtn.addEventListener("click", () => { closeTaskSettings(); openEditTaskInfo(); });
if (discardEditTaskInfoBtn) discardEditTaskInfoBtn.addEventListener("click", closeEditTaskInfo);
if (editTaskInfoOverlay) editTaskInfoOverlay.addEventListener("click", (e) => { if (e.target === editTaskInfoOverlay) closeEditTaskInfo(); });
if (openManualStatusBtn) openManualStatusBtn.addEventListener("click", () => { closeTaskSettings(); openManualStatus(); });
if (discardManualStatusBtn) discardManualStatusBtn.addEventListener("click", closeManualStatus);
if (manualStatusOverlay) manualStatusOverlay.addEventListener("click", (e) => { if (e.target === manualStatusOverlay) closeManualStatus(); });
if (openRemoveTaskConfirmBtn) openRemoveTaskConfirmBtn.addEventListener("click", () => { closeTaskSettings(); openRemoveTaskConfirm(); });
if (discardRemoveTaskBtn) discardRemoveTaskBtn.addEventListener("click", closeRemoveTaskConfirm);
if (removeTaskConfirmOverlay) removeTaskConfirmOverlay.addEventListener("click", (e) => { if (e.target === removeTaskConfirmOverlay) closeRemoveTaskConfirm(); });
if (closeTaskDetailsBtn) closeTaskDetailsBtn.addEventListener("click", closeTaskDetails);
if (taskDetailsOverlay) taskDetailsOverlay.addEventListener("click", (e) => { if (e.target === taskDetailsOverlay) closeTaskDetails(); });
if (confirmRemoveTaskBtn) confirmRemoveTaskBtn.addEventListener("click", () => {
    if (activeTaskIndex === null) return;
    const tasks = loadTasks();
    tasks.splice(activeTaskIndex, 1);
    saveTasks(tasks);
    activeTaskIndex = null;
    closeRemoveTaskConfirm();
    renderAllTasks();
});
if (editTaskNameInput) editTaskNameInput.addEventListener("input", updateEditTaskSubmitState);
if (editDueDateInput) editDueDateInput.addEventListener("input", updateEditTaskSubmitState);
if (editDueTimeInput) editDueTimeInput.addEventListener("input", updateEditTaskSubmitState);
editAssigneeInputs.forEach((input) => input.addEventListener("change", updateEditTaskSubmitState));
manualStatusButtons.forEach((button) => {
    button.addEventListener("click", () => {
        if (activeTaskIndex === null) return;
        const status = button.dataset.manualStatus;
        const tasks = loadTasks();
        if (!tasks[activeTaskIndex]) return;
        tasks[activeTaskIndex].status = status;
        saveTasks(tasks);
        closeManualStatus();
        renderAllTasks();
    });
});
const closePostTaskModal = () => {
    if (!postTaskModalOverlay) return;
    postTaskModalOverlay.classList.remove("open");
    postTaskModalOverlay.setAttribute("aria-hidden", "true");
};
const updatePostTaskSubmitState = () => {
    if (!postTaskSubmitBtn || !postTaskForm) return;
    const hasTaskName = taskNameInput && taskNameInput.value.trim().length > 0;
    const hasDueDate = dueDateInput && dueDateInput.value.length > 0;
    const hasDueTime = dueTimeInput && dueTimeInput.value.length > 0;
    const hasAssignee = assigneeInputs.some((input) => input.checked);
    postTaskSubmitBtn.disabled = !(hasTaskName && hasDueDate && hasDueTime && hasAssignee);
};
if (openPostTaskModalBtn && postTaskModalOverlay) {
    openPostTaskModalBtn.addEventListener("click", () => {
        if (dueDateInput) dueDateInput.min = new Date().toISOString().split("T")[0];
        postTaskModalOverlay.classList.add("open");
        postTaskModalOverlay.setAttribute("aria-hidden", "false");
        updatePostTaskSubmitState();
    });
}
if (discardPostTaskBtn) discardPostTaskBtn.addEventListener("click", () => {
    if (postTaskForm) postTaskForm.reset();
    updatePostTaskSubmitState();
    closePostTaskModal();
});
if (taskNameInput) taskNameInput.addEventListener("input", updatePostTaskSubmitState);
if (dueDateInput) dueDateInput.addEventListener("input", updatePostTaskSubmitState);
if (dueTimeInput) dueTimeInput.addEventListener("input", updatePostTaskSubmitState);
assigneeInputs.forEach((input) => input.addEventListener("change", updatePostTaskSubmitState));
if (postTaskModalOverlay) postTaskModalOverlay.addEventListener("click", (e) => { if (e.target === postTaskModalOverlay) closePostTaskModal(); });
if (postTaskForm) postTaskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const checkedAssignees = Array.from(postTaskForm.querySelectorAll("input[name='assignees']:checked"));
    if (!taskNameInput || !taskNameInput.value.trim()) return;
    if (checkedAssignees.length === 0) { alert("Please select at least one assignee."); return; }
    if (!dueDateInput || !dueDateInput.value) return;
    if (!dueTimeInput || !dueTimeInput.value) return;
    const taskName = taskNameInput.value.trim();
    showConfirmation(`Are you sure you want to post the task "${taskName}"?`, () => {
        const assigneeLabels = checkedAssignees.map((cb) => {
            const label = cb.closest("label");
            return label ? label.querySelector("span").textContent.trim() : cb.value;
        });
        const task = {
            name: taskName,
            description: taskDescriptionInput ? taskDescriptionInput.value.trim() : "",
            assignees: assigneeLabels,
            dueDate: dueDateInput.value,
            dueTime: dueTimeInput.value,
            intensity: document.getElementById("intensityInput").value,
            priority: document.getElementById("priorityInput").value
        };
        const tasks = loadTasks();
        tasks.push(task);
        saveTasks(tasks);
        renderAllTasks();
        closePostTaskModal();
        postTaskForm.reset();
        updatePostTaskSubmitState();
    }, { title: "Post Task", confirmText: "Post", cancelText: "Cancel" });
});
if (editTaskInfoForm) editTaskInfoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (activeTaskIndex === null) return;
    const checkedAssignees = editAssigneeInputs.filter((input) => input.checked);
    if (!editTaskNameInput || !editTaskNameInput.value.trim()) return;
    if (checkedAssignees.length === 0) return;
    if (!editDueDateInput || !editDueDateInput.value) return;
    if (!editDueTimeInput || !editDueTimeInput.value) return;
    const taskName = editTaskNameInput.value.trim();
    showConfirmation(`Are you sure you want to save the changes to task "${taskName}"?`, () => {
        const assigneeLabels = checkedAssignees.map((cb) => {
            const label = cb.closest("label");
            return label ? label.querySelector("span").textContent.trim() : cb.value;
        });
        const tasks = loadTasks();
        if (!tasks[activeTaskIndex]) return;
        tasks[activeTaskIndex] = {
            ...tasks[activeTaskIndex],
            name: taskName,
            description: editTaskDescriptionInput ? editTaskDescriptionInput.value.trim() : "",
            assignees: assigneeLabels,
            dueDate: editDueDateInput.value,
            dueTime: editDueTimeInput.value,
            intensity: document.getElementById("editIntensityInput").value,
            priority: document.getElementById("editPriorityInput").value
        };
        saveTasks(tasks);
        closeEditTaskInfo();
        renderAllTasks();
    }, { title: "Save Changes", confirmText: "Save", cancelText: "Cancel" });
});
updatePostTaskSubmitState();
updateEditTaskSubmitState();
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closePostTaskModal(); closeTaskSettings(); closeEditTaskInfo();
        closeManualStatus(); closeRemoveTaskConfirm(); closeTaskDetails();
    }
});
const logoutBtn = document.querySelector(".logout");
if (logoutBtn) logoutBtn.addEventListener("click", () => {
    showConfirmation("Are you sure you want to log out?", () => { window.location.href = "../../auth/log-sign.html"; }, { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" });
});
const loadAndDisplayProjectName = () => {
    const projectName = localStorage.getItem("hive_selected_project_name");
    const projectNameDisplay = document.querySelector(".project-name-display h2");
    if (projectName && projectNameDisplay) projectNameDisplay.textContent = projectName;
};
loadAndDisplayProjectName();
renderAllTasks();
