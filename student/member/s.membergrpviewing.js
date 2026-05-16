/* ── Supabase via global window.hiveSupabase (set in supabaseClient.js) ─────── */
const supabase = window.hiveSupabase;

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

/* ── DB LOAD ──────────────────────────────────────────────────────────────── */
const loadGroupFromDB = async () => {
  const grpId = getGroupId();
  if (!grpId || !supabase) return;

  // 1. Group info
  const { data: grp, error: grpErr } = await supabase
    .from("GROUP")
    .select("grpName, grpSubject")
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
    .select("grpmemId, userId, roleId, ROLE(roleName), USER(userDisplayName, userEmail)")
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
  }));

  // 3. Project count
  const { count: projCount } = await supabase
    .from("PROJECT")
    .select("projId", { count: "exact", head: true })
    .eq("grpId", grpId);

  // 4. Summary cards
  const teachers   = allMembers.filter((m) => normalizeText(m.roleName) === "teacher");
  const nonTeacher = allMembers.filter((m) => normalizeText(m.roleName) !== "teacher");
  const summaryH3s = document.querySelectorAll(".summary-card h3");
  if (summaryH3s[0]) summaryH3s[0].textContent = teachers.length;
  if (summaryH3s[1]) summaryH3s[1].textContent = nonTeacher.length;
  if (summaryH3s[2]) summaryH3s[2].textContent = projCount || 0;

  // 5. Render member cards
  renderGroupMembers(allMembers);
};

/* ── RENDER MEMBERS ───────────────────────────────────────────────────────── */
const createMemberCard = (member, cardClass, avatarSize) => `
  <article class="info-card ${cardClass}">
    <div class="circle-avatar ${avatarSize}"></div>
    <div class="member-details">
      <div class="member-info">
        <h3>${member.fullName}</h3>
        <p>${member.roleName}</p>
        <p>${member.email}</p>
      </div>
      <div class="stats">
        <p>Total Tasks: 0</p>
        <p>Completed: 0</p>
        <p>Pending: 0</p>
        <p>Missed: 0</p>
      </div>
    </div>
  </article>
`;

const renderGroupMembers = (members) => {
  const container = document.querySelector("#groupInfoStack");
  if (!container) return;

  const teacher       = members.find((m) => normalizeText(m.roleName) === "teacher");
  const leader        = members.find((m) => normalizeText(m.roleName) === "leader");
  const normalMembers = members.filter((m) => {
    const r = normalizeText(m.roleName);
    return r !== "teacher" && r !== "leader";
  });

  container.innerHTML = `
    <article class="info-card teacher-card">
      <div class="circle-avatar small"></div>
      <h3>${teacher
        ? `${teacher.fullName}<br><small>${teacher.email}</small>`
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
  projectBreakdownTab.addEventListener("click", () => { window.location.href = "s.membercategory.html"; });
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

if (leaveBtn) {
  leaveBtn.addEventListener("click", () => {
    showConfirmation(
      "Are you sure you want to leave this group?",
      async () => {
        const grpId = getGroupId();
        if (!grpId || !supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase
          .from("GROUPMEMBER")
          .delete()
          .eq("userId", user.id)
          .eq("grpId", grpId);
        if (error) { alert("Failed to leave group: " + error.message); return; }
        window.location.href = "../s.dashb.html";
      },
      { title: "Leave Group", confirmText: "Leave", cancelText: "Cancel" }
    );
  });
}

/* ── INIT ─────────────────────────────────────────────────────────────────── */
loadGroupFromDB();
