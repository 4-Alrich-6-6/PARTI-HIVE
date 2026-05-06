const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector("#sidebar");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

const STORAGE_KEY_DASHB = "hive_teacher_dashboard";

const defaultDashbData = () => ({
    joinedGroup: { name: "Group Name", subject: "Subject", members: 3 },
    stats: { groups: 1 }
});

const loadDashbData = () => {
    const saved = localStorage.getItem(STORAGE_KEY_DASHB);
    return saved ? JSON.parse(saved) : defaultDashbData();
};

const saveDashbData = (data) => {
    localStorage.setItem(STORAGE_KEY_DASHB, JSON.stringify(data));
};

const applyDashbData = (data) => {
    const joinedCard = document.querySelector(".open-member-group-view");
    if (joinedCard) {
        const h3 = joinedCard.querySelector(".group-info h3");
        const p = joinedCard.querySelector(".group-info p");
        const strong = joinedCard.querySelector(".card-right strong");
        if (h3) h3.textContent = data.joinedGroup.name;
        if (p) p.textContent = data.joinedGroup.subject;
        if (strong) strong.textContent = `Occupied Members : ${data.joinedGroup.members}`;
    }
    const statCards = document.querySelectorAll(".stat-card h3");
    if (statCards[0]) statCards[0].textContent = data.stats.groups;
};

const dashbData = loadDashbData();
applyDashbData(dashbData);

const joinGroupModal = document.querySelector("#joinGroupModal");
const openJoinGroupModalBtn = document.querySelector("#openJoinGroupModal");
const discardJoinGroupBtn = document.querySelector("#discardJoinGroup");
const joinGroupBtn = document.querySelector("#joinGroupBtn");
const groupLinkInput = document.querySelector("#groupLinkInput");

const updateJoinGroupState = () => {
    if (!joinGroupBtn) return;
    const hasGroupLink = groupLinkInput && groupLinkInput.value.trim().length > 0;
    joinGroupBtn.disabled = !hasGroupLink;
};

const closeJoinGroupModal = () => {
    if (!joinGroupModal) return;
    joinGroupModal.classList.remove("open");
    joinGroupModal.setAttribute("aria-hidden", "true");
};

const openJoinGroupModalFn = () => {
    if (!joinGroupModal) return;
    joinGroupModal.classList.add("open");
    joinGroupModal.setAttribute("aria-hidden", "false");
    if (groupLinkInput) {
        groupLinkInput.value = "";
        groupLinkInput.focus();
    }
    updateJoinGroupState();
};

if (openJoinGroupModalBtn) {
    openJoinGroupModalBtn.addEventListener("click", openJoinGroupModalFn);
}

if (discardJoinGroupBtn) {
    discardJoinGroupBtn.addEventListener("click", closeJoinGroupModal);
}

if (groupLinkInput) {
    groupLinkInput.addEventListener("input", updateJoinGroupState);
}

if (joinGroupModal) {
    joinGroupModal.addEventListener("click", (event) => {
        if (event.target === joinGroupModal) closeJoinGroupModal();
    });
}

if (joinGroupBtn) {
    joinGroupBtn.addEventListener("click", () => {
        const groupLink = groupLinkInput ? groupLinkInput.value.trim() : "";
        if (!groupLink) return;
        showConfirmation(
            "Are you sure you want to join this group?",
            () => {
                dashbData.joinedGroup.name = "Joined via Link";
                dashbData.joinedGroup.subject = groupLink;
                dashbData.stats.groups += 1;
                saveDashbData(dashbData);
                applyDashbData(dashbData);
                closeJoinGroupModal();
            },
            { title: "Join Group", confirmText: "Join", cancelText: "Cancel" }
        );
    });
}

updateJoinGroupState();

const memberGroupCardLink = document.querySelector(".open-member-group-view");

if (memberGroupCardLink) {
    const openMemberGroupView = () => {
        window.location.href = "t.grpviewing.html";
    };
    memberGroupCardLink.addEventListener("click", openMemberGroupView);
    memberGroupCardLink.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMemberGroupView();
        }
    });
}

const notifBtns = document.querySelectorAll(".notif-btn, .notif-btn-mobile");
notifBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        window.location.href = "t.notification.html";
    });
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