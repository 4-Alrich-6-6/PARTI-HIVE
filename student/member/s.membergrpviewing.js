/* ── Supabase accessor — lazy so it's never captured before supabaseClient.js runs ── */
const getSupabase = () => window.hiveSupabase;

/* ── ELEMENTS ─────────────────────────────────────────────────────────────── */
const topBackBtn          = document.querySelector("#topBackBtn");
const projectBreakdownTab = document.querySelector("#projectBreakdownTab");
const logoutBtn           = document.querySelector(".logout");
const leaveBtn            = document.querySelector(".leave-btn");

/* ── HELPERS ──────────────────────────────────────────────────────────────── */
const getGroupId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("grpId") || sessionStorage.getItem("hive_grpId") || null;
};

const normalizeText = (v) => String(v || "").trim().toLowerCase();

const escapeHTML = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[char]));

const shortenText = (value, max = 14) => {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const renderShortText = (value, max = 14) =>
  `<span title="${escapeHTML(value)}">${escapeHTML(shortenText(value, max))}</span>`;

const shortenName = (value, max = 8) => {
  const text = String(value || "");
  if (text.length <= max) return text;
  const firstWord = text.trim().split(/\s+/)[0] || text;
  return `${firstWord.slice(0, max).trim()}...`;
};

const renderShortName = (value, max = 8) =>
  `<span title="${escapeHTML(value)}">${escapeHTML(shortenName(value, max))}</span>`;

const shortenEmail = (email, max = 16) => {
  const value = String(email || "");
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const renderEmail = (email) => `<span title="${escapeHTML(email)}">${escapeHTML(shortenEmail(email))}</span>`;

const safeConfirm = (message, onConfirm, options = {}) => {
  if (typeof showConfirmation === "function") {
    showConfirmation(message, onConfirm, options);
    return;
  }
  if (confirm(message)) onConfirm();
};

const showNotice = (message, options = {}) => {
  const { title = "Notice", okText = "OK" } = options;
  let modal = document.querySelector("#memberNoticeModalOverlay");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "memberNoticeModalOverlay";
    modal.className = "modal-overlay";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="memberNoticeTitle">
        <div class="confirmation-modal-header">
          <h2 id="memberNoticeTitle"></h2>
        </div>
        <div class="confirmation-modal-body">
          <p class="confirmation-message"></p>
        </div>
        <div class="confirmation-modal-actions">
          <button type="button" class="modal-btn post-btn" id="memberNoticeOkBtn"></button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const titleEl = modal.querySelector("#memberNoticeTitle");
  const messageEl = modal.querySelector(".confirmation-message");
  const okBtn = modal.querySelector("#memberNoticeOkBtn");

  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (okBtn) okBtn.textContent = okText;

  const closeNotice = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    okBtn?.removeEventListener("click", closeNotice);
  };

  okBtn?.addEventListener("click", closeNotice);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
};

const roleRank = (roleName) => ({ teacher: 3, leader: 2, member: 1 }[normalizeText(roleName)] || 0);

const uniqueMembersByUser = (members) => {
  const byUser = new Map();
  members.forEach((member) => {
    const key = member.userId || member.grpmemId;
    const existing = byUser.get(key);
    if (!existing || roleRank(member.roleName) > roleRank(existing.roleName)) {
      byUser.set(key, member);
    }
  });
  return Array.from(byUser.values());
};

const getProjectCountForGroup = async (supabase, grpId, grp) => {
  const projectIds = new Set();

  if (grp?.progId) {
    const { data } = await supabase
      .from("PROJECT")
      .select("progId")
      .eq("progId", grp.progId);
    (data || []).forEach((project) => projectIds.add(project.progId));
  }

  const { data: taskLinks } = await supabase
    .from("GROUPMEMBER")
    .select("taskId")
    .eq("grpId", grpId)
    .not("taskId", "is", null);

  const taskIds = Array.from(new Set((taskLinks || []).map((row) => row.taskId).filter(Boolean)));
  if (taskIds.length) {
    const { data: tasks } = await supabase
      .from("TASK")
      .select("projId")
      .in("taskId", taskIds);
    (tasks || []).forEach((task) => {
      if (task.projId) projectIds.add(task.projId);
    });
  }

  return projectIds.size;
};

/* ── DB LOAD ──────────────────────────────────────────────────────────────── */
const loadGroupFromDB = async () => {
  const supabase = getSupabase();
  const grpId = getGroupId();
  if (!grpId || !supabase) return;

  // 1. Group info — also fetch progId so we can query PROJECT correctly
  const { data: grp, error: grpErr } = await supabase
    .from("GROUP")
    .select("grpName, grpSubject, progId")
    .eq("grpId", grpId)
    .maybeSingle();

  if (!grpErr && grp) {
    const h2 = document.querySelector(".group-label h2");
    const p  = document.querySelector(".group-label p");
    if (h2) h2.textContent = grp.grpName    || "Group Name";
    if (p)  p.textContent  = grp.grpSubject || "Subject";
  }

  // 2. Members (join USER and ROLE)
  const { data: members, error: memErr } = await supabase
    .from("GROUPMEMBER")
    .select("grpmemId, userId, roleId, ROLE(roleName), USER(userDisplayName, userEmail, avatarPath)")
    .eq("grpId", grpId);

  if (memErr || !members) {
    console.error("Error loading members:", memErr);
    return;
  }

  const allMemberRows = members.map((m) => ({
    grpmemId: m.grpmemId,
    userId:   m.userId,
    roleId:   m.roleId,
    roleName: m.ROLE?.roleName          || "Member",
    fullName: m.USER?.userDisplayName   || "Unknown",
    email:    m.USER?.userEmail         || "No email",
    avatarPath: m.USER?.avatarPath      || null,
  }));
  const allMembers = uniqueMembersByUser(allMemberRows);

  const projCount = await getProjectCountForGroup(supabase, grpId, grp);

  // 4. Summary cards
  const teachers   = allMembers.filter((m) => normalizeText(m.roleName) === "teacher");
  const nonTeacher = allMembers.filter((m) => normalizeText(m.roleName) !== "teacher");
  const summaryH3s = document.querySelectorAll(".summary-card h3");
  if (summaryH3s[0]) summaryH3s[0].textContent = teachers.length;
  if (summaryH3s[1]) summaryH3s[1].textContent = nonTeacher.length;
  if (summaryH3s[2]) summaryH3s[2].textContent = projCount;

  // 5. Render member cards
  await renderGroupMembers(allMembers);
};

/* ── FETCH MEMBER TASK STATS ──────────────────────────────────────────────── */
const getMemberTaskStats = async (member) => {
  const supabase = getSupabase();
  const grpId = getGroupId();
  if (!supabase || !grpId) return { total: 0, completed: 0, pending: 0, missed: 0 };

  try {
    // Get all taskIds for this member in this specific group
    const { data: memberTasks } = await supabase
      .from("GROUPMEMBER")
      .select("taskId")
      .eq("userId", member.userId)
      .eq("grpId", grpId)
      .not("taskId", "is", null);

    if (!memberTasks || memberTasks.length === 0) {
      return { total: 0, completed: 0, pending: 0, missed: 0 };
    }

    const taskIds = Array.from(new Set(memberTasks.map(mt => mt.taskId).filter(Boolean)));

    // Get full task details
    const { data: tasks } = await supabase
      .from("TASK")
      .select("taskId, statId, taskDueD, taskAcmD")
      .in("taskId", taskIds);

    if (!tasks) {
      return { total: 0, completed: 0, pending: 0, missed: 0 };
    }

    const total = tasks.length;
    const today = new Date().toISOString().split("T")[0];
    
    // Completed = tasks with accomplished date (taskAcmD is not null)
    const completed = tasks.filter(t => t.taskAcmD !== null && t.taskAcmD !== undefined).length;
    
    // Pending = all tasks that are not yet finished (no accomplished date)
    const pending = tasks.filter(t => !t.taskAcmD).length;
    
    // Missed = overdue (taskDueD < today) and not completed (no taskAcmD)
    const missed = tasks.filter(t => {
      const isOverdue = t.taskDueD && t.taskDueD < today;
      const isNotCompleted = !t.taskAcmD;
      return isOverdue && isNotCompleted;
    }).length;

    return { total, completed, pending, missed };
  } catch (err) {
    console.error("Error fetching member task stats:", err);
    return { total: 0, completed: 0, pending: 0, missed: 0 };
  }
};

/* ── RENDER MEMBERS ───────────────────────────────────────────────────────── */
const createMemberCard = (member, cardClass, avatarSize) => {
  const nameLimit = cardClass.includes("leader-card") ? 18 : 8;
  const avatarStyle = member.avatarPath 
    ? `style="background-image: url('${member.avatarPath}'); background-size: cover; background-position: center;"` 
    : "";
  const avatarContent = !member.avatarPath 
    ? `<img src="../../assets/profile.png" alt="${member.fullName}">` 
    : "";
  
  return `
  <article class="info-card ${cardClass}">
    <div class="circle-avatar ${avatarSize}" ${avatarStyle}>
      ${avatarContent}
    </div>
    <div class="member-details">
      <div class="member-info">
        <h3>${renderShortName(member.fullName, nameLimit)}</h3>
        <p>${escapeHTML(member.roleName)}</p>
        <p>${renderEmail(member.email)}</p>
      </div>
      <div class="stats">
        <p>Total Tasks: ${member.taskStats?.total || 0}</p>
        <p>Completed: ${member.taskStats?.completed || 0}</p>
        <p>Pending: ${member.taskStats?.pending || 0}</p>
        <p>Missed: ${member.taskStats?.missed || 0}</p>
      </div>
    </div>
  </article>
`;
};

const renderGroupMembers = async (members) => {
  const container = document.querySelector("#groupInfoStack");
  if (!container) return;

  // Fetch task stats for each member in parallel
  const membersWithStats = await Promise.all(
    members.map(async (member) => {
      const taskStats = await getMemberTaskStats(member);
      return { ...member, taskStats };
    })
  );

  const teacher       = membersWithStats.find((m) => normalizeText(m.roleName) === "teacher");
  const leader        = membersWithStats.find((m) => normalizeText(m.roleName) === "leader");
  const normalMembers = membersWithStats.filter((m) => {
    const r = normalizeText(m.roleName);
    return r !== "teacher" && r !== "leader";
  });

  container.innerHTML = `
    <article class="info-card teacher-card">
      <div class="circle-avatar small" ${teacher && teacher.avatarPath ? `style="background-image: url('${teacher.avatarPath}'); background-size: cover; background-position: center;"` : ""}>
        ${!teacher || !teacher.avatarPath ? `<img src="../../assets/profile.png" alt="Teacher">` : ""}
      </div>
      <h3>${teacher
        ? `${renderShortText(teacher.fullName, 20)}<br><small>${renderEmail(teacher.email)}</small>`
        : "You currently have no teacher"
      }</h3>
    </article>

    ${leader
      ? createMemberCard(leader, "leader-card", "large")
      : `<article class="info-card leader-card"><h3>No leader found</h3></article>`
    }

    <div class="member-grid">
      ${normalMembers.map((m) => createMemberCard(m, "member-card", "medium")).join("")}
    </div>
  `;
};

/* ── EVENTS ───────────────────────────────────────────────────────────────── */
if (topBackBtn) {
  topBackBtn.addEventListener("click", () => { window.location.href = "../s.dashb.html"; });
}

if (projectBreakdownTab) {
  projectBreakdownTab.addEventListener("click", () => {
    const grpId = getGroupId();
    window.location.href = `s.membercategory.html?grpId=${grpId}`;
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    showConfirmation(
      "Are you sure you want to log out?",
      () => { window.location.href = "../../auth/log-sign.html"; },
      { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
    );
  });
}

const sendLeaveRequest = async () => {
  const supabase = getSupabase();
  const grpId = getGroupId();
  if (!grpId || !supabase) {
    showNotice("Cannot connect to the group right now.", { title: "Ask to Leave" });
    return;
  }

  if (leaveBtn) leaveBtn.disabled = true;

  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!user || userErr) {
      showNotice("You must be logged in to ask to leave.", { title: "Ask to Leave" });
      return;
    }

    const { data: profile } = await supabase
      .from("USER")
      .select("userDisplayName, userEmail")
      .eq("userId", user.id)
      .maybeSingle();

    const { data: memberships, error: membershipErr } = await supabase
      .from("GROUPMEMBER")
      .select("grpmemId, taskId")
      .eq("userId", user.id)
      .eq("grpId", Number(grpId));

    if (membershipErr || !memberships || memberships.length === 0) {
      showNotice("Could not find your group membership.", { title: "Ask to Leave" });
      return;
    }

    const ownMembership =
      memberships.find((row) => row.taskId === null) ||
      memberships[0];

    const displayName = profile?.userDisplayName || profile?.userEmail || user.email || "A member";
    const notification = {
      notiTitle: "Leave Request",
      notiBody: `${displayName} is asking to leave the group.`,
      "notiDate&Time": new Date().toISOString(),
      notiIsRead: false,
      grpmemId: ownMembership.grpmemId,
      grpId: Number(grpId)
    };

    let { error } = await supabase
      .from("NOTIFICATION")
      .insert(notification);

    if (error && String(error.message || "").includes("notiDate")) {
      const { ["notiDate&Time"]: _notiDateTime, ...notificationWithoutDate } = notification;
      const retry = await supabase
        .from("NOTIFICATION")
        .insert(notificationWithoutDate);
      error = retry.error;
    }

    if (error) {
      console.error("Leave request notification failed:", error);
      showNotice("Failed to send leave request: " + error.message, { title: "Ask to Leave" });
      return;
    }

    showNotice("Leave request sent.", { title: "Ask to Leave" });
  } finally {
    if (leaveBtn) leaveBtn.disabled = false;
  }
};

if (leaveBtn) {
  leaveBtn.addEventListener("click", () => {
    safeConfirm(
      "Send a leave request to your group leader or teacher?",
      sendLeaveRequest,
      { title: "Ask to Leave", confirmText: "Send Request", cancelText: "Cancel" }
    );
  });
}

/* ── SIDEBAR PROFILE ─────────────────────────────────────────────────────── */
const loadSidebarProfile = async () => {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("USER")
      .select("userDisplayName, userEmail, avatarPath")
      .eq("userId", user.id)
      .maybeSingle();
    if (!data) return;
    const profileBlock = document.querySelector(".profile-block");
    if (!profileBlock) return;
    const headings = profileBlock.querySelectorAll("h3");
    if (headings[0]) headings[0].textContent = data.userDisplayName || "No Name";
    if (headings[1]) headings[1].textContent = data.userEmail || user.email || "";
    const avatarImg = profileBlock.querySelector(".avatar-circle img");
    if (avatarImg && data.avatarPath) avatarImg.src = data.avatarPath;
  } catch (err) {
    console.error("Failed to load sidebar profile:", err);
  }
};

/* ── INIT ─────────────────────────────────────────────────────────────────── */
loadGroupFromDB();
loadSidebarProfile();
