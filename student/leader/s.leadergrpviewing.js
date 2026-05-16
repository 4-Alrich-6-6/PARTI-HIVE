/* ── Supabase via global window.hiveSupabase (set in supabaseClient.js) ─────── */
const supabase = window.hiveSupabase;

/* ── ELEMENTS ─────────────────────────────────────────────────────────────── */
const topBackBtn               = document.querySelector("#topBackBtn");
const backBtn                  = document.querySelector("#backBtn");
const projectBreakdownTab      = document.querySelector("#projectBreakdownTab");
const openAddMembersModalBtn   = document.querySelector("#openAddMembersModalBtn");
const addMembersModalOverlay   = document.querySelector("#addMembersModalOverlay");
const discardAddMembersBtn     = document.querySelector("#discardAddMembersBtn");
const copyGroupLinkBtn         = document.querySelector("#copyGroupLinkBtn");
const groupLinkValue           = document.querySelector("#groupLinkValue");
const openRemoveMembersModalBtn= document.querySelector("#openRemoveMembersModalBtn");
const removeMembersModalOverlay= document.querySelector("#removeMembersModalOverlay");
const removeMembersList        = document.querySelector("#removeMembersList");
const discardRemoveMembersBtn  = document.querySelector("#discardRemoveMembersBtn");
const removeMembersBtn         = document.querySelector("#removeMembersBtn");
const leaveBtn                 = document.querySelector("#leaveBtn");
const selectLeaderModalOverlay = document.querySelector("#selectLeaderModalOverlay");
const discardSelectLeaderBtn   = document.querySelector("#discardSelectLeaderBtn");
const selectLeaderList         = document.querySelector("#selectLeaderList");
const leaveGroupBtn            = document.querySelector("#leaveGroupBtn");
const confirmLeaveModalOverlay = document.querySelector("#confirmLeaveModalOverlay");
const cancelLeaveBtn           = document.querySelector("#cancelLeaveBtn");
const confirmLeaveBtn          = document.querySelector("#confirmLeaveBtn");
const logoutBtn                = document.querySelector(".logout");

/* ── HELPERS ──────────────────────────────────────────────────────────────── */
const getGroupId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("grpId") || sessionStorage.getItem("hive_grpId") || null;
};

const normalizeText = (v) => String(v || "").trim().toLowerCase();

const safeShowConfirmation = (msg, onConfirm, opts = {}) => {
  if (typeof showConfirmation === "function") showConfirmation(msg, onConfirm, opts);
  else if (confirm(msg)) onConfirm();
};

const getMemberStat = (member, keys) => {
  const key = keys.find((k) => member[k] !== undefined && member[k] !== null);
  return key ? member[key] : 0;
};

/* ── STATE (populated by loadGroupFromDB) ────────────────────────────────── */
let currentMembers = []; // full list of {grpmemId, userId, fullName, email, roleName, roleId}

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
    if (h2) h2.textContent = grp.grpName  || "Group Name";
    if (p)  p.textContent  = grp.grpSubject || "Subject";
    // also update the copy-link field placeholder
    if (groupLinkValue) groupLinkValue.value = String(grpId);
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

  currentMembers = members.map((m) => ({
    grpmemId:  m.grpmemId,
    userId:    m.userId,
    roleId:    m.roleId,
    roleName:  m.ROLE?.roleName  || "Member",
    fullName:  m.USER?.userDisplayName || "Unknown",
    email:     m.USER?.userEmail       || "No email",
  }));

  // 3. Project count
  const { count: projCount } = await supabase
    .from("PROJECT")
    .select("projId", { count: "exact", head: true })
    .eq("grpId", grpId);

  // 4. Render summary cards
  const teacher = currentMembers.filter((m) => normalizeText(m.roleName) === "teacher");
  const nonTeacher = currentMembers.filter((m) => normalizeText(m.roleName) !== "teacher");
  const summaryH3s = document.querySelectorAll(".summary-card h3");
  if (summaryH3s[0]) summaryH3s[0].textContent = teacher.length;
  if (summaryH3s[1]) summaryH3s[1].textContent = nonTeacher.length;
  if (summaryH3s[2]) summaryH3s[2].textContent = projCount || 0;

  // 5. Render member cards
  renderGroupMembers(currentMembers);
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

/* ── GROUP LINK (just the numeric grpId so members can join) ─────────────── */
const getGroupLink = () => getGroupId() || "—";

/* ── ADD MEMBERS MODAL ────────────────────────────────────────────────────── */
const closeAddMembersModal = () => {
  if (!addMembersModalOverlay) return;
  addMembersModalOverlay.classList.remove("open");
  addMembersModalOverlay.setAttribute("aria-hidden", "true");
};
const openAddMembersModal = () => {
  if (!addMembersModalOverlay) return;
  if (groupLinkValue) groupLinkValue.value = getGroupLink();
  addMembersModalOverlay.classList.add("open");
  addMembersModalOverlay.setAttribute("aria-hidden", "false");
};

/* ── SELECT LEADER MODAL ─────────────────────────────────────────────────── */
const closeSelectLeaderModal = () => {
  if (!selectLeaderModalOverlay) return;
  selectLeaderModalOverlay.classList.remove("open");
  selectLeaderModalOverlay.setAttribute("aria-hidden", "true");
};

const updateLeaveGroupBtnState = () => {
  if (!leaveGroupBtn || !selectLeaderList) return;
  leaveGroupBtn.disabled = !selectLeaderList.querySelector("input[type='radio']:checked");
};

const renderSelectLeaderList = () => {
  if (!selectLeaderList) return;
  const eligible = currentMembers.filter((m) => {
    const r = normalizeText(m.roleName);
    return r !== "leader" && r !== "teacher";
  });
  if (eligible.length === 0) {
    selectLeaderList.innerHTML = "<p class='select-leader-empty'>No eligible members to become leader.</p>";
    if (leaveGroupBtn) leaveGroupBtn.disabled = true;
    return;
  }
  selectLeaderList.innerHTML = eligible.map((m) => `
    <label class="select-leader-item">
      <input type="radio" name="newLeader" value="${m.userId}">
      <span>${m.fullName}</span>
    </label>
  `).join("");
  selectLeaderList.querySelectorAll("input[type='radio']").forEach((r) =>
    r.addEventListener("change", updateLeaveGroupBtnState)
  );
  updateLeaveGroupBtnState();
};

const openSelectLeaderModal = () => {
  if (!selectLeaderModalOverlay) return;
  renderSelectLeaderList();
  selectLeaderModalOverlay.classList.add("open");
  selectLeaderModalOverlay.setAttribute("aria-hidden", "false");
};

/* ── CONFIRM LEAVE MODAL ─────────────────────────────────────────────────── */
const closeConfirmLeaveModal = () => {
  if (!confirmLeaveModalOverlay) return;
  confirmLeaveModalOverlay.classList.remove("open");
  confirmLeaveModalOverlay.setAttribute("aria-hidden", "true");
};
const openConfirmLeaveModal = () => {
  if (!confirmLeaveModalOverlay) return;
  closeSelectLeaderModal();
  confirmLeaveModalOverlay.classList.add("open");
  confirmLeaveModalOverlay.setAttribute("aria-hidden", "false");
};

const leaveGroup = async () => {
  if (!selectLeaderList) return;
  const selected = selectLeaderList.querySelector("input[type='radio']:checked");
  if (!selected) return;

  const newLeaderUserId = selected.value;
  const grpId = getGroupId();

  // Find the Leader role id and Member role id
  const { data: leaderRole } = await getSupabase().from("ROLE").select("roleId").eq("roleName", "Leader").maybeSingle();
  const { data: memberRole  } = await getSupabase().from("ROLE").select("roleId").eq("roleName", "Member").maybeSingle();

  // Promote selected member to Leader
  await getSupabase().from("GROUPMEMBER")
    .update({ roleId: leaderRole?.roleId })
    .eq("userId", newLeaderUserId).eq("grpId", grpId);

  // Demote current user to Member
  const { data: { user } } = await getSupabase().auth.getUser();
  if (user) {
    await getSupabase().from("GROUPMEMBER")
      .update({ roleId: memberRole?.roleId })
      .eq("userId", user.id).eq("grpId", grpId);
  }

  closeConfirmLeaveModal();
  window.location.href = "../s.dashb.html";
};

/* ── REMOVE MEMBERS MODAL ────────────────────────────────────────────────── */
const updateRemoveMembersBtnState = () => {
  if (!removeMembersBtn || !removeMembersList) return;
  removeMembersBtn.disabled =
    removeMembersList.querySelectorAll("input[type='checkbox']:checked").length === 0;
};

const renderRemoveMembersList = () => {
  if (!removeMembersList) return;
  const removable = currentMembers.filter((m) => {
    const r = normalizeText(m.roleName);
    return r !== "leader" && r !== "teacher";
  });
  if (removable.length === 0) {
    removeMembersList.innerHTML = "<p class='remove-members-empty'>No removable members found.</p>";
    if (removeMembersBtn) removeMembersBtn.disabled = true;
    return;
  }
  removeMembersList.innerHTML = removable.map((m) => `
    <label class="remove-member-item">
      <input type="checkbox" value="${m.grpmemId}">
      <span>${m.fullName}</span>
    </label>
  `).join("");
  removeMembersList.querySelectorAll("input[type='checkbox']").forEach((cb) =>
    cb.addEventListener("change", updateRemoveMembersBtnState)
  );
  updateRemoveMembersBtnState();
};

const closeRemoveMembersModal = () => {
  if (!removeMembersModalOverlay) return;
  removeMembersModalOverlay.classList.remove("open");
  removeMembersModalOverlay.setAttribute("aria-hidden", "true");
};
const openRemoveMembersModal = () => {
  if (!removeMembersModalOverlay) return;
  renderRemoveMembersList();
  removeMembersModalOverlay.classList.add("open");
  removeMembersModalOverlay.setAttribute("aria-hidden", "false");
};

/* ── EVENTS ───────────────────────────────────────────────────────────────── */
if (openRemoveMembersModalBtn) openRemoveMembersModalBtn.addEventListener("click", openRemoveMembersModal);
if (discardRemoveMembersBtn)   discardRemoveMembersBtn.addEventListener("click", closeRemoveMembersModal);
if (removeMembersModalOverlay) removeMembersModalOverlay.addEventListener("click", (e) => { if (e.target === removeMembersModalOverlay) closeRemoveMembersModal(); });

if (removeMembersBtn) {
  removeMembersBtn.addEventListener("click", () => {
    const selectedIds = Array.from(
      removeMembersList.querySelectorAll("input[type='checkbox']:checked")
    ).map((cb) => Number(cb.value));
    if (selectedIds.length === 0) return;

    const names = currentMembers
      .filter((m) => selectedIds.includes(m.grpmemId))
      .map((m) => m.fullName);
    const label = names.length === 1 ? `"${names[0]}"` : `${names.length} members`;

    safeShowConfirmation(
      `Are you sure you want to remove ${label} from the group?`,
      async () => {
        const { error } = await supabase
          .from("GROUPMEMBER")
          .delete()
          .in("grpmemId", selectedIds);
        if (error) { alert("Failed to remove members: " + error.message); return; }
        closeRemoveMembersModal();
        await loadGroupFromDB();
      },
      { title: "Remove Members", confirmText: "Remove", cancelText: "Cancel" }
    );
  });
}

if (topBackBtn)     topBackBtn.addEventListener("click", () => { window.location.href = "../s.dashb.html"; });
if (backBtn)        backBtn.addEventListener("click",    () => { window.location.href = "../s.dashb.html"; });
if (projectBreakdownTab) projectBreakdownTab.addEventListener("click", () => {
  const grpId = getGroupId();
  window.location.href = `s.leadercategory.html?grpId=${grpId}`;
});
if (openAddMembersModalBtn) openAddMembersModalBtn.addEventListener("click", openAddMembersModal);
if (discardAddMembersBtn)   discardAddMembersBtn.addEventListener("click", closeAddMembersModal);
if (addMembersModalOverlay) addMembersModalOverlay.addEventListener("click", (e) => { if (e.target === addMembersModalOverlay) closeAddMembersModal(); });

if (copyGroupLinkBtn) {
  copyGroupLinkBtn.addEventListener("click", async () => {
    if (!groupLinkValue) return;
    const link = groupLinkValue.value;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      groupLinkValue.select();
      document.execCommand("copy");
    }
    copyGroupLinkBtn.textContent = "Copied";
    setTimeout(() => { copyGroupLinkBtn.textContent = "Copy"; }, 1200);
  });
}

if (leaveBtn)              leaveBtn.addEventListener("click", openSelectLeaderModal);
if (discardSelectLeaderBtn) discardSelectLeaderBtn.addEventListener("click", closeSelectLeaderModal);
if (selectLeaderModalOverlay) selectLeaderModalOverlay.addEventListener("click", (e) => { if (e.target === selectLeaderModalOverlay) closeSelectLeaderModal(); });
if (leaveGroupBtn)         leaveGroupBtn.addEventListener("click", openConfirmLeaveModal);
if (cancelLeaveBtn)        cancelLeaveBtn.addEventListener("click", closeConfirmLeaveModal);
if (confirmLeaveBtn)       confirmLeaveBtn.addEventListener("click", leaveGroup);
if (confirmLeaveModalOverlay) confirmLeaveModalOverlay.addEventListener("click", (e) => { if (e.target === confirmLeaveModalOverlay) closeConfirmLeaveModal(); });

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    safeShowConfirmation(
      "Are you sure you want to log out?",
      () => { window.location.href = "../../auth/log-sign.html"; },
      { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
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