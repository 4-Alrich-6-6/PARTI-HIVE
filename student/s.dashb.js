const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector("#sidebar");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

const STORAGE_KEY_DASHB = "hive_dashboard";

const defaultDashbData = () => ({
    ownedGroup: { name: "Group Name", subject: "Subject", members: 3 },
    joinedGroup: { name: "Group Name", subject: "Subject", members: 3 },
    stats: { owned: 1, joined: 2, pending: 0 }
});

const loadDashbData = () => {
    const saved = localStorage.getItem(STORAGE_KEY_DASHB);
    return saved ? JSON.parse(saved) : defaultDashbData();
};

const saveDashbData = (data) => {
    localStorage.setItem(STORAGE_KEY_DASHB, JSON.stringify(data));
};

const applyDashbData = (data) => {
    const ownedCard = document.querySelector(".open-group-view");
    if (ownedCard) {
        const h3 = ownedCard.querySelector(".group-info h3");
        const p = ownedCard.querySelector(".group-info p");
        const strong = ownedCard.querySelector(".card-right strong");
        if (h3) h3.textContent = data.ownedGroup.name;
        if (p) p.textContent = data.ownedGroup.subject;
        if (strong) strong.textContent = `Occupied Members : ${data.ownedGroup.members}`;
    }

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
    if (statCards[0]) statCards[0].textContent = data.stats.owned;
    if (statCards[1]) statCards[1].textContent = data.stats.joined;
    if (statCards[2]) statCards[2].textContent = data.stats.pending;
};

const dashbData = loadDashbData();
applyDashbData(dashbData);

const addGroupModal = document.querySelector("#addGroupModal");
const openAddGroupModalBtn = document.querySelector("#openAddGroupModal");
const discardAddGroupBtn = document.querySelector("#discardAddGroup");
const createAddGroupBtn = document.querySelector("#createAddGroup");
const groupNameInput = document.querySelector("#groupNameInput");
const groupSubjectInput = document.querySelector("#groupSubjectInput");
const joinGroupModal = document.querySelector("#joinGroupModal");
const openJoinGroupModalBtn = document.querySelector("#openJoinGroupModal");
const discardJoinGroupBtn = document.querySelector("#discardJoinGroup");
const joinGroupBtn = document.querySelector("#joinGroupBtn");
const groupLinkInput = document.querySelector("#groupLinkInput");
const openEditOwnedGroupModalBtn = document.querySelector("#openEditOwnedGroupModal");
const editOwnedGroupModal = document.querySelector("#editOwnedGroupModal");
const discardEditOwnedGroupBtn = document.querySelector("#discardEditOwnedGroup");
const saveEditOwnedGroupBtn = document.querySelector("#saveEditOwnedGroup");
const editOwnedGroupNameInput = document.querySelector("#editOwnedGroupNameInput");
const editOwnedGroupSubjectInput = document.querySelector("#editOwnedGroupSubjectInput");

const updateAddGroupCreateState = () => {
    if (!createAddGroupBtn) {
        return;
    }

    const hasGroupName = groupNameInput && groupNameInput.value.trim().length > 0;
    const hasSubjectName = groupSubjectInput && groupSubjectInput.value.trim().length > 0;
    createAddGroupBtn.disabled = !(hasGroupName && hasSubjectName);
};

const updateJoinGroupState = () => {
    if (!joinGroupBtn) {
        return;
    }

    const hasGroupLink = groupLinkInput && groupLinkInput.value.trim().length > 0;
    joinGroupBtn.disabled = !hasGroupLink;
};

const updateEditOwnedGroupState = () => {
    if (!saveEditOwnedGroupBtn) {
        return;
    }

    const hasGroupName = editOwnedGroupNameInput && editOwnedGroupNameInput.value.trim().length > 0;
    const hasSubjectName = editOwnedGroupSubjectInput && editOwnedGroupSubjectInput.value.trim().length > 0;
    saveEditOwnedGroupBtn.disabled = !(hasGroupName && hasSubjectName);
};

const closeAddGroupModal = () => {
    if (!addGroupModal) {
        return;
    }

    addGroupModal.classList.remove("open");
    addGroupModal.setAttribute("aria-hidden", "true");
};

const openAddGroupModal = () => {
    if (!addGroupModal) {
        return;
    }

    addGroupModal.classList.add("open");
    addGroupModal.setAttribute("aria-hidden", "false");

    if (groupNameInput) {
        groupNameInput.value = "";
        groupNameInput.focus();
    }

    if (groupSubjectInput) {
        groupSubjectInput.value = "";
    }

    updateAddGroupCreateState();
};

if (openAddGroupModalBtn) {
    openAddGroupModalBtn.addEventListener("click", openAddGroupModal);
}

if (discardAddGroupBtn) {
    discardAddGroupBtn.addEventListener("click", closeAddGroupModal);
}

if (groupNameInput) {
    groupNameInput.addEventListener("input", updateAddGroupCreateState);
}

if (groupSubjectInput) {
    groupSubjectInput.addEventListener("input", updateAddGroupCreateState);
}

if (addGroupModal) {
    addGroupModal.addEventListener("click", (event) => {
        if (event.target === addGroupModal) {
            closeAddGroupModal();
        }
    });
}

if (createAddGroupBtn) {
    createAddGroupBtn.addEventListener("click", () => {
        const groupName = groupNameInput ? groupNameInput.value.trim() : "";
        const subjectName = groupSubjectInput ? groupSubjectInput.value.trim() : "";

        if (!groupName || !subjectName) {
            return;
        }

        dashbData.ownedGroup.name = groupName;
        dashbData.ownedGroup.subject = subjectName;
        dashbData.stats.owned += 1;

        saveDashbData(dashbData);
        applyDashbData(dashbData);
        closeAddGroupModal();
    });
}

const closeJoinGroupModal = () => {
    if (!joinGroupModal) {
        return;
    }

    joinGroupModal.classList.remove("open");
    joinGroupModal.setAttribute("aria-hidden", "true");
};

const openJoinGroupModal = () => {
    if (!joinGroupModal) {
        return;
    }

    joinGroupModal.classList.add("open");
    joinGroupModal.setAttribute("aria-hidden", "false");

    if (groupLinkInput) {
        groupLinkInput.value = "";
        groupLinkInput.focus();
    }

    updateJoinGroupState();
};

if (openJoinGroupModalBtn) {
    openJoinGroupModalBtn.addEventListener("click", openJoinGroupModal);
}

if (discardJoinGroupBtn) {
    discardJoinGroupBtn.addEventListener("click", closeJoinGroupModal);
}

if (groupLinkInput) {
    groupLinkInput.addEventListener("input", updateJoinGroupState);
}

const closeEditOwnedGroupModal = () => {
    if (!editOwnedGroupModal) {
        return;
    }

    editOwnedGroupModal.classList.remove("open");
    editOwnedGroupModal.setAttribute("aria-hidden", "true");
};

const openEditOwnedGroupModal = () => {
    if (!editOwnedGroupModal) {
        return;
    }

    if (editOwnedGroupNameInput) {
        editOwnedGroupNameInput.value = dashbData.ownedGroup.name;
    }

    if (editOwnedGroupSubjectInput) {
        editOwnedGroupSubjectInput.value = dashbData.ownedGroup.subject;
    }

    updateEditOwnedGroupState();
    editOwnedGroupModal.classList.add("open");
    editOwnedGroupModal.setAttribute("aria-hidden", "false");
};

if (openEditOwnedGroupModalBtn) {
    openEditOwnedGroupModalBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openEditOwnedGroupModal();
    });
}

if (discardEditOwnedGroupBtn) {
    discardEditOwnedGroupBtn.addEventListener("click", closeEditOwnedGroupModal);
}

if (editOwnedGroupNameInput) {
    editOwnedGroupNameInput.addEventListener("input", updateEditOwnedGroupState);
}

if (editOwnedGroupSubjectInput) {
    editOwnedGroupSubjectInput.addEventListener("input", updateEditOwnedGroupState);
}

if (editOwnedGroupModal) {
    editOwnedGroupModal.addEventListener("click", (event) => {
        if (event.target === editOwnedGroupModal) {
            closeEditOwnedGroupModal();
        }
    });
}

if (saveEditOwnedGroupBtn) {
    saveEditOwnedGroupBtn.addEventListener("click", () => {
        const groupName = editOwnedGroupNameInput ? editOwnedGroupNameInput.value.trim() : "";
        const subjectName = editOwnedGroupSubjectInput ? editOwnedGroupSubjectInput.value.trim() : "";

        if (!groupName || !subjectName) {
            return;
        }

        dashbData.ownedGroup.name = groupName;
        dashbData.ownedGroup.subject = subjectName;

        saveDashbData(dashbData);
        applyDashbData(dashbData);
        closeEditOwnedGroupModal();
    });
}

if (joinGroupModal) {
    joinGroupModal.addEventListener("click", (event) => {
        if (event.target === joinGroupModal) {
            closeJoinGroupModal();
        }
    });
}

if (joinGroupBtn) {
    joinGroupBtn.addEventListener("click", () => {
        const groupLink = groupLinkInput ? groupLinkInput.value.trim() : "";

        if (!groupLink) {
            return;
        }

        dashbData.joinedGroup.name = "Joined via Link";
        dashbData.joinedGroup.subject = groupLink;
        dashbData.stats.joined += 1;

        saveDashbData(dashbData);
        applyDashbData(dashbData);
        closeJoinGroupModal();
    });
}

updateAddGroupCreateState();
updateJoinGroupState();
updateEditOwnedGroupState();

const groupCardLink = document.querySelector(".open-group-view");

if (groupCardLink) {
    const openGroupView = () => {
        window.location.href = "leader/s.leadergrpviewing.html";
    };

    groupCardLink.addEventListener("click", openGroupView);
    groupCardLink.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openGroupView();
        }
    });
}

const memberGroupCardLink = document.querySelector(".open-member-group-view");

if (memberGroupCardLink) {
    const openMemberGroupView = () => {
        window.location.href = "member/s.membergrpviewing.html";
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
        window.location.href = "s.notification.html";
    });
});

const logoutBtn = document.querySelector(".logout");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        window.location.href = "../auth/log-sign.html";
    });
}
