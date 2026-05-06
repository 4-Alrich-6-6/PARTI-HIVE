const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector("#sidebar");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

const STORAGE_KEY_DASHB = "hive_dashboard";

const defaultDashbData = () => ({
    ownedGroups: [],
    joinedGroups: [],
    stats: { owned: 0, joined: 0, pending: 0 }
});

const loadDashbData = () => {
    const saved = localStorage.getItem(STORAGE_KEY_DASHB);
    return saved ? JSON.parse(saved) : defaultDashbData();
};

const saveDashbData = (data) => {
    localStorage.setItem(STORAGE_KEY_DASHB, JSON.stringify(data));
};

const applyDashbData = (data) => {
    const ownedGroupsList = document.querySelector("#ownedGroupsList");
    const joinedGroupsList = document.querySelector("#joinedGroupsList");
    const statCards = document.querySelectorAll(".stat-card h3");

    // Helper to create a group card
    const createGroupCard = (group, isOwned) => {
        const card = document.createElement("article");
        card.className = "group-card " + (isOwned ? "open-group-view" : "open-member-group-view");
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.innerHTML = `
            <div class="group-info">
                <h3>${group.name}</h3>
                <p>${group.subject}</p>
            </div>
            <div class="card-right">
                <strong>Occupied Members : ${group.members}</strong>
                ${isOwned ? '<button class="more-btn" type="button" aria-label="Edit owned group">•••</button>' : ''}
            </div>
        `;
        card.addEventListener("click", () => {
            window.location.href = isOwned ? "leader/s.leadergrpviewing.html" : "member/s.membergrpviewing.html";
        });
        if (isOwned) {
            const moreBtn = card.querySelector(".more-btn");
            moreBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openEditOwnedGroupModal(group);
            });
        }
        return card;
    };

    // Render Owned Groups
    if (ownedGroupsList) {
        if (!data.ownedGroups || data.ownedGroups.length === 0) {
            ownedGroupsList.innerHTML = `
                <div class="empty-state">
                    <img src="../assets/AddGroup.png" class="empty-state-icon" alt="No groups">
                    <h3>No Owned Groups</h3>
                    <p>You haven't created any groups yet. Click "Add Groups" to get started!</p>
                </div>
            `;
        } else {
            ownedGroupsList.innerHTML = "";
            data.ownedGroups.forEach(group => {
                ownedGroupsList.appendChild(createGroupCard(group, true));
            });
        }
    }

    // Render Joined Groups
    if (joinedGroupsList) {
        if (!data.joinedGroups || data.joinedGroups.length === 0) {
            joinedGroupsList.innerHTML = `
                <div class="empty-state">
                    <img src="../assets/JoinGroup.png" class="empty-state-icon" alt="No groups">
                    <h3>No Joined Groups</h3>
                    <p>You haven't joined any groups yet. Use "Join Groups" with an invite link!</p>
                </div>
            `;
        } else {
            joinedGroupsList.innerHTML = "";
            data.joinedGroups.forEach(group => {
                joinedGroupsList.appendChild(createGroupCard(group, false));
            });
        }
    }

    if (statCards[0]) statCards[0].textContent = (data.ownedGroups || []).length;
    if (statCards[1]) statCards[1].textContent = (data.joinedGroups || []).length;
    if (statCards[2]) statCards[2].textContent = data.stats.pending || 0;
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
    if (!createAddGroupBtn) return;
    const hasGroupName = groupNameInput && groupNameInput.value.trim().length > 0;
    const hasSubjectName = groupSubjectInput && groupSubjectInput.value.trim().length > 0;
    createAddGroupBtn.disabled = !(hasGroupName && hasSubjectName);
};

const updateJoinGroupState = () => {
    if (!joinGroupBtn) return;
    const hasGroupLink = groupLinkInput && groupLinkInput.value.trim().length > 0;
    joinGroupBtn.disabled = !hasGroupLink;
};

const updateEditOwnedGroupState = () => {
    if (!saveEditOwnedGroupBtn) return;
    const hasGroupName = editOwnedGroupNameInput && editOwnedGroupNameInput.value.trim().length > 0;
    const hasSubjectName = editOwnedGroupSubjectInput && editOwnedGroupSubjectInput.value.trim().length > 0;
    saveEditOwnedGroupBtn.disabled = !(hasGroupName && hasSubjectName);
};

const closeAddGroupModal = () => {
    if (!addGroupModal) return;
    addGroupModal.classList.remove("open");
    addGroupModal.setAttribute("aria-hidden", "true");
};

const openAddGroupModal = () => {
    if (!addGroupModal) return;
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
        if (event.target === addGroupModal) closeAddGroupModal();
    });
}

if (createAddGroupBtn) {
    createAddGroupBtn.addEventListener("click", () => {
        const groupName = groupNameInput ? groupNameInput.value.trim() : "";
        const subjectName = groupSubjectInput ? groupSubjectInput.value.trim() : "";
        if (!groupName || !subjectName) return;
        showConfirmation(
            `Are you sure you want to create the group "${groupName}"?`,
            () => {
                const newGroup = {
                    name: groupName,
                    subject: subjectName,
                    members: 1
                };
                if (!dashbData.ownedGroups) dashbData.ownedGroups = [];
                dashbData.ownedGroups.push(newGroup);
                saveDashbData(dashbData);
                applyDashbData(dashbData);
                closeAddGroupModal();
            },
            { title: "Create Group", confirmText: "Create", cancelText: "Cancel" }
        );
    });
}

const closeJoinGroupModal = () => {
    if (!joinGroupModal) return;
    joinGroupModal.classList.remove("open");
    joinGroupModal.setAttribute("aria-hidden", "true");
};

const openJoinGroupModal = () => {
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
    openJoinGroupModalBtn.addEventListener("click", openJoinGroupModal);
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
                const newJoinedGroup = {
                    name: "Joined via Link",
                    subject: groupLink,
                    members: 4
                };
                if (!dashbData.joinedGroups) dashbData.joinedGroups = [];
                dashbData.joinedGroups.push(newJoinedGroup);
                saveDashbData(dashbData);
                applyDashbData(dashbData);
                closeJoinGroupModal();
            },
            { title: "Join Group", confirmText: "Join", cancelText: "Cancel" }
        );
    });
}

const closeEditOwnedGroupModal = () => {
    if (!editOwnedGroupModal) return;
    editOwnedGroupModal.classList.remove("open");
    editOwnedGroupModal.setAttribute("aria-hidden", "true");
};

const openEditOwnedGroupModal = (group) => {
    if (!editOwnedGroupModal) return;
    if (editOwnedGroupNameInput) {
        editOwnedGroupNameInput.value = group.name;
    }
    if (editOwnedGroupSubjectInput) {
        editOwnedGroupSubjectInput.value = group.subject;
    }
    editOwnedGroupModal.dataset.editingName = group.name;
    updateEditOwnedGroupState();
    editOwnedGroupModal.classList.add("open");
    editOwnedGroupModal.setAttribute("aria-hidden", "false");
};

if (openEditOwnedGroupModalBtn) {
    openEditOwnedGroupModalBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        if (dashbData.ownedGroups && dashbData.ownedGroups.length > 0) {
            openEditOwnedGroupModal(dashbData.ownedGroups[0]);
        }
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
        if (event.target === editOwnedGroupModal) closeEditOwnedGroupModal();
    });
}

if (saveEditOwnedGroupBtn) {
    saveEditOwnedGroupBtn.addEventListener("click", () => {
        const newName = editOwnedGroupNameInput ? editOwnedGroupNameInput.value.trim() : "";
        const newSubject = editOwnedGroupSubjectInput ? editOwnedGroupSubjectInput.value.trim() : "";
        const oldName = editOwnedGroupModal.dataset.editingName;
        if (!newName || !newSubject) return;
        showConfirmation(
            `Are you sure you want to save the changes to group "${newName}"?`,
            () => {
                const groupIndex = dashbData.ownedGroups.findIndex(g => g.name === oldName);
                if (groupIndex !== -1) {
                    dashbData.ownedGroups[groupIndex].name = newName;
                    dashbData.ownedGroups[groupIndex].subject = newSubject;
                    saveDashbData(dashbData);
                    applyDashbData(dashbData);
                }
                closeEditOwnedGroupModal();
            },
            { title: "Save Changes", confirmText: "Save", cancelText: "Cancel" }
        );
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
        showConfirmation(
            "Are you sure you want to log out?",
            () => {
                window.location.href = "../auth/log-sign.html";
            },
            { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
        );
    });
}