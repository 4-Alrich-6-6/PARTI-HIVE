const topBackBtn = document.querySelector("#topBackBtn");
const backToCategoriesBtn = document.querySelector("#backToCategoriesBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const logoutBtn = document.querySelector(".logout");

const supa = () => window.hiveSupabase;

const getGrpId = () => 
    new URLSearchParams(window.location.search).get("grpId") ||
    sessionStorage.getItem("hive_grpId");

const getProjId = () => 
    new URLSearchParams(window.location.search).get("projId") ||
    sessionStorage.getItem("hive_selected_project");

const getCurrentUserId = async () => {
    const { data: { user } } = await supa().auth.getUser();
    return user?.id || null;
};

const STAT_SLUG = { 1: "inactive", 2: "active", 3: "pause", 4: "verifying", 5: "finished", 6: "missing" };
const STATUS_TEXT = { inactive: "Not Active", active: "Active", pause: "On Break", verifying: "Verifying", finished: "Finished", missing: "Missing" };

const isTerminal = (s) => s === "finished" || s === "missing";
const isPastDue = (t) => !(!t.dueDate || !t.dueTime) && Date.now() > new Date(`${t.dueDate}T${t.dueTime}`).getTime();

const formatTime12h = (t) => {
    if (!t) return "##:## AM";
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
};

const formatElapsedTime = (ms) => {
    const s = Math.floor((ms || 0) / 1000);
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
};

const loadTasks = async () => {
    const projId = getProjId();
    if (!projId) return [];
    const { data, error } = await supa()
        .from("TASK")
        .select("taskId, taskName, taskDesc, taskDueD, taskIntensity, taskPrio, taskResource, taskSpan, taskAcmD, statId, GROUPMEMBER(grpmemId, userId, USER(userDisplayName))")
        .eq("projId", Number(projId));
    if (error || !data) return [];
    return data.map(t => ({
        taskId: t.taskId,
        name: t.taskName,
        description: t.taskDesc || "",
        dueDate: t.taskDueD ? t.taskDueD.split("T")[0] : "",
        dueTime: t.taskDueD ? t.taskDueD.split("T")[1]?.slice(0, 5) : "",
        intensity: t.taskIntensity || "Light",
        priority: t.taskPrio || "Low",
        resources: t.taskResource || "",
        spanMs: intervalToMs(t.taskSpan),
        acmD: t.taskAcmD || null,
        status: STAT_SLUG[t.statId] || "inactive",
        statId: t.statId || 1,
        assignees: Object.values(
            (t.GROUPMEMBER || []).reduce((seen, m) => {
                if (!seen[m.userId]) seen[m.userId] = { grpmemId: m.grpmemId, userId: m.userId, name: m.USER?.userDisplayName || "Member" };
                return seen;
            }, {})
        )
    }));
};

const intervalToMs = (interval) => {
    if (!interval) return 0;
    const match = interval.match(/(?:(\d+) days? ?)?(\d+):(\d+):(\d+)/);
    if (match) {
        const days = parseInt(match[1] || 0);
        const h = parseInt(match[2]);
        const m = parseInt(match[3]);
        const s = parseInt(match[4]);
        return ((days * 86400) + (h * 3600) + (m * 60) + s) * 1000;
    }
    const secMatch = interval.match(/(\d+(?:\.\d+)?)\s*seconds?/);
    if (secMatch) return Math.floor(parseFloat(secMatch[1]) * 1000);
    return 0;
};

const getTotalElapsedMs = (task) => {
    let total = task.spanMs || 0;
    if ((task.status === "active") && task.acmD) {
        total += Date.now() - new Date(task.acmD).getTime();
    }
    return total;
};

const renderTask = async (task, idx, isOwnTask, target, currentUserId) => {
    if (!target) return;
    if (!isTerminal(task.status) && task.status !== "verifying" && isPastDue(task)) {
        task.status = "missing";
    }
    const assigneeNames = task.assignees.map(a => a.name).join(", ") || "None";
    const status = task.status || "inactive";
    const article = document.createElement("article");
    article.className = "task-card";
    const timeHtml = status === "active"
        ? `<span class="task-time-active" data-task-id="${task.taskId}" data-acm-d="${task.acmD || ""}" data-span-ms="${task.spanMs || 0}">${formatElapsedTime(getTotalElapsedMs(task))}</span>`
        : (task.spanMs > 0 ? `<span class="task-time-active">${formatElapsedTime(task.spanMs)}</span>` : "");
    article.innerHTML = `
        <div class="task-left">
            <h3>Task: ${task.name}</h3>
            <p>Assignee(s): <span class="assignee-info-wrap"><img class="assignee-info-icon" src="../../assets/Info.png" alt="Info"><span class="assignee-tooltip">${assigneeNames}</span></span> &nbsp; Due Date: ${formatTime12h(task.dueTime)} -- ${task.dueDate || "##/##/####"}</p>
            ${timeHtml}
        </div>
        <div class="task-actions">
            <button class="task-status ${status}" type="button" disabled>${STATUS_TEXT[status] || status}</button>
        </div>`;
    target.appendChild(article);
};

const renderAllTasks = async (currentUserId) => {
    const tasks = await loadTasks();
    const yl = document.querySelector("#yourTasksList");
    const ol = document.querySelector("#otherTasksList");
    if (yl) yl.innerHTML = "";
    if (ol) ol.innerHTML = "";
    let own = 0, other = 0, verify = 0;
    for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        const mine = t.assignees.some(a => a.userId === currentUserId);
        await renderTask(t, i, mine, mine ? yl : ol, currentUserId);
        if (mine) own++;
        else other++;
        if (t.status === "verifying") verify++;
    }
    if (yl && own === 0) yl.innerHTML = `<div class="empty-state"><img src="../../assets/Plus.png" class="empty-state-icon"><h3>No Tasks Assigned</h3><p>You have no personal tasks assigned to this project yet.</p></div>`;
    if (ol && other === 0) ol.innerHTML = `<div class="empty-state"><img src="../../assets/Plus.png" class="empty-state-icon"><h3>No Other Tasks</h3><p>There are no other tasks currently listed for this project.</p></div>`;
    const sc = document.querySelectorAll(".summary-card h3");
    if (sc[0]) sc[0].textContent = own;
    if (sc[1]) sc[1].textContent = other;
    if (sc[2]) sc[2].textContent = verify;
};

if (!window._globalTaskTicker) {
    window._globalTaskTicker = setInterval(() => {
        document.querySelectorAll(".task-time-active[data-task-id]").forEach(el => {
            const acmD = el.dataset.acmD;
            const spanMs = Number(el.dataset.spanMs || 0);
            if (!acmD) return;
            const total = spanMs + (Date.now() - new Date(acmD).getTime());
            el.textContent = formatElapsedTime(total);
        });
    }, 1000);
}

if (topBackBtn) {
    topBackBtn.addEventListener("click", () => {
        window.location.href = "../s.dashb.html";
    });
}

if (backToCategoriesBtn) {
    backToCategoriesBtn.addEventListener("click", () => {
        window.location.href = "s.membercategory.html";
    });
}

if (groupInfoTab) {
    groupInfoTab.addEventListener("click", () => {
        const grpId = getGrpId();
        window.location.href = grpId ? `s.membergrpviewing.html?grpId=${grpId}` : "s.membergrpviewing.html";
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        showConfirmation(
            "Are you sure you want to log out?",
            () => {
                window.location.href = "../../auth/log-sign.html";
            },
            {
                title: "Log Out",
                confirmText: "Log Out",
                cancelText: "Cancel",
            }
        );
    });
}

window.addEventListener("load", async () => {
    const currentUserId = await getCurrentUserId();
    await renderAllTasks(currentUserId);
});