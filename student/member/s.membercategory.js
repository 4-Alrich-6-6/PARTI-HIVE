const topBackBtn = document.querySelector("#topBackBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const categoryMainButtons = Array.from(document.querySelectorAll(".category-main-btn"));

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "../s.dashb.html";
    });
}

if (groupInfoTab) {
    groupInfoTab.addEventListener("click", () => {
        window.location.href = "s.membergrpviewing.html";
    });
}

const navigateToMemberBreakdown = (projectKey, projectName) => {
    if (projectKey) {
        localStorage.setItem("hive_selected_project", projectKey);
    }
    if (projectName) {
        localStorage.setItem("hive_selected_project_name", projectName);
    }
    window.location.href = "s.memberprojectbreakdown.html";
};

categoryMainButtons.forEach((categoryMainButton) => {
    categoryMainButton.addEventListener("click", () => {
        const projectKey = categoryMainButton.dataset.category;
        const projectName = categoryMainButton.querySelector(".category-name")?.textContent || projectKey;
        navigateToMemberBreakdown(projectKey, projectName);
    });
});

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