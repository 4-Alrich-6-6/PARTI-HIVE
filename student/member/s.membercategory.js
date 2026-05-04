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

categoryMainButtons.forEach((categoryMainButton) => {
    categoryMainButton.addEventListener("click", () => {
        window.location.href = "s.memberprojectbreakdown.html";
    });
});
