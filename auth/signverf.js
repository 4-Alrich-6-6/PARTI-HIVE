const verifyForm = document.querySelector(".lForm");
const verifyBackLink = document.querySelector("#verifyBackLink");

if (verifyForm) {
    verifyForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const otpInput = document.querySelector("#otp");
        const storedOTP = localStorage.getItem("hive_otp");
        
        if (!otpInput || !storedOTP) {
            alert("OTP expired or not found. Please sign up again.");
            window.location.href = "log-sign.html?mode=signup";
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
