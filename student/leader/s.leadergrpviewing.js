import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* SUPABASE CONFIG */
const supabaseUrl = "https://rwijmgzxwyrktsjczpbp.supabase.co";
const supabaseKey = "sb_publishable_8zB-1PnnV7wK7WMkC8qgQA_UD0fFfEC";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ELEMENTS */
const topBackBtn = document.querySelector("#topBackBtn");
const backBtn = document.querySelector("#backBtn");
const projectBreakdownTab = document.querySelector("#projectBreakdownTab");

const openAddMembersModalBtn = document.querySelector("#openAddMembersModalBtn");
const addMembersModalOverlay = document.querySelector("#addMembersModalOverlay");
const discardAddMembersBtn = document.querySelector("#discardAddMembersBtn");
const copyGroupLinkBtn = document.querySelector("#copyGroupLinkBtn");
const groupLinkValue = document.querySelector("#groupLinkValue");

const openRemoveMembersModalBtn = document.querySelector("#openRemoveMembersModalBtn");
const removeMembersModalOverlay = document.querySelector("#removeMembersModalOverlay");
const removeMembersList = document.querySelector("#removeMembersList");
const discardRemoveMembersBtn = document.querySelector("#discardRemoveMembersBtn");
const removeMembersBtn = document.querySelector("#removeMembersBtn");

const leaveBtn = document.querySelector("#leaveBtn");
const selectLeaderModalOverlay = document.querySelector("#selectLeaderModalOverlay");
const discardSelectLeaderBtn = document.querySelector("#discardSelectLeaderBtn");
const selectLeaderList = document.querySelector("#selectLeaderList");
const leaveGroupBtn = document.querySelector("#leaveGroupBtn");

const confirmLeaveModalOverlay = document.querySelector("#confirmLeaveModalOverlay");
const cancelLeaveBtn = document.querySelector("#cancelLeaveBtn");
const confirmLeaveBtn = document.querySelector("#confirmLeaveBtn");

const logoutBtn = document.querySelector(".logout");

const STORAGE_KEY_LEADER_GROUP = "hive_leader_group";

/* TEMP DEFAULT DATA */
const defaultLeaderGroupData = () => ({
  groupName: "Group Name",
  subject: "Subject Name",
  stats: {
    teacher: 0,
    members: 0,
    projects: 0,
  },
  leader: {
    name: "Leader Name",
    role: "Leader",
    email: "leader@email.com",
    totalTasks: 0,
    completed: 0,
    pending: 0,
    missed: 0,
  },
  members: [],
});

/* LOCAL STORAGE */
const loadLeaderGroupData = () => {
  const saved = localStorage.getItem(STORAGE_KEY_LEADER_GROUP);

  try {
    return saved ? JSON.parse(saved) : defaultLeaderGroupData();
  } catch {
    return defaultLeaderGroupData();
  }
};

const saveLeaderGroupData = (data) => {
  localStorage.setItem(STORAGE_KEY_LEADER_GROUP, JSON.stringify(data));
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

/* APPLY LOCAL UI DATA */
const applyLeaderGroupData = (data) => {
  const groupLabelH2 = document.querySelector(".group-label h2");
  const groupLabelP = document.querySelector(".group-label p");

  if (groupLabelH2) groupLabelH2.textContent = data.groupName || "Group Name";
  if (groupLabelP) groupLabelP.textContent = data.subject || "Subject Name";

  const summaryH3s = document.querySelectorAll(".summary-card h3");

  if (summaryH3s[0]) summaryH3s[0].textContent = data.stats?.teacher ?? 0;
  if (summaryH3s[1]) summaryH3s[1].textContent = data.stats?.members ?? 0;
  if (summaryH3s[2]) summaryH3s[2].textContent = getProjectsCount();

  const leaderCard = document.querySelector(".leader-card .member-details");

  if (leaderCard && data.leader) {
    const info = leaderCard.querySelector(".member-info");
    const stats = leaderCard.querySelector(".stats");

    if (info) {
      const name = info.querySelector("h3");
      const ps = info.querySelectorAll("p");

      if (name) name.textContent = data.leader.name || "Leader Name";
      if (ps[0]) ps[0].textContent = data.leader.role || "Leader";
      if (ps[1]) ps[1].textContent = data.leader.email || "leader@email.com";
    }

    if (stats) {
      const ps = stats.querySelectorAll("p");

      if (ps[0]) ps[0].textContent = `Total Tasks: ${data.leader.totalTasks ?? 0}`;
      if (ps[1]) ps[1].textContent = `Completed: ${data.leader.completed ?? 0}`;
      if (ps[2]) ps[2].textContent = `Pending: ${data.leader.pending ?? 0}`;
      if (ps[3]) ps[3].textContent = `Missed: ${data.leader.missed ?? 0}`;
    }
  }

  const memberCards = document.querySelectorAll(".member-card .member-details");

  (data.members || []).forEach((member, i) => {
    const card = memberCards[i];
    if (!card) return;

    const info = card.querySelector(".member-info");
    const stats = card.querySelector(".stats");

    if (info) {
      const name = info.querySelector("h3");
      const ps = info.querySelectorAll("p");

      if (name) name.textContent = member.name || "Member Name";
      if (ps[0]) ps[0].textContent = member.role || "Member";
      if (ps[1]) ps[1].textContent = member.email || "member@email.com";
    }

    if (stats) {
      const ps = stats.querySelectorAll("p");

      if (ps[0]) ps[0].textContent = `Total Tasks: ${member.totalTasks ?? 0}`;
      if (ps[1]) ps[1].textContent = `Completed: ${member.completed ?? 0}`;
      if (ps[2]) ps[2].textContent = `Pending: ${member.pending ?? 0}`;
      if (ps[3]) ps[3].textContent = `Missed: ${member.missed ?? 0}`;
    }
  });
};

/* LOAD REAL SUPABASE STATS */
const getGroupId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("grpId") || localStorage.getItem("grpId") || 1;
};

const loadDashboardStats = async () => {
  const grpId = getGroupId();

  const { data, error } = await supabase
    .from("DASHBOARD_STATS")
    .select("*")
    .eq("grpId", grpId)
    .single();

    

    console.log("Dashboard data:", data);
    console.log("Dashboard error:", error);

  if (error) {
    console.error("Error loading group info:", error);
    return;
  }

  document.querySelector(".group-label h2").textContent = data.grpName || "Group Name";
  document.querySelector(".group-label p").textContent = data.subjectName || data.subject || "Subject";

  const summaryH3s = document.querySelectorAll(".summary-card h3");
  summaryH3s[0].textContent = data.totalTeachers ?? 0;
  summaryH3s[1].textContent = data.totalMembers ?? 0;
  summaryH3s[2].textContent = data.totalProjects ?? 0;

  renderGroupMembers(data.members || []);
};

const renderGroupMembers = (members) => {
  const container = document.querySelector("#groupInfoStack");
  if (!container) return;

  const teacher = members.find(m => String(m.roleName).toLowerCase() === "teacher");
  const leader = members.find(m => String(m.roleName).toLowerCase() === "leader");
  const normalMembers = members.filter(m => {
    const role = String(m.roleName).toLowerCase();
    return role !== "teacher" && role !== "leader";
  });

  container.innerHTML = `
    <article class="info-card teacher-card">
      <div class="circle-avatar small"></div>
      <h3>${teacher ? `${teacher.fullName}<br><small>${teacher.email}</small>` : "You currently have no teacher"}</h3>
    </article>

    ${
      leader
        ? createMemberCard(leader, "leader-card", "large")
        : `<article class="info-card leader-card"><h3>No leader found</h3></article>`
    }

    <div class="member-grid">
      ${normalMembers.map(member => createMemberCard(member, "member-card", "medium")).join("")}
    </div>
  `;
};

const createMemberCard = (member, cardClass, avatarSize) => {
  return `
    <article class="info-card ${cardClass}">
      <div class="circle-avatar ${avatarSize}"></div>
      <div class="member-details">
        <div class="member-info">
          <h3>${member.fullName || "No Name"}</h3>
          <p>${member.roleName || "Member"}</p>
          <p>${member.email || "No email"}</p>
        </div>
        <div class="stats">
          <p>Total Tasks: ${member.totalTasks ?? 0}</p>
          <p>Completed: ${member.completedTasks ?? 0}</p>
          <p>Pending: ${member.pendingTasks ?? 0}</p>
          <p>Missed: ${member.missedTasks ?? 0}</p>
        </div>
      </div>
    </article>
  `;
};

/* GROUP LINK */
const getGroupLink = () => {
  const saved = loadLeaderGroupData();
  const groupName = (saved.groupName || "group")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  return `https://hive.app/group/${groupName}`;
};

/* ADD MEMBERS MODAL */
const closeAddMembersModal = () => {
  if (!addMembersModalOverlay) return;

  addMembersModalOverlay.classList.remove("open");
  addMembersModalOverlay.setAttribute("aria-hidden", "true");
};

const openAddMembersModal = () => {
  if (!addMembersModalOverlay) return;

  if (groupLinkValue) {
    groupLinkValue.value = getGroupLink();
  }

  addMembersModalOverlay.classList.add("open");
  addMembersModalOverlay.setAttribute("aria-hidden", "false");
};

/* SELECT LEADER MODAL */
const closeSelectLeaderModal = () => {
  if (!selectLeaderModalOverlay) return;

  selectLeaderModalOverlay.classList.remove("open");
  selectLeaderModalOverlay.setAttribute("aria-hidden", "true");
};

const updateLeaveGroupBtnState = () => {
  if (!leaveGroupBtn || !selectLeaderList) return;

  const selectedLeader = selectLeaderList.querySelector("input[type='radio']:checked");
  leaveGroupBtn.disabled = !selectedLeader;
};

const renderSelectLeaderList = () => {
  if (!selectLeaderList) return;

  const data = loadLeaderGroupData();

  const eligibleMembers = (data.members || []).filter((member) => {
    const role = (member.role || "").trim().toLowerCase();
    return role !== "leader" && role !== "teacher" && role !== "professor";
  });

  if (eligibleMembers.length === 0) {
    selectLeaderList.innerHTML =
      "<p class='select-leader-empty'>No eligible members found to become leader.</p>";

    if (leaveGroupBtn) leaveGroupBtn.disabled = true;
    return;
  }

  selectLeaderList.innerHTML = eligibleMembers
    .map(
      (member) => `
        <label class="select-leader-item">
          <input type="radio" name="newLeader" value="${member.name}">
          <span>${member.name}</span>
        </label>
      `
    )
    .join("");

  selectLeaderList.querySelectorAll("input[type='radio']").forEach((radio) => {
    radio.addEventListener("change", updateLeaveGroupBtnState);
  });

  updateLeaveGroupBtnState();
};

const openSelectLeaderModal = () => {
  if (!selectLeaderModalOverlay) return;

  renderSelectLeaderList();
  selectLeaderModalOverlay.classList.add("open");
  selectLeaderModalOverlay.setAttribute("aria-hidden", "false");
};

/* CONFIRM LEAVE */
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

const leaveGroup = () => {
  const data = loadLeaderGroupData();

  if (!selectLeaderList) return;

  const selectedLeader = selectLeaderList.querySelector("input[type='radio']:checked");
  if (!selectedLeader) return;

  const newLeaderName = selectedLeader.value;

  data.members = (data.members || []).map((member) => {
    if (member.name === newLeaderName) {
      return { ...member, role: "Leader" };
    }

    return member;
  });

  const oldLeader = { ...data.leader, role: "Member" };

  data.members.push(oldLeader);
  data.leader = data.members.find((m) => m.name === newLeaderName);
  data.members = data.members.filter((m) => m.name !== newLeaderName);

  saveLeaderGroupData(data);
  applyLeaderGroupData(data);
  closeConfirmLeaveModal();

  window.location.href = "../s.dashb.html";
};

/* REMOVE MEMBERS */
const updateRemoveMembersBtnState = () => {
  if (!removeMembersBtn || !removeMembersList) return;

  const selectedCount = removeMembersList.querySelectorAll(
    "input[type='checkbox']:checked"
  ).length;

  removeMembersBtn.disabled = selectedCount === 0;
};

const renderRemoveMembersList = () => {
  if (!removeMembersList) return;

  const data = loadLeaderGroupData();

  const removableMembers = (data.members || []).filter((member) => {
    const role = (member.role || "").trim().toLowerCase();
    return role !== "leader" && role !== "teacher" && role !== "professor";
  });

  if (removableMembers.length === 0) {
    removeMembersList.innerHTML =
      "<p class='remove-members-empty'>No removable members found.</p>";

    if (removeMembersBtn) removeMembersBtn.disabled = true;
    return;
  }

  removeMembersList.innerHTML = removableMembers
    .map(
      (member) => `
        <label class="remove-member-item">
          <input type="checkbox" value="${member.name}">
          <span>${member.name}</span>
        </label>
      `
    )
    .join("");

  removeMembersList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", updateRemoveMembersBtnState);
  });

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

/* CONFIRMATION FALLBACK */
const safeShowConfirmation = (message, onConfirm, options = {}) => {
  if (typeof showConfirmation === "function") {
    showConfirmation(message, onConfirm, options);
  } else {
    const confirmed = confirm(message);
    if (confirmed) onConfirm();
  }
};

/* EVENTS */
if (openRemoveMembersModalBtn) {
  openRemoveMembersModalBtn.addEventListener("click", openRemoveMembersModal);
}

if (discardRemoveMembersBtn) {
  discardRemoveMembersBtn.addEventListener("click", closeRemoveMembersModal);
}

if (removeMembersModalOverlay) {
  removeMembersModalOverlay.addEventListener("click", (event) => {
    if (event.target === removeMembersModalOverlay) closeRemoveMembersModal();
  });
}

if (removeMembersBtn) {
  removeMembersBtn.addEventListener("click", () => {
    if (!removeMembersList) return;

    const selectedNames = Array.from(
      removeMembersList.querySelectorAll("input[type='checkbox']:checked")
    ).map((input) => input.value);

    if (selectedNames.length === 0) return;

    const memberText =
      selectedNames.length === 1 ? `"${selectedNames[0]}"` : `${selectedNames.length} members`;

    safeShowConfirmation(
      `Are you sure you want to remove ${memberText} from the group?`,
      () => {
        const data = loadLeaderGroupData();

        data.members = (data.members || []).filter(
          (member) => !selectedNames.includes(member.name)
        );

        data.stats.members = data.members.length + 1;

        saveLeaderGroupData(data);
        applyLeaderGroupData(data);
        closeRemoveMembersModal();
      },
      {
        title: "Remove Members",
        confirmText: "Remove",
        cancelText: "Cancel",
      }
    );
  });
}

if (topBackBtn) {
  topBackBtn.addEventListener("click", () => {
    window.location.href = "../s.dashb.html";
  });
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "../s.dashb.html";
  });
}

if (projectBreakdownTab) {
  projectBreakdownTab.addEventListener("click", () => {
    window.location.href = "s.leadercategory.html";
  });
}

if (openAddMembersModalBtn) {
  openAddMembersModalBtn.addEventListener("click", openAddMembersModal);
}

if (discardAddMembersBtn) {
  discardAddMembersBtn.addEventListener("click", closeAddMembersModal);
}

if (addMembersModalOverlay) {
  addMembersModalOverlay.addEventListener("click", (event) => {
    if (event.target === addMembersModalOverlay) closeAddMembersModal();
  });
}

if (copyGroupLinkBtn) {
  copyGroupLinkBtn.addEventListener("click", async () => {
    if (!groupLinkValue) return;

    const link = groupLinkValue.value;
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);

      copyGroupLinkBtn.textContent = "Copied";

      setTimeout(() => {
        copyGroupLinkBtn.textContent = "Copy";
      }, 1200);
    } catch {
      groupLinkValue.select();
      document.execCommand("copy");

      copyGroupLinkBtn.textContent = "Copied";

      setTimeout(() => {
        copyGroupLinkBtn.textContent = "Copy";
      }, 1200);
    }
  });
}

if (leaveBtn) {
  leaveBtn.addEventListener("click", openSelectLeaderModal);
}

if (discardSelectLeaderBtn) {
  discardSelectLeaderBtn.addEventListener("click", closeSelectLeaderModal);
}

if (selectLeaderModalOverlay) {
  selectLeaderModalOverlay.addEventListener("click", (event) => {
    if (event.target === selectLeaderModalOverlay) closeSelectLeaderModal();
  });
}

if (leaveGroupBtn) {
  leaveGroupBtn.addEventListener("click", openConfirmLeaveModal);
}

if (cancelLeaveBtn) {
  cancelLeaveBtn.addEventListener("click", closeConfirmLeaveModal);
}

if (confirmLeaveBtn) {
  confirmLeaveBtn.addEventListener("click", leaveGroup);
}

if (confirmLeaveModalOverlay) {
  confirmLeaveModalOverlay.addEventListener("click", (event) => {
    if (event.target === confirmLeaveModalOverlay) closeConfirmLeaveModal();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    safeShowConfirmation(
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

/* INITIAL LOAD */
loadDashboardStats();