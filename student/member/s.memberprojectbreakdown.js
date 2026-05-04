const topBackBtn = document.querySelector("#topBackBtn");
const backToCategoriesBtn = document.querySelector("#backToCategoriesBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const task1Badge = document.querySelector("#task1-badge");
const memberVerifyOverlay = document.querySelector("#memberVerifyOverlay");
const memberVerifyConfirmBtn = document.querySelector("#memberVerifyConfirmBtn");
const memberVerifyCancelBtn = document.querySelector("#memberVerifyCancelBtn");

const STORAGE_KEY_TASK_STATUS = "hive_member_task1_status";
const STORAGE_KEY_TASK_DUE = "hive_member_task1_due";

const STATUS_TEXT = {
    inactive: "Not Active",
    active: "Active",
    verifying: "Verifying",
    finished: "Finished",
    missing: "Missing"
};

const isTerminal = (s) => s === "finished" || s === "missing";

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
        setStatus("verifying");
        closeVerifyModal();
    });
}

if (memberVerifyCancelBtn) {
    memberVerifyCancelBtn.addEventListener("click", closeVerifyModal);
}

if (memberVerifyOverlay) {
    memberVerifyOverlay.addEventListener("click", (e) => {
        if (e.target === memberVerifyOverlay) closeVerifyModal();
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
        window.location.href = "../../auth/log-sign.html";
    });
}
