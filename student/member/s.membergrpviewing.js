const topBackBtn = document.querySelector("#topBackBtn");
const projectBreakdownTab = document.querySelector("#projectBreakdownTab");

const STORAGE_KEY_LEADER_GROUP = "hive_leader_group";

const defaultGroupData = () => ({
    groupName: "Group Name",
    subject: "Subject",
    stats: { teacher: 0, members: 3, projects: 1 },
    leader: { name: "Person 1", role: "Leader", email: "Email", totalTasks: 5, completed: 3, pending: 2, missed: 0 },
    members: [
        { name: "Person 2", role: "Member", email: "Email", totalTasks: 5, completed: 3, pending: 2, missed: 0 },
        { name: "Person 3", role: "Member", email: "Email", totalTasks: 5, completed: 3, pending: 2, missed: 0 }
    ]
});

const loadGroupData = () => {
    const saved = localStorage.getItem(STORAGE_KEY_LEADER_GROUP);
    return saved ? JSON.parse(saved) : defaultGroupData();
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

const applyGroupData = (data) => {
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

applyGroupData(loadGroupData());

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "../s.dashb.html";
    });
}

if (projectBreakdownTab) {
    projectBreakdownTab.addEventListener("click", () => {
        window.location.href = "s.membercategory.html";
    });
}

const logoutBtn = document.querySelector(".logout");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        showConfirmation(
            "Are you sure you want to log out?",
            () => {
                window.location.href = "../../auth/log-sign.html";
            },
            { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
        );
    });
}

const leaveBtn = document.querySelector(".leave-btn");

if (leaveBtn) {
    leaveBtn.addEventListener("click", () => {
        showConfirmation(
            "Are you sure you want to ask to leave this group?",
            () => {
                // Add leave group logic here
                alert("Leave request sent to leader.");
            },
            { title: "Ask to Leave", confirmText: "Ask to Leave", cancelText: "Cancel" }
        );
    });
}
