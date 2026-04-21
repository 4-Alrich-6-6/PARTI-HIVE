const topBackBtn = document.querySelector("#topBackBtn");
const backBtn = document.querySelector("#backBtn");
const projectBreakdownTab = document.querySelector("#projectBreakdownTab");

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "s.dashb.html";
    });
}

if (backBtn) {
    backBtn.addEventListener("click", () => {
        window.location.href = "s.dashb.html";
    });
}

if (projectBreakdownTab) {
    projectBreakdownTab.addEventListener("click", () => {
        window.location.href = "s.leaderprojectbreakdown.html";
    });
}