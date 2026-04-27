const backButton = document.querySelector(".back-button");
const saveButton = document.querySelector(".save-button button");

if (backButton) {
    backButton.addEventListener("click", () => {
        window.location.href = "profiling.html";
    });
}

if (saveButton) {
    saveButton.addEventListener("click", () => {
        window.location.href = "s.dashb.html";
    });
}
