const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector("#sidebar");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

// ─── DB: load groups from Supabase ───────────────────────────────────────────
let dashbData = {
    groups: [],
    stats: { groups: 0 }
};

const loadDashbData = async () => {
    const supabase = window.hiveSupabase;
    if (!supabase) {
        console.error("Supabase not initialized");
        return;
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!user || userErr) {
        console.error("Cannot get current user:", userErr);
        return;
    }

    console.log("Loading dashboard for teacher:", user.id, "Type:", typeof user.id);

    // Debug: Test if RLS is blocking queries
    const { data: testQuery, error: testErr } = await supabase
        .from("GROUPMEMBER")
        .select("*", { count: "exact", head: true });
    
    console.log("RLS test - Total GROUPMEMBER records accessible:", testQuery, "Error:", testErr);

    // Debug: Check ALL GROUPMEMBER records to see what's in the table
    const { data: allMembers, error: allMembersErr } = await supabase
        .from("GROUPMEMBER")
        .select("grpmemId, userId, grpId, roleId");
    
    console.log("All GROUPMEMBER records in database:", allMembers, "Error:", allMembersErr);

    // Debug: Check if current teacher has ANY records in GROUPMEMBER
    const { data: teacherMemberships, error: teacherMemErr } = await supabase
        .from("GROUPMEMBER")
        .select("grpmemId, userId, grpId, roleId")
        .eq("userId", user.id);
    
    console.log("Teacher's raw GROUPMEMBER records:", teacherMemberships, "Error:", teacherMemErr);

    const { data: memberships, error } = await supabase
        .from("GROUPMEMBER")
        .select("grpId, roleId, ROLE(roleName), GROUP(grpId, grpName, grpSubject)")
        .eq("userId", user.id);

    console.log("Teacher group memberships fetched (with joins):", memberships, "Error:", error);

    if (error) {
        console.error("Error fetching memberships:", error);
        return;
    }
    
    if (!memberships || memberships.length === 0) {
        console.log("No group memberships found for this teacher");
        dashbData = { groups: [], stats: { groups: 0 } };
        applyDashbData(dashbData);
        return;
    }

    const groups = [];
    for (const m of memberships) {
        console.log("Processing membership:", m);
        
        if (!m.GROUP) {
            console.warn("GROUP is null for membership:", m);
            continue;
        }
        
        const grp = m.GROUP;
        
        // Count members in the group - ensure grpId is a number
        const grpId = Number(grp.grpId);
        const { count: memberCount, error: countErr } = await supabase
            .from("GROUPMEMBER")
            .select("grpmemId", { count: "exact", head: true })
            .eq("grpId", grpId);

        if (countErr) {
            console.error(`Error counting members for group ${grpId}:`, countErr);
        }

        console.log(`Group ${grpId}:`, grp.grpName, "Members:", memberCount, "Teacher role:", m.ROLE?.roleName);

        groups.push({
            grpId: grpId,
            name: grp.grpName || "Unnamed Group",
            subject: grp.grpSubject || "",
            members: (memberCount !== null && memberCount !== undefined) ? memberCount : 0
        });
    }

    console.log("Final groups list:", groups);
    dashbData = { groups, stats: { groups: groups.length } };
    applyDashbData(dashbData);
};

const applyDashbData = (data) => {
    console.log("applyDashbData called with:", data);
    
    const groupsList = document.querySelector("#groupsList");
    console.log("Found groupsList:", groupsList);
    
    if (!groupsList) {
        console.warn("groupsList element not found!");
        return;
    }
    
    if (data.groups && data.groups.length > 0) {
        // Display first group (teachers only have one group)
        const grp = data.groups[0];
        console.log("Rendering group:", grp);
        
        groupsList.innerHTML = `
            <article class="group-card open-member-group-view">
                <div class="group-info">
                    <h3>${grp.name}</h3>
                    <p>${grp.subject}</p>
                </div>
                <div class="card-right">
                    <strong>Occupied Members : ${grp.members}</strong>
                </div>
            </article>
        `;
        
        const card = groupsList.querySelector(".open-member-group-view");
        if (card) {
            card.dataset.grpId = grp.grpId;
            card.addEventListener("click", () => {
                sessionStorage.setItem("hive_grpId", String(grp.grpId));
                sessionStorage.setItem("hive_grpName", grp.name);
                const grpId = sessionStorage.getItem("hive_grpId");
                window.location.href = `t.grpviewing.html${grpId ? `?grpId=${grpId}` : ""}`;;
            });
        }
    } else {
        console.log("No groups found, showing empty state");
        groupsList.innerHTML = `
            <div class="empty-state">
                <img src="../assets/JoinGroup.png" class="empty-state-icon" alt="No groups">
                <h3>No Groups Found</h3>
                <p>You haven't joined or created any groups yet. Use "Join Groups" to get started!</p>
            </div>
        `;
    }
    
    // Update stat card
    const statCards = document.querySelectorAll(".stat-card h3");
    console.log("Found stat cards:", statCards.length);
    if (statCards[0]) {
        statCards[0].textContent = data.stats.groups;
        console.log("Set stat card to:", data.stats.groups);
    }
};

// Load on page start
loadDashbData();

// ─── Load sidebar profile data ──────────────────────────────────────────────────
const loadTeacherSidebarProfile = async () => {
    const supabase = window.hiveSupabase;
    if (!supabase) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData, error } = await supabase
            .from("USER")
            .select("userDisplayName, userEmail, avatarPath")
            .eq("userId", user.id)
            .maybeSingle();

        if (error || !userData) {
            console.log("No teacher profile found yet");
            return;
        }

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

        console.log("Teacher profile loaded:", userData);
    } catch (err) {
        console.error("Error loading teacher profile:", err);
    }
};

loadTeacherSidebarProfile();

// ─── Join Group ───────────────────────────────────────────────────────────────
const joinGroupModal = document.querySelector("#joinGroupModal");
const openJoinGroupModalBtn = document.querySelector("#openJoinGroupModal");
const discardJoinGroupBtn = document.querySelector("#discardJoinGroup");
const joinGroupBtn = document.querySelector("#joinGroupBtn");
const groupLinkInput = document.querySelector("#groupLinkInput");

const updateJoinGroupState = () => {
    if (!joinGroupBtn) return;
    joinGroupBtn.disabled = !(groupLinkInput && groupLinkInput.value.trim().length > 0);
};

const closeJoinGroupModal = () => {
    if (!joinGroupModal) return;
    joinGroupModal.classList.remove("open");
    joinGroupModal.setAttribute("aria-hidden", "true");
};

const openJoinGroupModalFn = () => {
    if (!joinGroupModal) return;
    joinGroupModal.classList.add("open");
    joinGroupModal.setAttribute("aria-hidden", "false");
    if (groupLinkInput) { groupLinkInput.value = ""; groupLinkInput.focus(); }
    updateJoinGroupState();
};

if (openJoinGroupModalBtn) openJoinGroupModalBtn.addEventListener("click", openJoinGroupModalFn);
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
                if (!supabase) { alert("Cannot connect to database."); return; }

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

                if (!grpId || isNaN(grpId)) { alert("Invalid group link. Please enter a valid invite link or numeric group ID."); return; }

                const { data: { user }, error: userErr } = await supabase.auth.getUser();
                if (!user || userErr) { alert("You must be logged in."); return; }

                // Verify user exists in USER table
                const { data: userExists, error: userCheckErr } = await supabase
                    .from("USER")
                    .select("userId")
                    .eq("userId", user.id)
                    .maybeSingle();
                
                console.log("User check in USER table:", userExists, "Error:", userCheckErr);
                
                if (!userExists) {
                    console.error("User not found in USER table. Please complete your profile first.");
                    alert("Please complete your profile setup first before joining groups. Go to 'Manage Profile'.");
                    return;
                }

                const { data: grp, error: grpErr } = await supabase
                    .from("GROUP").select("grpId, grpName").eq("grpId", grpId).maybeSingle();
                if (grpErr || !grp) { alert("Group not found. Check the invite link and try again."); return; }

                const { data: existing } = await supabase
                    .from("GROUPMEMBER").select("grpmemId").eq("userId", user.id).eq("grpId", grpId).maybeSingle();
                if (existing) { alert("You are already a member of this group."); closeJoinGroupModal(); return; }

                // List all available roles for debugging
                const { data: allRoles } = await supabase.from("ROLE").select("roleId, roleName");
                console.log("Available roles in database:", allRoles);

                // Check if group already has a teacher
                const { data: teacherRole, error: teacherRoleErr } = await supabase
                    .from("ROLE").select("roleId").eq("roleName", "Teacher").maybeSingle();
                
                console.log("Teacher role query result:", teacherRole, "Error:", teacherRoleErr);
                
                if (!teacherRole || !teacherRole.roleId) {
                    console.error("Teacher role not found in ROLE table");
                    alert("Teacher role not configured in the system. Please contact administrator.");
                    return;
                }
                
                if (teacherRole) {
                    const { data: existingTeacher, error: teacherCheckErr } = await supabase
                        .from("GROUPMEMBER")
                        .select("grpmemId")
                        .eq("grpId", grpId)
                        .eq("roleId", teacherRole.roleId)
                        .maybeSingle();
                    
                    console.log("Existing teacher check:", existingTeacher, "Error:", teacherCheckErr);
                    
                    if (existingTeacher) { 
                        alert("This group already has a teacher. You cannot join as it can only have one teacher."); 
                        closeJoinGroupModal(); 
                        return; 
                    }
                }

                // Join teacher to group with Teacher role
                console.log("Inserting teacher to group. userId:", user.id, "grpId:", grpId, "teacherRoleId:", teacherRole?.roleId);
                const { error: memErr } = await supabase
                    .from("GROUPMEMBER")
                    .insert({ userId: user.id, grpId: grpId, roleId: teacherRole.roleId });
                
                if (memErr) { 
                    console.error("Error inserting teacher to group:", memErr);
                    alert("Failed to join group: " + memErr.message); 
                    return; 
                }
                
                console.log("Successfully joined group as teacher");

                closeJoinGroupModal();
                await loadDashbData();
            },
            { title: "Join Group", confirmText: "Join", cancelText: "Cancel" }
        );
    });
}

updateJoinGroupState();

// Navigate to group view, passing grpId
const memberGroupCardLink = document.querySelector(".open-member-group-view");
if (memberGroupCardLink) {
    memberGroupCardLink.addEventListener("click", () => {
        const grpId = memberGroupCardLink.dataset.grpId
            || (dashbData.groups[0] ? dashbData.groups[0].grpId : null);
        if (grpId) sessionStorage.setItem("hive_grpId", String(grpId));
        window.location.href = `t.grpviewing.html${grpId ? `?grpId=${grpId}` : ""}`;
    });
    memberGroupCardLink.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); memberGroupCardLink.click(); }
    });
}

const notifBtns = document.querySelectorAll(".notif-btn, .notif-btn-mobile");
notifBtns.forEach((btn) => {
    btn.addEventListener("click", () => { window.location.href = "t.notification.html"; });
});

const logoutBtn = document.querySelector(".logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        showConfirmation(
            "Are you sure you want to log out?",
            () => { window.location.href = "../auth/log-sign.html"; },
            { title: "Log Out", confirmText: "Log Out", cancelText: "Cancel" }
        );
    });
}
