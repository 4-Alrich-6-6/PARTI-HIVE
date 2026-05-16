/* ── Supabase via global window.hiveSupabase (set in supabaseClient.js) ─────── */
const supabase = window.hiveSupabase;

/* ── ELEMENTS ─────────────────────────────────────────────────────────────── */
const topBackBtn          = document.querySelector("#topBackBtn");
const backBtn             = document.querySelector("#backBtn");
const projectBreakdownTab = document.querySelector("#projectBreakdownTab");
const logoutBtn           = document.querySelector(".logout");

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

  // 4. Summary cards (teacher view: Members count + Projects count)
  const nonTeacher = allMembers.filter((m) => normalizeText(m.roleName) !== "teacher");
  const summaryH3s = document.querySelectorAll(".summary-card h3");
  if (summaryH3s[0]) summaryH3s[0].textContent = nonTeacher.length;
  if (summaryH3s[1]) summaryH3s[1].textContent = projCount || 0;

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

  const leader        = members.find((m) => normalizeText(m.roleName) === "leader");
  const normalMembers = members.filter((m) => normalizeText(m.roleName) === "member");

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
      "Are you sure you want to go back?",
      () => { window.location.href = "t.dashb.html"; },
      { title: "Go Back", confirmText: "Go Back", cancelText: "Cancel" }
    );
  });
}

if (projectBreakdownTab) {
  projectBreakdownTab.addEventListener("click", () => { window.location.href = "t.category.html"; });
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
loadGroupFromDB();
