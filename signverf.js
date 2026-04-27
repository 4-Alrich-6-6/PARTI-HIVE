const verifyForm = document.querySelector(".lForm");
const verifyBackLink = document.querySelector("#verifyBackLink");

if (verifyForm) {
    verifyForm.addEventListener("submit", (event) => {
        event.preventDefault();
        window.location.href = "profiling.html";
    });
}

if (verifyBackLink) {
    verifyBackLink.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = "log-sign.html?mode=signup";
    });
}
