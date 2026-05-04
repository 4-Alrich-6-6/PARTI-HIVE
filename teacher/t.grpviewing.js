const topBackBtn = document.querySelector("#topBackBtn");
const backBtn = document.querySelector("#backBtn");
const projectBreakdownTab = document.querySelector("#projectBreakdownTab");

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

    const membersCount = (data.members ? data.members.length : 0) + (data.leader ? 1 : 0);
    const summaryH3s = document.querySelectorAll(".summary-card h3");
    if (summaryH3s[0]) summaryH3s[0].textContent = membersCount;
    if (summaryH3s[1]) summaryH3s[1].textContent = getProjectsCount();

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

applyLeaderGroupData(loadLeaderGroupData());

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "t.dashb.html";
    });
}

if (backBtn) {
    backBtn.addEventListener("click", () => {
        window.location.href = "t.dashb.html";
    });
}

if (projectBreakdownTab) {
    projectBreakdownTab.addEventListener("click", () => {
        window.location.href = "t.category.html";
    });
}

const logoutBtn = document.querySelector(".logout");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        window.location.href = "../auth/log-sign.html";
    });
}
