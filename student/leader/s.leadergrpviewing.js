const topBackBtn = document.querySelector("#topBackBtn");
const backBtn = document.querySelector("#backBtn");
const projectBreakdownTab = document.querySelector("#projectBreakdownTab");
const openAddMembersModalBtn = document.querySelector("#openAddMembersModalBtn");
const addMembersModalOverlay = document.querySelector("#addMembersModalOverlay");
const discardAddMembersBtn = document.querySelector("#discardAddMembersBtn");
const copyGroupLinkBtn = document.querySelector("#copyGroupLinkBtn");
const groupLinkValue = document.querySelector("#groupLinkValue");
const openRemoveMembersModalBtn = document.querySelector("#openRemoveMembersModalBtn");
const removeMembersModalOverlay = document.querySelector("#removeMembersModalOverlay");
const removeMembersList = document.querySelector("#removeMembersList");
const discardRemoveMembersBtn = document.querySelector("#discardRemoveMembersBtn");
const removeMembersBtn = document.querySelector("#removeMembersBtn");

const STORAGE_KEY_LEADER_GROUP = "hive_leader_group";

const defaultLeaderGroupData = () => ({
    groupName: "Group Name",
    subject: "Subject",
    stats: { teacher: 0, members: 3, projects: 1 },
    leader: { name: "Person 1", role: "Leader", email: "Email", totalTasks: 5, completed: 3, pending: 2, missed: 0 },
    members: [
        { name: "Person 2", role: "Member", email: "Email", totalTasks: 5, completed: 3, pending: 2, missed: 0 },
        { name: "Person 3", role: "Member", email: "Email", totalTasks: 5, completed: 3, pending: 2, missed: 0 }
    ]
});

const loadLeaderGroupData = () => {
    const saved = localStorage.getItem(STORAGE_KEY_LEADER_GROUP);
    return saved ? JSON.parse(saved) : defaultLeaderGroupData();
};

const saveLeaderGroupData = (data) => {
    localStorage.setItem(STORAGE_KEY_LEADER_GROUP, JSON.stringify(data));
};

const getProjectsCount = () => {
    const saved = localStorage.getItem("hive_leader_projects");
    if (!saved) return 0;
    try {
        const projects = JSON.parse(saved);
        return Array.isArray(projects) ? projects.length : 0;
    } catch {
        return 0;
    }
};

const applyLeaderGroupData = (data) => {
    const groupLabelH2 = document.querySelector(".group-label h2");
    const groupLabelP = document.querySelector(".group-label p");
    if (groupLabelH2) groupLabelH2.textContent = data.groupName;
    if (groupLabelP) groupLabelP.textContent = data.subject;

    const summaryH3s = document.querySelectorAll(".summary-card h3");
    if (summaryH3s[0]) summaryH3s[0].textContent = data.stats.teacher;
    if (summaryH3s[1]) summaryH3s[1].textContent = data.stats.members;
    if (summaryH3s[2]) summaryH3s[2].textContent = getProjectsCount();

    const leaderCard = document.querySelector(".leader-card .member-details");
    if (leaderCard) {
        const info = leaderCard.querySelector(".member-info");
        const stats = leaderCard.querySelector(".stats");
        if (info) {
            const ps = info.querySelectorAll("p");
            info.querySelector("h3").textContent = data.leader.name;
            if (ps[0]) ps[0].textContent = data.leader.role;
            if (ps[1]) ps[1].textContent = data.leader.email;
        }
        if (stats) {
            const ps = stats.querySelectorAll("p");
            if (ps[0]) ps[0].textContent = `Total Tasks: ${data.leader.totalTasks}`;
            if (ps[1]) ps[1].textContent = `Completed: ${data.leader.completed}`;
            if (ps[2]) ps[2].textContent = `Pending: ${data.leader.pending}`;
            if (ps[3]) ps[3].textContent = `Missed: ${data.leader.missed}`;
        }
    }

    const memberCards = document.querySelectorAll(".member-card .member-details");
    data.members.forEach((member, i) => {
        const card = memberCards[i];
        if (!card) return;
        const info = card.querySelector(".member-info");
        const stats = card.querySelector(".stats");
        if (info) {
            const ps = info.querySelectorAll("p");
            info.querySelector("h3").textContent = member.name;
            if (ps[0]) ps[0].textContent = member.role;
            if (ps[1]) ps[1].textContent = member.email;
        }
        if (stats) {
            const ps = stats.querySelectorAll("p");
            if (ps[0]) ps[0].textContent = `Total Tasks: ${member.totalTasks}`;
            if (ps[1]) ps[1].textContent = `Completed: ${member.completed}`;
            if (ps[2]) ps[2].textContent = `Pending: ${member.pending}`;
            if (ps[3]) ps[3].textContent = `Missed: ${member.missed}`;
        }
    });
};

const getGroupLink = () => {
    const saved = loadLeaderGroupData();
    const groupName = (saved.groupName || "group").trim().toLowerCase().replace(/\s+/g, "-");
    return `https://hive.app/group/${groupName}`;
};

const closeAddMembersModal = () => {
    if (!addMembersModalOverlay) {
        return;
    }

    addMembersModalOverlay.classList.remove("open");
    addMembersModalOverlay.setAttribute("aria-hidden", "true");
};

const openAddMembersModal = () => {
    if (!addMembersModalOverlay) {
        return;
    }

    if (groupLinkValue) {
        groupLinkValue.value = getGroupLink();
    }

    addMembersModalOverlay.classList.add("open");
    addMembersModalOverlay.setAttribute("aria-hidden", "false");
};

const updateRemoveMembersBtnState = () => {
    if (!removeMembersBtn || !removeMembersList) {
        return;
    }

    const selectedCount = removeMembersList.querySelectorAll("input[type='checkbox']:checked").length;
    removeMembersBtn.disabled = selectedCount === 0;
};

const renderRemoveMembersList = () => {
    if (!removeMembersList) {
        return;
    }

    const data = loadLeaderGroupData();
    const removableMembers = (data.members || []).filter((member) => {
        const role = (member.role || "").trim().toLowerCase();
        return role !== "leader" && role !== "teacher" && role !== "professor";
    });

    if (removableMembers.length === 0) {
        removeMembersList.innerHTML = "<p class='remove-members-empty'>No removable members found.</p>";
        if (removeMembersBtn) {
            removeMembersBtn.disabled = true;
        }
        return;
    }

    removeMembersList.innerHTML = removableMembers
        .map(
            (member) =>
                `<label class="remove-member-item"><input type="checkbox" value="${member.name}"><span>${member.name}</span></label>`
        )
        .join("");

    removeMembersList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
        checkbox.addEventListener("change", updateRemoveMembersBtnState);
    });

    updateRemoveMembersBtnState();
};

const closeRemoveMembersModal = () => {
    if (!removeMembersModalOverlay) {
        return;
    }

    removeMembersModalOverlay.classList.remove("open");
    removeMembersModalOverlay.setAttribute("aria-hidden", "true");
};

const openRemoveMembersModal = () => {
    if (!removeMembersModalOverlay) {
        return;
    }

    renderRemoveMembersList();
    removeMembersModalOverlay.classList.add("open");
    removeMembersModalOverlay.setAttribute("aria-hidden", "false");
};

if (openRemoveMembersModalBtn) {
    openRemoveMembersModalBtn.addEventListener("click", openRemoveMembersModal);
}

if (discardRemoveMembersBtn) {
    discardRemoveMembersBtn.addEventListener("click", closeRemoveMembersModal);
}

if (removeMembersModalOverlay) {
    removeMembersModalOverlay.addEventListener("click", (event) => {
        if (event.target === removeMembersModalOverlay) {
            closeRemoveMembersModal();
        }
    });
}

if (removeMembersBtn) {
    removeMembersBtn.addEventListener("click", () => {
        if (!removeMembersList) {
            return;
        }

        const selectedNames = Array.from(
            removeMembersList.querySelectorAll("input[type='checkbox']:checked")
        ).map((input) => input.value);

        if (selectedNames.length === 0) {
            return;
        }

        const data = loadLeaderGroupData();
        data.members = (data.members || []).filter((member) => !selectedNames.includes(member.name));
        data.stats.members = data.members.length + 1;

        saveLeaderGroupData(data);
        applyLeaderGroupData(data);
        closeRemoveMembersModal();
    });
}

applyLeaderGroupData(loadLeaderGroupData());

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "../s.dashb.html";
    });
}

if (backBtn) {
    backBtn.addEventListener("click", () => {
        window.location.href = "../s.dashb.html";
    });
}

if (projectBreakdownTab) {
    projectBreakdownTab.addEventListener("click", () => {
        window.location.href = "s.leadercategory.html";
    });
}

if (openAddMembersModalBtn) {
    openAddMembersModalBtn.addEventListener("click", openAddMembersModal);
}

if (discardAddMembersBtn) {
    discardAddMembersBtn.addEventListener("click", closeAddMembersModal);
}

if (addMembersModalOverlay) {
    addMembersModalOverlay.addEventListener("click", (event) => {
        if (event.target === addMembersModalOverlay) {
            closeAddMembersModal();
        }
    });
}

if (copyGroupLinkBtn) {
    copyGroupLinkBtn.addEventListener("click", async () => {
        if (!groupLinkValue) {
            return;
        }

        const link = groupLinkValue.value;
        if (!link) {
            return;
        }

        try {
            await navigator.clipboard.writeText(link);
            copyGroupLinkBtn.textContent = "Copied";
            setTimeout(() => {
                copyGroupLinkBtn.textContent = "Copy";
            }, 1200);
        } catch {
            groupLinkValue.select();
            document.execCommand("copy");
            copyGroupLinkBtn.textContent = "Copied";
            setTimeout(() => {
                copyGroupLinkBtn.textContent = "Copy";
            }, 1200);
        }
    });
}