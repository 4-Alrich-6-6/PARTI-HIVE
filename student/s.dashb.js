const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector("#sidebar");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

// ─── DB: load groups from Supabase ───────────────────────────────────────────
let dashbData = { ownedGroups: [], joinedGroups: [], stats: { owned: 0, joined: 0, pending: 0 } };

// ─── Helper: Get pending task count for current user ───────────────────────
const getUserPendingTaskCount = async (userId) => {
    const supabase = window.hiveSupabase;
    if (!supabase) return 0;

    try {
        // Get all group memberships for this user
        const { data: memberships } = await supabase
            .from("GROUPMEMBER")
            .select("grpmemId")
            .eq("userId", userId);

        if (!memberships?.length) return 0;

        const grpmemIds = memberships.map(m => m.grpmemId);

        // Get all task assignments
        const { data: assignments } = await supabase
            .from("TASKASSIGNMENT")
            .select("taskId")
            .in("grpmemId", grpmemIds);

        if (!assignments?.length) return 0;

        const taskIds = [...new Set(assignments.map(a => a.taskId))];

        // Get all tasks and filter by status
        const { data: tasks } = await supabase
            .from("TASK")
            .select("statId")
            .in("taskId", taskIds);

        if (!tasks) return 0;

        // Count pending tasks (statId !== 5 for finished, !== 6 for missed)
        const pendingCount = tasks.filter(t => t.statId !== 5 && t.statId !== 6).length;
        return pendingCount;
    } catch (err) {
        console.error("Error fetching pending task count:", err);
        return 0;
    }
};

const loadDashbData = async () => {
    const supabase = window.hiveSupabase;
    if (!supabase) return;

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!user || userErr) return;

    // Fetch all group memberships for this user, joining GROUP and ROLE
    const { data: memberships, error } = await supabase
        .from("GROUPMEMBER")
        .select("grpId, roleId, ROLE(roleName), GROUP(grpId, grpName, grpSubject)")
        .eq("userId", user.id);

    console.log("Student group memberships fetched:", memberships, "Error:", error);

    const ownedGroups = [];
    const joinedGroups = [];

    for (const m of memberships) {
        const grp = m.GROUP;
        if (!grp) continue;

        // Count members in the group - ensure grpId is a number
        const grpId = Number(grp.grpId);
        const { count: memberCount, error: countErr } = await supabase
            .from("GROUPMEMBER")
            .select("grpmemId", { count: "exact", head: true })
            .eq("grpId", grpId);

        if (countErr) {
            console.error(`Error counting members for group ${grpId}:`, countErr);
        }

        console.log(`Group ${grpId}:`, grp.grpName, "Role:", m.ROLE?.roleName, "RoleId:", m.roleId, "Members:", memberCount);

        const groupObj = {
            grpId: grpId,
            name: grp.grpName || "Unnamed Group",
            subject: grp.grpSubject || "",
            members: (memberCount !== null && memberCount !== undefined) ? memberCount : 0
        };

        if (m.ROLE?.roleName === "Leader") {
            ownedGroups.push(groupObj);
        } else {
            joinedGroups.push(groupObj);
        }
    }

    dashbData = {
        ownedGroups,
        joinedGroups,
        stats: { owned: ownedGroups.length, joined: joinedGroups.length, pending: await getUserPendingTaskCount(user.id) }
    };

    applyDashbData(dashbData);
};

const applyDashbData = (data) => {
    const ownedGroupsList = document.querySelector("#ownedGroupsList");
    const joinedGroupsList = document.querySelector("#joinedGroupsList");
    const statCards = document.querySelectorAll(".stat-card h3");

    const createGroupCard = (group, isOwned) => {
        const card = document.createElement("article");
        card.className = "group-card " + (isOwned ? "open-group-view" : "open-member-group-view");
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.innerHTML = `
            <div class="group-info">
                <h3>${group.name}</h3>
                <p>${group.subject}</p>
            </div>
            <div class="card-right">
                <strong>Occupied Members : ${group.members}</strong>
                ${isOwned ? '<button class="more-btn" type="button" aria-label="Edit owned group">•••</button>' : ''}
            </div>
        `;
        card.addEventListener("click", () => {
            sessionStorage.setItem("hive_grpId", String(group.grpId));
            sessionStorage.setItem("hive_grpName", group.name);
            window.location.href = isOwned
                ? "leader/s.leadergrpviewing.html"
                : "member/s.membergrpviewing.html";
        });
        if (isOwned) {
            const moreBtn = card.querySelector(".more-btn");
            moreBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openEditOwnedGroupModal(group);
            });
        }
        return card;
    };

    if (ownedGroupsList) {
        if (!data.ownedGroups || data.ownedGroups.length === 0) {
            ownedGroupsList.innerHTML = `
                <div class="empty-state">
                    <img src="../assets/AddGroup.png" class="empty-state-icon" alt="No groups">
                    <h3>No Owned Groups</h3>
                    <p>You haven't created any groups yet. Click "Add Groups" to get started!</p>
                </div>
            `;
        } else {
            ownedGroupsList.innerHTML = "";
            data.ownedGroups.forEach(group => {
                ownedGroupsList.appendChild(createGroupCard(group, true));
            });
        }
    }

    if (joinedGroupsList) {
        if (!data.joinedGroups || data.joinedGroups.length === 0) {
            joinedGroupsList.innerHTML = `
                <div class="empty-state">
                    <img src="../assets/JoinGroup.png" class="empty-state-icon" alt="No groups">
                    <h3>No Joined Groups</h3>
                    <p>You haven't joined any groups yet. Use "Join Groups" with an invite link!</p>
                </div>
            `;
        } else {
            joinedGroupsList.innerHTML = "";
            data.joinedGroups.forEach(group => {
                joinedGroupsList.appendChild(createGroupCard(group, false));
            });
        }
    }

    if (statCards[0]) statCards[0].textContent = (data.ownedGroups || []).length;
    if (statCards[1]) statCards[1].textContent = (data.joinedGroups || []).length;
    if (statCards[2]) statCards[2].textContent = data.stats.pending || 0;
};

// Load on page start
loadDashbData();

// ─── Modals & Buttons ─────────────────────────────────────────────────────────
const addGroupModal = document.querySelector("#addGroupModal");
const openAddGroupModalBtn = document.querySelector("#openAddGroupModal");
const discardAddGroupBtn = document.querySelector("#discardAddGroup");
const createAddGroupBtn = document.querySelector("#createAddGroup");
const groupNameInput = document.querySelector("#groupNameInput");
const groupSubjectInput = document.querySelector("#groupSubjectInput");
const joinGroupModal = document.querySelector("#joinGroupModal");
const openJoinGroupModalBtn = document.querySelector("#openJoinGroupModal");
const discardJoinGroupBtn = document.querySelector("#discardJoinGroup");
const joinGroupBtn = document.querySelector("#joinGroupBtn");
const groupLinkInput = document.querySelector("#groupLinkInput");
const openEditOwnedGroupModalBtn = document.querySelector("#openEditOwnedGroupModal");
const editOwnedGroupModal = document.querySelector("#editOwnedGroupModal");
const discardEditOwnedGroupBtn = document.querySelector("#discardEditOwnedGroup");
const saveEditOwnedGroupBtn = document.querySelector("#saveEditOwnedGroup");
const editOwnedGroupNameInput = document.querySelector("#editOwnedGroupNameInput");
const editOwnedGroupSubjectInput = document.querySelector("#editOwnedGroupSubjectInput");

const updateAddGroupCreateState = () => {
    if (!createAddGroupBtn) return;
    const hasGroupName = groupNameInput && groupNameInput.value.trim().length > 0;
    const hasSubjectName = groupSubjectInput && groupSubjectInput.value.trim().length > 0;
    createAddGroupBtn.disabled = !(hasGroupName && hasSubjectName);
};

const updateJoinGroupState = () => {
    if (!joinGroupBtn) return;
    const hasGroupLink = groupLinkInput && groupLinkInput.value.trim().length > 0;
    joinGroupBtn.disabled = !hasGroupLink;
};

const updateEditOwnedGroupState = () => {
    if (!saveEditOwnedGroupBtn) return;
    const hasGroupName = editOwnedGroupNameInput && editOwnedGroupNameInput.value.trim().length > 0;
    const hasSubjectName = editOwnedGroupSubjectInput && editOwnedGroupSubjectInput.value.trim().length > 0;
    saveEditOwnedGroupBtn.disabled = !(hasGroupName && hasSubjectName);
};

const closeAddGroupModal = () => {
    if (!addGroupModal) return;
    addGroupModal.classList.remove("open");
    addGroupModal.setAttribute("aria-hidden", "true");
};

const openAddGroupModal = () => {
    if (!addGroupModal) return;
    addGroupModal.classList.add("open");
    addGroupModal.setAttribute("aria-hidden", "false");
    if (groupNameInput) { groupNameInput.value = ""; groupNameInput.focus(); }
    if (groupSubjectInput) groupSubjectInput.value = "";
    updateAddGroupCreateState();
};

if (openAddGroupModalBtn) openAddGroupModalBtn.addEventListener("click", openAddGroupModal);
if (discardAddGroupBtn) discardAddGroupBtn.addEventListener("click", closeAddGroupModal);
if (groupNameInput) groupNameInput.addEventListener("input", updateAddGroupCreateState);
if (groupSubjectInput) groupSubjectInput.addEventListener("input", updateAddGroupCreateState);
if (addGroupModal) addGroupModal.addEventListener("click", (e) => { if (e.target === addGroupModal) closeAddGroupModal(); });

if (createAddGroupBtn) {
    createAddGroupBtn.addEventListener("click", () => {
        const groupName = groupNameInput ? groupNameInput.value.trim() : "";
        const subjectName = groupSubjectInput ? groupSubjectInput.value.trim() : "";
        if (!groupName || !subjectName) return;
        showConfirmation(
            `Are you sure you want to create the group "${groupName}"?`,
            async () => {
                const supabase = window.hiveSupabase;
                if (!supabase) { showAlert("Cannot connect to database.", { title: "Connection Error" }); return; }

                const { data: { user }, error: userErr } = await supabase.auth.getUser();
                if (!user || userErr) { showAlert("You must be logged in to create a group.", { title: "Not Logged In" }); return; }

                const { data: newGroup, error: grpErr } = await supabase
                    .from("GROUP")
                    .insert({ grpName: groupName, grpSubject: subjectName })
                    .select("grpId").single();
                if (grpErr || !newGroup) { showAlert("Failed to create group: " + (grpErr?.message || "Unknown error"), { title: "Error" }); return; }

                const { data: leaderRole, error: roleErr } = await supabase
                    .from("ROLE").select("roleId").eq("roleName", "Leader").maybeSingle();
                if (roleErr || !leaderRole) {
                    showAlert("Could not find Leader role. Group has been removed.", { title: "Setup Error" });
                    await supabase.from("GROUP").delete().eq("grpId", newGroup.grpId);
                    return;
                }

                const { error: memErr } = await supabase
                    .from("GROUPMEMBER")
                    .insert({ userId: user.id, grpId: newGroup.grpId, roleId: leaderRole.roleId });
                if (memErr) { showAlert("Group created but failed to assign Leader role: " + memErr.message, { title: "Error" }); return; }

                closeAddGroupModal();
                await loadDashbData(); // refresh from DB
            },
            { title: "Create Group", confirmText: "Create", cancelText: "Cancel" }
        );
    });
}

const closeJoinGroupModal = () => {
    if (!joinGroupModal) return;
    joinGroupModal.classList.remove("open");
    joinGroupModal.setAttribute("aria-hidden", "true");
};

const openJoinGroupModal = () => {
    if (!joinGroupModal) return;
    joinGroupModal.classList.add("open");
    joinGroupModal.setAttribute("aria-hidden", "false");
    if (groupLinkInput) { groupLinkInput.value = ""; groupLinkInput.focus(); }
    updateJoinGroupState();
};

if (openJoinGroupModalBtn) openJoinGroupModalBtn.addEventListener("click", openJoinGroupModal);
if (discardJoinGroupBtn) discardJoinGroupBtn.addEventListener("click", closeJoinGroupModal);
if (groupLinkInput) groupLinkInput.addEventListener("input", updateJoinGroupState);
if (joinGroupModal) joinGroupModal.addEventListener("click", (e) => { if (e.target === joinGroupModal) closeJoinGroupModal(); });

if (joinGroupBtn) {
    joinGroupBtn.addEventListener("click", () => {
        const groupLink = groupLinkInput ? groupLinkInput.value.trim() : "";
        if (!groupLink) return;
        showConfirmation(
            "Are you sure you want to join this group?",
            async () => {
                const supabase = window.hiveSupabase;
                if (!supabase) { showAlert("Cannot connect to database.", { title: "Connection Error" }); return; }

                // Extract group ID from URL or use as-is if numeric
                let grpId;
                if (groupLink.includes("?invite=")) {
                    // Extract from URL like: domain/student/join-group.html?invite=123
                    const url = new URL(groupLink);
                    grpId = Number(url.searchParams.get("invite"));
                } else if (groupLink.includes("invite=")) {
                    // Handle URL without full domain
                    const match = groupLink.match(/invite=(\d+)/);
                    grpId = match ? Number(match[1]) : Number(groupLink);
                } else {
                    // Assume it's just the numeric ID
                    grpId = Number(groupLink);
                }

                if (!grpId || isNaN(grpId)) { showAlert("Invalid group link. Please enter a valid invite link or numeric group ID.", { title: "Invalid Link" }); return; }

                const { data: { user }, error: userErr } = await supabase.auth.getUser();
                if (!user || userErr) { showAlert("You must be logged in.", { title: "Not Logged In" }); return; }

                // Check group exists
                const { data: grp, error: grpErr } = await supabase
                    .from("GROUP").select("grpId, grpName").eq("grpId", grpId).maybeSingle();
                if (grpErr || !grp) { showAlert("Group not found. Check the invite link and try again.", { title: "Not Found" }); return; }

                // Check not already a member
                const { data: existing } = await supabase
                    .from("GROUPMEMBER").select("grpmemId").eq("userId", user.id).eq("grpId", grpId).maybeSingle();
                if (existing) { showAlert("You are already a member of this group.", { title: "Already Joined" }); closeJoinGroupModal(); return; }

                const { data: memberRole } = await supabase
                    .from("ROLE").select("roleId").eq("roleName", "Member").maybeSingle();

                const { error: memErr } = await supabase
                    .from("GROUPMEMBER")
                    .insert({ userId: user.id, grpId: grpId, roleId: memberRole?.roleId || null });
                if (memErr) { showAlert("Failed to join group: " + memErr.message, { title: "Error" }); return; }

                // Notify all existing members + teacher that someone new joined
                (async () => {
                    try {
                        const [{ data: existingMembers }, { data: groupInfo }, { data: joinerProfile }] = await Promise.all([
                            supabase.from("GROUPMEMBER").select("userId").eq("grpId", grpId).neq("userId", user.id),
                            supabase.from("GROUP").select("grpName, teacherId").eq("grpId", grpId).maybeSingle(),
                            supabase.from("USER").select("userDisplayName").eq("userId", user.id).maybeSingle()
                        ]);
                        const recipients = new Set((existingMembers || []).map(m => m.userId));
                        if (groupInfo?.teacherId && groupInfo.teacherId !== user.id) recipients.add(groupInfo.teacherId);
                        const joinerName = joinerProfile?.userDisplayName || "A new member";
                        const grpName = groupInfo?.grpName || "the group";
                        const now = new Date().toISOString();
                        await Promise.all([...recipients].map(uid =>
                            supabase.from("NOTIFICATION").insert({
                                notiTitle: "New Member Joined",
                                notiBody: `${joinerName} has joined "${grpName}".`,
                                "notiDate&Time": now,
                                notiIsRead: false,
                                userId: uid,
                                grpId: Number(grpId)
                            })
                        ));
                    } catch (e) {}
                })();

                closeJoinGroupModal();
                await loadDashbData(); // refresh from DB
            },
            { title: "Join Group", confirmText: "Join", cancelText: "Cancel" }
        );
    });
}

const closeEditOwnedGroupModal = () => {
    if (!editOwnedGroupModal) return;
    editOwnedGroupModal.classList.remove("open");
    editOwnedGroupModal.setAttribute("aria-hidden", "true");
};

const openEditOwnedGroupModal = (group) => {
    if (!editOwnedGroupModal) return;
    if (editOwnedGroupNameInput) editOwnedGroupNameInput.value = group.name;
    if (editOwnedGroupSubjectInput) editOwnedGroupSubjectInput.value = group.subject;
    editOwnedGroupModal.dataset.editingGrpId = group.grpId;
    updateEditOwnedGroupState();
    editOwnedGroupModal.classList.add("open");
    editOwnedGroupModal.setAttribute("aria-hidden", "false");
};

if (openEditOwnedGroupModalBtn) {
    openEditOwnedGroupModalBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (dashbData.ownedGroups && dashbData.ownedGroups.length > 0) {
            openEditOwnedGroupModal(dashbData.ownedGroups[0]);
        }
    });
}

if (discardEditOwnedGroupBtn) discardEditOwnedGroupBtn.addEventListener("click", closeEditOwnedGroupModal);
if (editOwnedGroupNameInput) editOwnedGroupNameInput.addEventListener("input", updateEditOwnedGroupState);
if (editOwnedGroupSubjectInput) editOwnedGroupSubjectInput.addEventListener("input", updateEditOwnedGroupState);
if (editOwnedGroupModal) editOwnedGroupModal.addEventListener("click", (e) => { if (e.target === editOwnedGroupModal) closeEditOwnedGroupModal(); });

if (saveEditOwnedGroupBtn) {
    saveEditOwnedGroupBtn.addEventListener("click", () => {
        const newName = editOwnedGroupNameInput ? editOwnedGroupNameInput.value.trim() : "";
        const newSubject = editOwnedGroupSubjectInput ? editOwnedGroupSubjectInput.value.trim() : "";
        const grpId = editOwnedGroupModal.dataset.editingGrpId;
        if (!newName || !newSubject || !grpId) return;
        showConfirmation(
            `Are you sure you want to save changes to "${newName}"?`,
            async () => {
                const supabase = window.hiveSupabase;
                const { error } = await supabase
                    .from("GROUP")
                    .update({ grpName: newName, grpSubject: newSubject })
                    .eq("grpId", Number(grpId));
                if (error) { showAlert("Failed to save: " + error.message, { title: "Error" }); return; }
                closeEditOwnedGroupModal();
                await loadDashbData();
            },
            { title: "Save Changes", confirmText: "Save", cancelText: "Cancel" }
        );
    });
}

updateAddGroupCreateState();
updateJoinGroupState();
updateEditOwnedGroupState();

const notifBtns = document.querySelectorAll(".notif-btn, .notif-btn-mobile");
notifBtns.forEach((btn) => {
    btn.addEventListener("click", () => { window.location.href = "s.notification.html"; });
});

const checkUnreadNotifications = async () => {
    const supabase = window.hiveSupabase;
    if (!supabase) return;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { count } = await supabase
            .from("NOTIFICATION")
            .select("notiId", { count: "exact", head: true })
            .eq("userId", user.id)
            .eq("notiIsRead", false);
        const hasUnread = (count || 0) > 0;
        document.querySelectorAll(".notif-badge").forEach(b => b.classList.toggle("has-unread", hasUnread));
    } catch (e) {}
};

checkUnreadNotifications();

const logoutBtn = document.querySelector(".logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        showConfirmation(
            "Are you sure you want to log out?",
            () => window.doLogout?.(),
            { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
        );
    });
}
