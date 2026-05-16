const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector("#sidebar");
const topBackBtn = document.querySelector("#topBackBtn");
const notifList = document.querySelector("#notifList");
const notifEmpty = document.querySelector("#notifEmpty");
const notifModalOverlay = document.querySelector("#notifModalOverlay");
const notifModalTitle = document.querySelector("#notifModalTitle");
const notifModalGroup = document.querySelector("#notifModalGroup");
const notifModalDate = document.querySelector("#notifModalDate");
const notifModalBody = document.querySelector("#notifModalBody");
const closeNotifModalBtn = document.querySelector("#closeNotifModalBtn");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

const openNotifModal = (notif) => {
    if (!notifModalOverlay) return;
    if (notifModalTitle) notifModalTitle.textContent = notif.title;
    if (notifModalGroup) notifModalGroup.textContent = notif.group || "";
    if (notifModalDate) notifModalDate.textContent = formatNotifDate(notif.date);
    if (notifModalBody) notifModalBody.textContent = notif.body || "";
    notifModalOverlay.classList.add("open");
    notifModalOverlay.setAttribute("aria-hidden", "false");
};

const closeNotifModal = () => {
    if (!notifModalOverlay) return;
    notifModalOverlay.classList.remove("open");
    notifModalOverlay.setAttribute("aria-hidden", "true");
};

const renderNotifications = () => {
    if (!notifList) return;
    notifList.innerHTML = "";

    const notifications = loadNotifications();
    if (!notifications.length) {
        if (notifEmpty) notifEmpty.hidden = false;
        return;
    }
    if (notifEmpty) notifEmpty.hidden = true;

    notifications.forEach((notif) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "notif-card";
        card.setAttribute("data-id", notif.id);
        card.innerHTML = `
            <div class="notif-top">
                <h3 class="notif-title"></h3>
                <span class="notif-date"></span>
            </div>
            <p class="notif-group"></p>
            <p class="notif-body"></p>
        `;
        card.querySelector(".notif-title").textContent = notif.title;
        card.querySelector(".notif-date").textContent = formatNotifDate(notif.date);
        card.querySelector(".notif-group").textContent = `From: ${notif.group || "—"}`;
        card.querySelector(".notif-body").textContent = truncateBody(notif.body, 120);

        card.addEventListener("click", () => openNotifModal(notif));
        notifList.appendChild(card);
    });
};

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "t.dashb.html";
    });
}

if (closeNotifModalBtn) {
    closeNotifModalBtn.addEventListener("click", closeNotifModal);
}

if (notifModalOverlay) {
    notifModalOverlay.addEventListener("click", (event) => {
        if (event.target === notifModalOverlay) closeNotifModal();
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNotifModal();
});

const logoutBtn = document.querySelector(".logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        showConfirmation(
            "Are you sure you want to log out?",
            () => {
                window.location.href = "../auth/log-sign.html";
            },
            { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
        );
    });
}

const supa = () => window.hiveSupabase;

const loadTeacherSidebarProfile = async () => {
    const supabase = supa();
    if (!supabase) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData, error } = await supabase
            .from("USER")
            .select("userDisplayName, userEmail, avatarPath")
            .eq("userId", user.id)
            .maybeSingle();

        if (error || !userData) return;

        const avatarImg = document.querySelector(".avatar-circle img");
        if (avatarImg && userData.avatarPath) {
            avatarImg.src = userData.avatarPath;
            avatarImg.style.objectFit = "cover";
        }

        const h3s = document.querySelectorAll(".profile-block h3");
        if (h3s[0]) h3s[0].textContent = userData.userDisplayName || "Name";
        if (h3s[1]) h3s[1].textContent = userData.userEmail || "Email";
    } catch (err) {
        console.error("Error loading teacher profile:", err);
    }
};

renderNotifications();
loadTeacherSidebarProfile();
