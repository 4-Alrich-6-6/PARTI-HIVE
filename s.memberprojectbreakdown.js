const topBackBtn = document.querySelector("#topBackBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const taskCard1 = document.querySelector("#taskCard1");
const overlay = document.querySelector("#overlay");
const closePopupBtn = document.querySelector("#closePopupBtn");
const statusButtons = Array.from(document.querySelectorAll(".status-opt"));
const task1Badge = document.querySelector("#task1-badge");

const statusTextByKey = {
    inactive: "Not Active",
    active: "Active",
    verify: "Verifying",
    finished: "Finished",
    missing: "Missing"
};

let currentStatus = "inactive";

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "s.dashb.html";
    });
}

if (groupInfoTab) {
    groupInfoTab.addEventListener("click", () => {
        window.location.href = "s.membergrpviewing.html";
    });
}

if (taskCard1) {
    const openTaskModal = () => {
        if (!overlay) {
            return;
        }

        overlay.classList.add("open");
        statusButtons.forEach((button) => {
            const isSelected = button.dataset.status === currentStatus;
            button.classList.toggle("selected", isSelected);
        });
    };

    taskCard1.addEventListener("click", openTaskModal);

    // Make clicks on the button also open the modal
    const taskButton = taskCard1.querySelector(".task-status");
    if (taskButton) {
        taskButton.addEventListener("click", (event) => {
            event.stopPropagation();
            openTaskModal();
        });
    }
}

if (closePopupBtn && overlay) {
    closePopupBtn.addEventListener("click", () => {
        overlay.classList.remove("open");
    });
}

const logoutBtn = document.querySelector(".logout");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        window.location.href = "log-sign.html";
    });
}

if (overlay) {
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            overlay.classList.remove("open");
        }
    });
}

statusButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentStatus = button.dataset.status || "inactive";

        statusButtons.forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");

        if (task1Badge) {
            task1Badge.textContent = statusTextByKey[currentStatus] || statusTextByKey.inactive;
            task1Badge.className = `task-status ${currentStatus}`;
        }

        if (overlay) {
            setTimeout(() => {
                overlay.classList.remove("open");
            }, 280);
        }
    });
});
