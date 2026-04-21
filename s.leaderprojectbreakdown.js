const topBackBtn = document.querySelector("#topBackBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const openPostTaskModalBtn = document.querySelector("#openPostTaskModalBtn");
const postTaskModalOverlay = document.querySelector("#postTaskModalOverlay");
const discardPostTaskBtn = document.querySelector("#discardPostTaskBtn");
const postTaskForm = document.querySelector("#postTaskForm");

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "s.dashb.html";
    });
}

if (groupInfoTab) {
    groupInfoTab.addEventListener("click", () => {
        window.location.href = "s.leadergrpviewing.html";
    });
}

const closePostTaskModal = () => {
    if (!postTaskModalOverlay) {
        return;
    }

    postTaskModalOverlay.classList.remove("open");
    postTaskModalOverlay.setAttribute("aria-hidden", "true");
};

if (openPostTaskModalBtn && postTaskModalOverlay) {
    openPostTaskModalBtn.addEventListener("click", () => {
        postTaskModalOverlay.classList.add("open");
        postTaskModalOverlay.setAttribute("aria-hidden", "false");
    });
}

if (discardPostTaskBtn) {
    discardPostTaskBtn.addEventListener("click", () => {
        if (postTaskForm) {
            postTaskForm.reset();
        }
        closePostTaskModal();
    });
}

if (postTaskModalOverlay) {
    postTaskModalOverlay.addEventListener("click", (event) => {
        if (event.target === postTaskModalOverlay) {
            closePostTaskModal();
        }
    });
}

if (postTaskForm) {
    postTaskForm.addEventListener("submit", (event) => {
        event.preventDefault();
        closePostTaskModal();
        postTaskForm.reset();
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closePostTaskModal();
    }
});

const logoutBtn = document.querySelector(".logout");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        window.location.href = "log-sign.html";
    });
}
