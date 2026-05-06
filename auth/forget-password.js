const backLink = document.querySelector("#backLink");
const step1Form = document.querySelector("#step1Form");
const step2Form = document.querySelector("#step2Form");
const sendOtpBtn = document.querySelector("#sendOtpBtn");
const emailInput = document.querySelector("#email");

// Ensure back button is visible on load
if (backLink) {
    backLink.style.display = "flex";
}

let cooldownInterval = null;

const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("hive_reset_otp", otp);
    localStorage.setItem("reset_otp_timestamp", Date.now().toString());
    localStorage.setItem("reset_email", emailInput.value);
    return otp;
};

const startCooldown = () => {
    let secondsLeft = 60;
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = `Resend (${secondsLeft}s)`;
    
    if (cooldownInterval) clearInterval(cooldownInterval);
    
    cooldownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            clearInterval(cooldownInterval);
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = "Resend";
        } else {
            sendOtpBtn.textContent = `Resend (${secondsLeft}s)`;
        }
    }, 1000);
};

if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", () => {
        if (!emailInput || !emailInput.value) {
            alert("Please enter your email first.");
            emailInput.focus();
            return;
        }
        
        const otp = generateOTP();
        alert(`OTP sent to ${emailInput.value}\n\nYour OTP is: ${otp}\n\n(In a real application, this would be sent to your email)`);
        startCooldown();
    });
}

if (step1Form) {
    step1Form.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const otpInput = document.querySelector("#otp");
        const storedOTP = localStorage.getItem("hive_reset_otp");
        
        if (!otpInput || !storedOTP) {
            alert("Please send an OTP first.");
            return;
        }
        
        if (otpInput.value !== storedOTP) {
            alert("Invalid OTP. Please try again.");
            otpInput.value = "";
            otpInput.focus();
            return;
        }
        
        localStorage.removeItem("hive_reset_otp");
        localStorage.removeItem("reset_otp_timestamp");
        
        step1Form.style.display = "none";
        step2Form.style.display = "block";
        
        if (backLink) {
            backLink.style.display = "none";
        }
        
        document.querySelector(".form-description p").textContent = "Enter your new password...";
    });
}

if (step2Form) {
    step2Form.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const newPass = document.querySelector("#newPass");
        const confirmPass = document.querySelector("#confirmPass");
        
        if (newPass && confirmPass && newPass.value !== confirmPass.value) {
            alert("Passwords do not match. Please try again.");
            confirmPass.value = "";
            confirmPass.focus();
            return;
        }
        
        localStorage.removeItem("reset_email");
        
        alert("Password reset successful! Please log in with your new password.");
        window.location.href = "log-sign.html";
    });
}

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

if (backLink) {
    backLink.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = "log-sign.html";
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
