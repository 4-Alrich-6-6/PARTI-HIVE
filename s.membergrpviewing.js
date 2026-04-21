const topBackBtn = document.querySelector("#topBackBtn");
const projectBreakdownTab = document.querySelector("#projectBreakdownTab");

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "s.dashb.html";
    });
}

if (projectBreakdownTab) {
    projectBreakdownTab.addEventListener("click", () => {
        window.location.href = "s.memberprojectbreakdown.html";
    });
}
