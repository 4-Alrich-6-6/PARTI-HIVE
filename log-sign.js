const toggleButtons = document.querySelectorAll(".toggle-btn");
const loginForm = document.querySelector(".lForm");
const signUpForm = document.querySelector(".sForm");

toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const target = button.dataset.target;
        toggleButtons.forEach((btn) => {
            btn.classList.remove("active");
            btn.setAttribute("aria-selected", "false");
        });
        button.classList.add("active");
        button.setAttribute("aria-selected", "true");

        if (target === "signup") {
            loginForm.classList.remove("active");
            signUpForm.classList.add("active");
            return;
        }

        signUpForm.classList.remove("active");
        loginForm.classList.add("active");
    });
});

document.querySelectorAll(".toggle-password").forEach((toggle) => {
    toggle.addEventListener("click", () => {
        const input = toggle.previousElementSibling;
        if (!input || input.tagName !== "INPUT") {
            return;
        }

        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
    });
});

if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        window.location.href = "s.dashb.html";
    });
}

// Prevent browser zoom via keyboard, wheel, and gesture events.
const blockedZoomKeys = ["+", "-", "=", "_", "0"];

window.addEventListener(
    "wheel",
    (event) => {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
        }
    },
    { passive: false }
);

window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && blockedZoomKeys.includes(event.key)) {
        event.preventDefault();
    }
});

window.addEventListener("gesturestart", (event) => event.preventDefault());
window.addEventListener("gesturechange", (event) => event.preventDefault());
window.addEventListener("gestureend", (event) => event.preventDefault());
