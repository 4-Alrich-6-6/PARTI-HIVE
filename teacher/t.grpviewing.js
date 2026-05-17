/* ── Supabase accessor — lazy so it's never captured before supabaseClient.js runs ── */
const getSupabase = () => window.hiveSupabase;

/* ── ELEMENTS ─────────────────────────────────────────────────────────────── */
const topBackBtn          = document.querySelector("#topBackBtn");
const backBtn             = document.querySelector("#backBtn");
const projectBreakdownTab = document.querySelector("#projectBreakdownTab");
const logoutBtn           = document.querySelector(".logout");

/* ── HELPERS ──────────────────────────────────────────────────────────────── */
const getGroupId = () => {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("grpId");
  const fromSession = sessionStorage.getItem("hive_grpId");
  const grpId = [fromUrl, fromSession].find((value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized && normalized !== "null" && normalized !== "undefined";
  });

  if (grpId) sessionStorage.setItem("hive_grpId", String(grpId));
  return grpId || null;
};

const normalizeText = (v) => String(v || "").trim().toLowerCase();

const truncateEmail = (email, maxLen = 25) => {
  return email && email.length > maxLen ? email.slice(0, maxLen) + "..." : email;
};

/* ── DB LOAD ──────────────────────────────────────────────────────────────── */
const loadGroupFromDB = async () => {
  const supabase = getSupabase();
  const grpId = getGroupId();
  
  console.log("[loadGroupFromDB] grpId=", grpId, "supabase=", !!supabase);
  
  if (!grpId || !supabase) {
    console.error("[loadGroupFromDB] Missing grpId or supabase");
    return;
  }

  // 1. Group info — also fetch progId so we can query PROJECT correctly
  const { data: grp, error: grpErr } = await supabase
    .from("GROUP")
    .select("grpName, grpSubject, progId")
    .eq("grpId", grpId)
    .maybeSingle();

  console.log("Group info fetched:", grp, "Error:", grpErr);

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

  const allMembers = members.map((m) => ({
    grpmemId: m.grpmemId,
    userId:   m.userId,
    roleId:   m.roleId,
    roleName: m.ROLE?.roleName          || "Member",
    fullName: m.USER?.userDisplayName   || "Unknown",
    email:    m.USER?.userEmail         || "No email",
    avatarPath: m.USER?.avatarPath      || null,
  }));

  // 3. Project count — FIX: PROJECT has no grpId column; link through GROUP.progId
  let projCount = 0;
  if (grp?.progId) {
    const { count } = await supabase
      .from("PROJECT")
      .select("progId", { count: "exact", head: true })
      .eq("progId", grp.progId);
    projCount = count || 0;
  }

  // 4. Summary cards (teacher view: Members count + Projects count)
  const nonTeacher = allMembers.filter((m) => normalizeText(m.roleName) !== "teacher");
  const summaryH3s = document.querySelectorAll(".summary-card h3");
  if (summaryH3s[0]) summaryH3s[0].textContent = nonTeacher.length;
  if (summaryH3s[1]) summaryH3s[1].textContent = projCount || 0;

  // 5. Render member cards
  await renderGroupMembers(allMembers);
};

/* ── FETCH MEMBER TASK STATS ──────────────────────────────────────────────── */
const getMemberTaskStats = async (member) => {
  const supabase = getSupabase();
  if (!supabase) return { total: 0, completed: 0, pending: 0, missed: 0 };

  try {
    // Get all taskIds for this member (from GROUPMEMBER)
    const { data: memberTasks } = await supabase
      .from("GROUPMEMBER")
      .select("taskId")
      .eq("userId", member.userId)
      .not("taskId", "is", null);

    if (!memberTasks || memberTasks.length === 0) {
      return { total: 0, completed: 0, pending: 0, missed: 0 };
    }

    const taskIds = memberTasks.map(mt => mt.taskId);

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
  const avatarStyle = member.avatarPath 
    ? `style="background-image: url('${member.avatarPath}'); background-size: cover; background-position: center;"` 
    : "";
  const avatarContent = !member.avatarPath 
    ? `<img src="../assets/profile.png" alt="${member.fullName}">` 
    : "";
  
  return `
  <article class="info-card ${cardClass}">
    <div class="circle-avatar ${avatarSize}" ${avatarStyle}>
      ${avatarContent}
    </div>
    <div class="member-details">
      <div class="member-info">
        <h3>${member.fullName}</h3>
        <p>${member.roleName}</p>
        <p title="${member.email}">${truncateEmail(member.email)}</p>
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
  const container = document.querySelector(".group-info-stack");
  if (!container) return;

  // Fetch task stats for each member in parallel
  const membersWithStats = await Promise.all(
    members.map(async (member) => {
      const taskStats = await getMemberTaskStats(member);
      return { ...member, taskStats };
    })
  );

  const leader        = membersWithStats.find((m) => normalizeText(m.roleName) === "leader");
  const normalMembers = membersWithStats.filter((m) => {
    const r = normalizeText(m.roleName);
    return r !== "teacher" && r !== "leader";
  });

  container.innerHTML = `
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
  topBackBtn.addEventListener("click", () => { window.location.href = "t.dashb.html"; });
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    showConfirmation(
      "Are you sure you want to leave this group?",
      async () => {
        const supabase = getSupabase();
        const grpId = getGroupId();
        if (!grpId || !supabase) {
          alert("Error: Missing group ID or Supabase.");
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          alert("Error: User not authenticated.");
          return;
        }
        const { error } = await supabase
          .from("GROUPMEMBER")
          .delete()
          .eq("userId", user.id)
          .eq("grpId", grpId);
        if (error) {
          alert("Failed to leave group: " + error.message);
          return;
        }
        window.location.href = "t.dashb.html";
      },
      { title: "Leave Group", confirmText: "Leave", cancelText: "Cancel" }
    );
  });
}

if (projectBreakdownTab) {
  projectBreakdownTab.addEventListener("click", () => { 
    const grpId = getGroupId();
    window.location.href = `t.category.html${grpId ? `?grpId=${grpId}` : ""}`;
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    showConfirmation(
      "Are you sure you want to log out?",
      () => { window.location.href = "../auth/log-sign.html"; },
      { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
    );
  });
}

/* ── INIT ─────────────────────────────────────────────────────────────────── */

// Load sidebar profile data
const loadTeacherSidebarProfile = async () => {
    const supabase = getSupabase();
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

        // Update avatar
        const avatarImg = document.querySelector(".avatar-circle img");
        if (avatarImg && userData.avatarPath) {
            avatarImg.src = userData.avatarPath;
            avatarImg.style.objectFit = "cover";
        }

        // Update name and email
        const h3s = document.querySelectorAll(".profile-block h3");
        if (h3s[0]) h3s[0].textContent = userData.userDisplayName || "Name";
        if (h3s[1]) h3s[1].textContent = userData.userEmail || "Email";
    } catch (err) {
        console.error("Error loading teacher profile:", err);
    }
};

loadGroupFromDB();
loadTeacherSidebarProfile();
