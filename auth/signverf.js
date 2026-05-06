const verifyForm = document.querySelector(".lForm");
const verifyBackLink = document.querySelector("#verifyBackLink");
const resendOtpBtn = document.querySelector("#resendOtpBtn");

let cooldownInterval = null;

const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("hive_otp", otp);
    localStorage.setItem("otp_timestamp", Date.now().toString());
    return otp;
};

const startCooldown = () => {
    let secondsLeft = 60;
    resendOtpBtn.disabled = true;
    resendOtpBtn.textContent = `Resend (${secondsLeft}s)`;
    
    if (cooldownInterval) clearInterval(cooldownInterval);
    
    cooldownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            clearInterval(cooldownInterval);
            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = "Resend";
        } else {
            resendOtpBtn.textContent = `Resend (${secondsLeft}s)`;
        }
    }, 1000);
};

if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", () => {
        const otp = generateOTP();
        alert(`Your OTP is: ${otp}\n\n(In a real application, this would be sent to your email)`);
        startCooldown();
    });
}

if (verifyForm) {
    verifyForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const otpInput = document.querySelector("#otp");
        const storedOTP = localStorage.getItem("hive_otp");
        
        if (!otpInput || !storedOTP) {
            alert("OTP expired or not found. Please click 'Send' to get a new one.");
            return;
        }
        
        if (otpInput.value !== storedOTP) {
            alert("Invalid OTP. Please try again.");
            otpInput.value = "";
            otpInput.focus();
            return;
        }
        
        localStorage.removeItem("hive_otp");
        localStorage.removeItem("otp_timestamp");
        
        window.location.href = "profiling.html";
    });
}

if (verifyBackLink) {
    verifyBackLink.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = "log-sign.html?mode=signup";
    });
}

// Start cooldown immediately on page load since OTP was sent upon redirection
if (resendOtpBtn) {
    startCooldown();
}

// Zoom Prevention
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
