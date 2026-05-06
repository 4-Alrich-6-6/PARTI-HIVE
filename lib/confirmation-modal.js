// Reusable Confirmation Modal Component
// Usage: showConfirmation(message, onConfirm, options)
// options: { title: string, confirmText: string, cancelText: string }

const showConfirmation = (message, onConfirm, options = {}) => {
    const {
        title = "Confirm Action",
        confirmText = "Confirm",
        cancelText = "Cancel"
    } = options;

    // Check if modal already exists
    let modal = document.querySelector("#confirmationModalOverlay");
    
    if (!modal) {
        // Create modal if it doesn't exist
        modal = document.createElement("div");
        modal.id = "confirmationModalOverlay";
        modal.className = "modal-overlay";
        modal.setAttribute("aria-hidden", "true");
        modal.style.zIndex = "3000"; // Ensure it's above other modals like Manage Profile (z-index 2000)
        modal.innerHTML = `
            <div class="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmationModalTitle">
                <div class="confirmation-modal-header">
                    <h2 id="confirmationModalTitle">${title}</h2>
                </div>
                <div class="confirmation-modal-body">
                    <p class="confirmation-message">${message}</p>
                </div>
                <div class="confirmation-modal-actions">
                    <button type="button" class="modal-btn discard-btn" id="confirmationCancelBtn">${cancelText}</button>
                    <button type="button" class="modal-btn post-btn" id="confirmationConfirmBtn">${confirmText}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        // Update existing modal content
        const titleEl = modal.querySelector("#confirmationModalTitle");
        const messageEl = modal.querySelector(".confirmation-message");
        const cancelBtn = modal.querySelector("#confirmationCancelBtn");
        const confirmBtn = modal.querySelector("#confirmationConfirmBtn");
        
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        if (cancelBtn) cancelBtn.textContent = cancelText;
        if (confirmBtn) confirmBtn.textContent = confirmText;
    }

    const cancelBtn = modal.querySelector("#confirmationCancelBtn");
    const confirmBtn = modal.querySelector("#confirmationConfirmBtn");

    const closeModal = () => {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        // Remove event listeners to prevent memory leaks
        if (cancelBtn) {
            cancelBtn.removeEventListener("click", closeModal);
        }
        if (confirmBtn) {
            confirmBtn.removeEventListener("click", handleConfirm);
        }
    };

    const handleConfirm = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };

    // Add event listeners
    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeModal);
    }
    if (confirmBtn) {
        confirmBtn.addEventListener("click", handleConfirm);
    }

    // Close on overlay click
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    }, { once: true });

    // Show modal
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
};
