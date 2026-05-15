import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://rwijmgzxwyrktsjczpbp.supabase.co";
const supabaseKey = "sb_publishable_8zB-1PnnV7wK7WMkC8qgQA_UD0fFfEC";
const supabase = createClient(supabaseUrl, supabaseKey);

const topBackBtn = document.querySelector("#topBackBtn");
const projectBreakdownTab = document.querySelector("#projectBreakdownTab");

const STORAGE_KEY_LEADER_GROUP = "hive_leader_group";
const STORAGE_KEY_TASKS = "hive_leader_tasks";

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

const loadTasks = () => {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    try {
        const tasks = saved ? JSON.parse(saved) : [];
        return Array.isArray(tasks) ? tasks : [];
    } catch {
        return [];
    }
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const isLeaderAssignee = (assignee) => {
    const normalized = normalizeText(assignee);
    return normalized.includes("leader") || normalized.includes("for you");
};

const isTaskAssignedToPerson = (task, person) => {
    const assignees = Array.isArray(task.assignees) ? task.assignees : [];
    const assignmentName = normalizeText(person.assignmentName);
    const personName = normalizeText(person.name || person.fullName);
    const personRole = normalizeText(person.role || person.roleName);

    return assignees.some((assignee) => {
        const normalizedAssignee = normalizeText(assignee);
        if (personRole === "leader" && isLeaderAssignee(normalizedAssignee)) return true;
        if (assignmentName && normalizedAssignee === assignmentName) return true;
        return personName && normalizedAssignee === personName;
    });
};

const calculateTaskStats = (person) => {
    const tasks = loadTasks().filter((task) => isTaskAssignedToPerson(task, person));
    const completed = tasks.filter((task) => normalizeText(task.status) === "finished").length;
    const missed = tasks.filter((task) => normalizeText(task.status) === "missing").length;

    return {
        totalTasks: tasks.length,
        completed,
        pending: Math.max(tasks.length - completed - missed, 0),
        missed
    };
};

const getGroupId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("grpId") || localStorage.getItem("grpId") || 1;
};

const getMemberStat = (member, keys) => {
    const key = keys.find((candidate) => member[candidate] !== undefined && member[candidate] !== null);
    return key ? member[key] : 0;
};

const getDashboardProjectsCount = (data) => {
    const supabaseCount = Number(data?.totalProjects ?? 0);
    const localCount = getProjectsCount();
    return supabaseCount > 0 ? supabaseCount : localCount;
};

const createMemberCard = (member, cardClass, avatarSize) => {
    const totalTasks = getMemberStat(member, ["totalTasks", "total_tasks"]);
    const completedTasks = getMemberStat(member, ["completedTasks", "completed", "completed_tasks"]);
    const pendingTasks = getMemberStat(member, ["pendingTasks", "pending", "pending_tasks"]);
    const missedTasks = getMemberStat(member, ["missedTasks", "missed", "missed_tasks"]);

    return `
        <article class="info-card ${cardClass}">
            <div class="circle-avatar ${avatarSize}"></div>
            <div class="member-details">
                <div class="member-info">
                    <h3>${member.fullName || member.name || "No Name"}</h3>
                    <p>${member.roleName || member.role || "Member"}</p>
                    <p>${member.email || "No email"}</p>
                </div>
                <div class="stats">
                    <p>Total Tasks: ${totalTasks}</p>
                    <p>Completed: ${completedTasks}</p>
                    <p>Pending: ${pendingTasks}</p>
                    <p>Missed: ${missedTasks}</p>
                </div>
            </div>
        </article>
    `;
};

const renderGroupMembers = (members) => {
    const container = document.querySelector("#groupInfoStack");
    if (!container) return;

    const teacher = members.find((member) => normalizeText(member.roleName || member.role) === "teacher");
    const leader = members.find((member) => normalizeText(member.roleName || member.role) === "leader");
    const normalMembers = members.filter((member) => {
        const role = normalizeText(member.roleName || member.role);
        return role !== "teacher" && role !== "leader";
    });

    container.innerHTML = `
        <article class="info-card teacher-card">
            <div class="circle-avatar small"></div>
            <h3>${teacher ? `${teacher.fullName || teacher.name || "Teacher"}<br><small>${teacher.email || "No email"}</small>` : "You currently have no teacher"}</h3>
        </article>

        ${
            leader
                ? createMemberCard(leader, "leader-card", "large")
                : `<article class="info-card leader-card"><h3>No leader found</h3></article>`
        }

        <div class="member-grid">
            ${normalMembers.map((member) => createMemberCard(member, "member-card", "medium")).join("")}
        </div>
    `;
};

const loadDashboardStats = async () => {
    const grpId = getGroupId();

    const { data, error } = await supabase
        .from("DASHBOARD_STATS")
        .select("*")
        .eq("grpId", grpId)
        .single();

    if (error) {
        console.error("Error loading group info:", error);
        applyGroupData(loadGroupData());
        return;
    }

    const groupLabelH2 = document.querySelector(".group-label h2");
    const groupLabelP = document.querySelector(".group-label p");
    if (groupLabelH2) groupLabelH2.textContent = data.grpName || "Group Name";
    if (groupLabelP) groupLabelP.textContent = data.subjectName || data.subject || "Subject";

    const summaryH3s = document.querySelectorAll(".summary-card h3");
    if (summaryH3s[0]) summaryH3s[0].textContent = data.totalTeachers ?? 0;
    if (summaryH3s[1]) summaryH3s[1].textContent = data.totalMembers ?? 0;
    if (summaryH3s[2]) summaryH3s[2].textContent = getDashboardProjectsCount(data);

    renderGroupMembers(data.members || []);
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
            const taskStats = calculateTaskStats(data.leader);
            if (ps[0]) ps[0].textContent = `Total Tasks: ${taskStats.totalTasks}`;
            if (ps[1]) ps[1].textContent = `Completed: ${taskStats.completed}`;
            if (ps[2]) ps[2].textContent = `Pending: ${taskStats.pending}`;
            if (ps[3]) ps[3].textContent = `Missed: ${taskStats.missed}`;
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
            const taskStats = calculateTaskStats(member);
            if (ps[0]) ps[0].textContent = `Total Tasks: ${taskStats.totalTasks}`;
            if (ps[1]) ps[1].textContent = `Completed: ${taskStats.completed}`;
            if (ps[2]) ps[2].textContent = `Pending: ${taskStats.pending}`;
            if (ps[3]) ps[3].textContent = `Missed: ${taskStats.missed}`;
        }
    });
};

loadDashboardStats();

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
