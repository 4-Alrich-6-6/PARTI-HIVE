/* ── Supabase accessor — lazy so it's never captured before supabaseClient.js runs ── */
const getSupabase = () => window.hiveSupabase;

/* ── ELEMENTS ─────────────────────────────────────────────────────────────── */
const topBackBtn               = document.querySelector("#topBackBtn");
// NOTE: #backBtn does not exist in the HTML — topBackBtn handles all back navigation
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

const resolveAvatar = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = sb.storage.from("profilePicture").getPublicUrl(path);
  return data?.publicUrl || null;
};

const truncateEmail = (email, maxLen = 25) => {
  return email && email.length > maxLen ? email.slice(0, maxLen) + "..." : email;
};

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
  const supabase = getSupabase(); // FIX: use lazy accessor, not the captured-at-parse-time undefined value
  const grpId = getGroupId();
  if (!grpId || !supabase) return;

  // 1. Group info
  const { data: grp, error: grpErr } = await supabase
    .from("GROUP")
    .select("grpName, grpSubject, teacherId")
    .eq("grpId", grpId)
    .maybeSingle();

  if (!grpErr && grp) {
    const h2 = document.querySelector(".group-label h2");
    const p  = document.querySelector(".group-label p");
    if (h2) h2.textContent = grp.grpName    || "Group Name";
    if (p)  p.textContent  = grp.grpSubject || "Subject";
    if (groupLinkValue) groupLinkValue.value = String(grpId);
  }

  // 2. Members (join USER and ROLE)
  const { data: members, error: memErr } = await supabase
    .from("GROUPMEMBER")
    .select("grpmemId, userId, roleId, ROLE(roleName), USER(userDisplayName, userEmail, avatarPath, PROGRAM(progName), DEPARTMENT(deptName))")
    .eq("grpId", grpId);

  if (memErr || !members) {
    console.error("Error loading members:", memErr);
    return;
  }

  currentMembers = members.map((m) => ({
    grpmemId:  m.grpmemId,
    userId:    m.userId,
    roleId:    m.roleId,
    roleName:  m.ROLE?.roleName         || "Member",
    fullName:  m.USER?.userDisplayName  || "Unknown",
    email:     m.USER?.userEmail        || "No email",
    avatarPath: m.USER?.avatarPath      || null,
    progName:  m.USER?.PROGRAM?.progName   || null,
    deptName:  m.USER?.DEPARTMENT?.deptName || null,
  }));

  // Teachers are stored in GROUP.teacherId, not GROUPMEMBER — inject them manually
  if (grp?.teacherId) {
    const { data: teacherUser } = await supabase
      .from("USER")
      .select("userDisplayName, userEmail, avatarPath, DEPARTMENT(deptName)")
      .eq("userId", grp.teacherId)
      .maybeSingle();
    if (teacherUser) {
      currentMembers.push({
        grpmemId:  null,
        userId:    grp.teacherId,
        roleId:    null,
        roleName:  "Teacher",
        fullName:  teacherUser.userDisplayName || "Unknown",
        email:     teacherUser.userEmail       || "No email",
        avatarPath: teacherUser.avatarPath     || null,
        progName:  null,
        deptName:  teacherUser.DEPARTMENT?.deptName || null,
      });
    }
  }

  // 3. Project count
  const { count: projCount = 0 } = await supabase
    .from("PROJECT")
    .select("*", { count: "exact", head: true })
    .eq("grpId", grpId);

  // 4. Render summary cards
  const nonTeacher = currentMembers.filter((m) => normalizeText(m.roleName) !== "teacher");
  const summaryH3s = document.querySelectorAll(".summary-card h3");
  if (summaryH3s[0]) summaryH3s[0].textContent = grp?.teacherId ? 1 : 0;
  if (summaryH3s[1]) summaryH3s[1].textContent = nonTeacher.length;
  if (summaryH3s[2]) summaryH3s[2].textContent = projCount;

  // 5. Render member cards
  await renderGroupMembers(currentMembers);
};

/* ── FETCH MEMBER TASK STATS ──────────────────────────────────────────────── */
const getMemberTaskStats = async (member) => {
  const supabase = getSupabase();
  const grpId = getGroupId();
  if (!supabase || !grpId) return { total: 0, completed: 0, pending: 0, missed: 0 };

  try {
    const { data: memberships } = await supabase
      .from("GROUPMEMBER")
      .select("grpmemId")
      .eq("userId", member.userId)
      .eq("grpId", Number(grpId));

    if (!memberships?.length) return { total: 0, completed: 0, pending: 0, missed: 0 };

    const grpmemIds = memberships.map(m => m.grpmemId);

    const { data: assignments } = await supabase
      .from("TASKASSIGNMENT")
      .select("taskId")
      .in("grpmemId", grpmemIds);

    if (!assignments?.length) return { total: 0, completed: 0, pending: 0, missed: 0 };

    const taskIds = [...new Set(assignments.map(a => a.taskId))];

    const { data: tasks } = await supabase
      .from("TASK")
      .select("taskId, statId, taskDueD, taskAcmD")
      .in("taskId", taskIds);

    if (!tasks) return { total: 0, finished: 0, pending: 0, missed: 0 };

    const total = tasks.length;
    const finished = tasks.filter(t => t.statId === 5).length;
    const missed = tasks.filter(t => t.statId === 6).length;
    const pending = tasks.filter(t => t.statId !== 5 && t.statId !== 6).length;
    return { total, finished, pending, missed };
  } catch (err) {
    console.error("Error fetching member task stats:", err);
    return { total: 0, completed: 0, pending: 0, missed: 0 };
  }
};

const createMemberCard = (member, cardClass, avatarSize) => {
  const avatarUrl = resolveAvatar(member.avatarPath);
  const avatarStyle = avatarUrl
    ? `style="background-image: url('${avatarUrl}'); background-size: cover; background-position: center;"`
    : "";
  const avatarContent = !avatarUrl
    ? `<img src="../../assets/profile.png" alt="${member.fullName}">`
    : "";
  const isTeacher = cardClass.includes("teacher-card");

  return `
  <article class="info-card ${cardClass}" data-member-id="${member.userId}" style="cursor:pointer;">
    <div class="circle-avatar ${avatarSize}" ${avatarStyle}>
      ${avatarContent}
    </div>
    <div class="member-details">
      <div class="member-info">
        <h3>${member.fullName}</h3>
        <p>${member.roleName}</p>
        <p title="${member.email}">${truncateEmail(member.email)}</p>
      </div>
      ${!isTeacher ? `
      <div class="stats">
        <p>Total Tasks: ${member.taskStats?.total || 0}</p>
        <p>Finished: ${member.taskStats?.finished || 0}</p>
        <p>Pending: ${member.taskStats?.pending || 0}</p>
        <p>Missed: ${member.taskStats?.missed || 0}</p>
      </div>` : ""}
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
    ${teacher
      ? createMemberCard(teacher, "teacher-card", "small")
      : `<article class="info-card teacher-card"><h3>You currently have no teacher</h3></article>`
    }

    ${leader
      ? createMemberCard(leader, "leader-card", "large")
      : `<article class="info-card leader-card"><h3>No leader found</h3></article>`
    }

    <div class="member-grid">
      ${normalMembers.map((m) => createMemberCard(m, "member-card", "medium")).join("")}
    </div>
  `;
};

/* ── MEMBER PROFILE MODAL ────────────────────────────────────────────────── */
const memberProfileOverlay   = document.querySelector("#memberProfileOverlay");
const memberProfileName      = document.querySelector("#memberProfileName");
const memberProfileRole      = document.querySelector("#memberProfileRole");
const memberProfileField     = document.querySelector("#memberProfileField");
const memberProfileEmail     = document.querySelector("#memberProfileEmail");
const memberProfileAvatar    = document.querySelector("#memberProfileAvatar");
const closeMemberProfileBtn  = document.querySelector("#closeMemberProfileBtn");

const getAvatarLightbox = () => {
  let lb = document.querySelector("#avatarLightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "avatarLightbox";
    lb.style.cssText = "display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10000;align-items:center;justify-content:center;";
    lb.innerHTML = `
      <button style="position:absolute;top:16px;right:16px;width:40px;height:40px;border:none;border-radius:50%;background:#fff;font-size:20px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;" id="closeLightboxBtn">✕</button>
      <img id="lightboxImg" src="" alt="Profile picture" style="max-width:90vw;max-height:90vh;border-radius:12px;object-fit:contain;">
    `;
    document.body.appendChild(lb);
    lb.querySelector("#closeLightboxBtn").addEventListener("click", () => { lb.style.display = "none"; });
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.style.display = "none"; });
  }
  return lb;
};

const openMemberProfile = (member) => {
  if (!memberProfileOverlay) return;
  memberProfileRole.textContent  = member.roleName;
  memberProfileName.textContent  = member.fullName;
  memberProfileEmail.textContent = member.email;
  const field = member.deptName || member.progName || "";
  memberProfileField.textContent = field ? (member.deptName ? `Department: ${field}` : `Program: ${field}`) : "";
  const avatarUrl = resolveAvatar(member.avatarPath);
  if (avatarUrl) {
    memberProfileAvatar.style.backgroundImage = `url('${avatarUrl}')`;
    memberProfileAvatar.style.backgroundSize  = "cover";
    memberProfileAvatar.style.backgroundPosition = "center";
    memberProfileAvatar.style.cursor = "pointer";
    memberProfileAvatar.innerHTML = "";
    memberProfileAvatar.onclick = () => {
      const lb = getAvatarLightbox();
      lb.querySelector("#lightboxImg").src = avatarUrl;
      lb.style.display = "flex";
    };
  } else {
    memberProfileAvatar.style.backgroundImage = "";
    memberProfileAvatar.style.cursor = "default";
    memberProfileAvatar.onclick = null;
    memberProfileAvatar.innerHTML = `<img src="../../assets/profile.png" alt="${member.fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }
  memberProfileOverlay.classList.add("open");
  memberProfileOverlay.setAttribute("aria-hidden", "false");
};

const closeMemberProfile = () => {
  memberProfileOverlay?.classList.remove("open");
  memberProfileOverlay?.setAttribute("aria-hidden", "true");
};

if (closeMemberProfileBtn) closeMemberProfileBtn.addEventListener("click", closeMemberProfile);
if (memberProfileOverlay) memberProfileOverlay.addEventListener("click", (e) => { if (e.target === memberProfileOverlay) closeMemberProfile(); });

// Delegate clicks on all info-cards inside groupInfoStack
document.querySelector("#groupInfoStack")?.addEventListener("click", (e) => {
  const card = e.target.closest("[data-member-id]");
  if (!card) return;
  const member = currentMembers.find((m) => String(m.userId) === card.dataset.memberId);
  if (member) openMemberProfile(member);
});

/* ── GROUP LINK (create shareable invitation URL) ─────────────────────────── */
const getGroupLink = () => {
  const grpId = getGroupId();
  if (!grpId) return "—";
  // Create a full URL: domain/student/join-group.html?invite=grpId
  const baseURL = window.location.origin;
  return `${baseURL}/student/join-group.html?invite=${grpId}`;
};

const getGroupInviteCode = () => {
  const grpId = getGroupId();
  return grpId || "—";
};

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
  const hasTeacher = currentMembers.some((m) => normalizeText(m.roleName) === "teacher");

  if (eligible.length === 0) {
    if (hasTeacher) {
      // Teacher is still in the group — leader can just leave, no deletion needed
      selectLeaderList.innerHTML = "<p class='select-leader-empty'>No other members to transfer leadership to. You will leave the group and the teacher will remain.</p>";
    } else {
      // Leader is truly alone — leaving will delete everything
      selectLeaderList.innerHTML = "<p class='select-leader-empty'>You are the only member. Leaving will permanently delete this group and all its projects and tasks.</p>";
    }
    if (leaveGroupBtn) {
      leaveGroupBtn.textContent = hasTeacher ? "Leave Group" : "Leave & Delete Group";
      leaveGroupBtn.disabled = false;
    }
    return;
  }
  if (leaveGroupBtn) leaveGroupBtn.textContent = "Leave";
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
  const supabase = getSupabase();
  if (!selectLeaderList || !supabase) return;
  const grpId = Number(getGroupId());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const selected = selectLeaderList.querySelector("input[type='radio']:checked");
  const hasTeacher = currentMembers.some((m) => normalizeText(m.roleName) === "teacher");

  if (!selected && hasTeacher) {
    // Only leader + teacher remain — leader just leaves, teacher stays, no deletion
    const { error } = await supabase.rpc("leave_group", {
      p_user_id: user.id,
      p_grp_id:  grpId,
    });
    if (error) { alert("Failed to leave group: " + error.message); return; }
  } else if (!selected && !hasTeacher) {
    // Leader is truly alone — delete the entire group and all its data
    const { error } = await supabase.rpc("delete_group_cascade", {
      p_grp_id: grpId,
    });
    if (error) { alert("Failed to delete group: " + error.message); return; }
  } else {
    // Transfer leadership then remove old leader
    const { error } = await supabase.rpc("transfer_leadership", {
      p_grp_id:              grpId,
      p_new_leader_user_id:  selected.value,
      p_old_leader_user_id:  user.id,
    });
    if (error) { alert("Failed to transfer leadership. Please try again."); return; }
    
    // Notify new leader
    try {
      const { data: newLeaderInfo } = await supabase.from("USER").select("userDisplayName").eq("userId", selected.value).maybeSingle();
      const { data: grpInfo } = await supabase.from("GROUP").select("grpName").eq("grpId", grpId).maybeSingle();
      const newLeaderName = newLeaderInfo?.userDisplayName || "New leader";
      const grpName = grpInfo?.grpName || "the group";
      
      await supabase.from("NOTIFICATION").insert({
        notiTitle: "Promoted to Leader",
        notiBody: `You have been promoted as a leader in "${grpName}".`,
        "notiDate&Time": new Date().toISOString(),
        notiIsRead: false,
        userId: selected.value,
        grpId: Number(grpId)
      });
    } catch (e) {}
  }

  closeConfirmLeaveModal();
  
  // Notify all members that leader left
  try {
    const [{ data: members }, { data: leaderInfo }, { data: grpInfo }] = await Promise.all([
      supabase.from("GROUPMEMBER").select("userId").eq("grpId", grpId).neq("userId", user.id),
      supabase.from("USER").select("userDisplayName").eq("userId", user.id).maybeSingle(),
      supabase.from("GROUP").select("grpName").eq("grpId", grpId).maybeSingle()
    ]);
    const recipients = (members || []).map(m => m.userId);
    const leaderName = leaderInfo?.userDisplayName || "A leader";
    const grpName = grpInfo?.grpName || "the group";
    const now = new Date().toISOString();
    await Promise.all(recipients.map(uid =>
      supabase.from("NOTIFICATION").insert({
        notiTitle: "Leader Left",
        notiBody: `${leaderName} has left "${grpName}".`,
        "notiDate&Time": now,
        notiIsRead: false,
        userId: uid,
        grpId: Number(grpId)
      })
    ));
  } catch (e) {}
  
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
      `Are you sure you want to remove ${label} from the group? If they have any pending tasks, those task required reassigning.`,
      async () => {
        const supabase = getSupabase();
        const grpId = getGroupId();
        
        // Get info about removed members
        const removedMembers = currentMembers.filter((m) => selectedIds.includes(m.grpmemId));
        const { data: grpInfo } = await supabase.from("GROUP").select("grpName").eq("grpId", grpId).maybeSingle();
        const grpName = grpInfo?.grpName || "the group";
        const now = new Date().toISOString();
        
        // Get current leader's ID
        const { data: { user } } = await supabase.auth.getUser();
        const leaderId = user?.id;
        
        // Get userIds of removed members for evaluator deletion
        const removedUserIds = removedMembers.map(m => m.userId).filter(Boolean);
        
        // Delete in order to avoid foreign key constraint violations
        // 1. Delete peer evaluations (both as evaluated member and as evaluator)
        if (selectedIds.length > 0) {
            await supabase
                .from("PEEREVAL")
                .delete()
                .in("evaluatedGrpmemId", selectedIds);
        }
        
        if (removedUserIds.length > 0) {
            await supabase
                .from("PEEREVAL")
                .delete()
                .in("evaluatorId", removedUserIds);
        }
        
        // 2. Delete submissions
        if (selectedIds.length > 0) {
            await supabase
                .from("SUBMISSION")
                .delete()
                .in("grpmemId", selectedIds);
        }
        
        // 3. Delete task assignments
        if (selectedIds.length > 0) {
            await supabase
                .from("TASKASSIGNMENT")
                .delete()
                .in("grpmemId", selectedIds);
        }
        
        // 3. Delete from GROUPMEMBER directly (no RPC)
        const { error } = await supabase
            .from("GROUPMEMBER")
            .delete()
            .in("grpmemId", selectedIds);
        
        if (error) { showAlert("Failed to remove members: " + error.message, { title: "Error" }); return; }
        
        // Notify removed members
        await Promise.all(removedMembers.map(m =>
          supabase.from("NOTIFICATION").insert({
            notiTitle: "Removed from Group",
            notiBody: `You have been removed from "${grpName}".`,
            "notiDate&Time": now,
            notiIsRead: false,
            userId: m.userId,
            grpId: Number(grpId)
          })
        ));
        
        closeRemoveMembersModal();
        await loadGroupFromDB();
      },
      { title: "Remove Members", confirmText: "Remove", cancelText: "Cancel" }
    );
  });
}

// FIX: topBackBtn is the only back button in the HTML — #backBtn does not exist
if (topBackBtn) topBackBtn.addEventListener("click", () => { window.location.href = "../s.dashb.html"; });

if (projectBreakdownTab) projectBreakdownTab.addEventListener("click", () => {
  const grpId = getGroupId();
  window.location.href = grpId
    ? `s.leadercategory.html?grpId=${grpId}`
    : "s.leadercategory.html";
});

document.querySelector("#mobileBreakdownBtn")?.addEventListener("click", () => {
  const grpId = getGroupId();
  window.location.href = grpId
    ? `s.leadercategory.html?grpId=${grpId}`
    : "s.leadercategory.html";
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

if (leaveBtn)               leaveBtn.addEventListener("click", openSelectLeaderModal);
if (discardSelectLeaderBtn) discardSelectLeaderBtn.addEventListener("click", closeSelectLeaderModal);
if (selectLeaderModalOverlay) selectLeaderModalOverlay.addEventListener("click", (e) => { if (e.target === selectLeaderModalOverlay) closeSelectLeaderModal(); });
if (leaveGroupBtn)          leaveGroupBtn.addEventListener("click", openConfirmLeaveModal);
if (cancelLeaveBtn)         cancelLeaveBtn.addEventListener("click", closeConfirmLeaveModal);
if (confirmLeaveBtn)        confirmLeaveBtn.addEventListener("click", leaveGroup);
if (confirmLeaveModalOverlay) confirmLeaveModalOverlay.addEventListener("click", (e) => { if (e.target === confirmLeaveModalOverlay) closeConfirmLeaveModal(); });

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    safeShowConfirmation(
      "Are you sure you want to log out?",
      () => window.doLogout?.(),
      { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
    );
  });
}

/* ── SIDEBAR PROFILE ─────────────────────────────────────────────────────── */
const loadSidebarProfile = async () => {
  const supabase = getSupabase(); // FIX: use lazy accessor
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
    if (avatarImg && data.avatarPath) { const url = resolveAvatar(data.avatarPath); if (url) avatarImg.src = url; }
  } catch (err) {
    console.error("Failed to load sidebar profile:", err);
  }
};

/* ── INIT ─────────────────────────────────────────────────────────────────── */
loadGroupFromDB();
loadSidebarProfile();
