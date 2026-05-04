const toggleButtons = document.querySelectorAll(".toggle-btn");
const loginForm = document.querySelector(".lForm");
const signUpForm = document.querySelector(".sForm");

const setMode = (targetMode) => {
    const isSignup = targetMode === "signup";

    toggleButtons.forEach((btn) => {
        const isActive = btn.dataset.target === (isSignup ? "signup" : "login");
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (!loginForm || !signUpForm) {
        return;
    }

    loginForm.classList.toggle("active", !isSignup);
    signUpForm.classList.toggle("active", isSignup);
};

const urlMode = new URLSearchParams(window.location.search).get("mode");
if (urlMode === "signup" || urlMode === "login") {
    setMode(urlMode);
}

toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setMode(button.dataset.target);
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
        window.location.href = "../student/s.dashb.html";
    });
}

if (signUpForm) {
    signUpForm.addEventListener("submit", (event) => {
        event.preventDefault();
        window.location.href = "signverf.html";
    });
}

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
