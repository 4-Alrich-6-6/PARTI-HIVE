const backButton = document.querySelector(".back-button");

if (backButton) {
    backButton.addEventListener("click", () => {
        window.location.href = "profiling.html";
    });
}
