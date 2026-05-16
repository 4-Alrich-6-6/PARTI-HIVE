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
    if (!supabase) return;

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (!user || userErr) return;

    const { data: memberships, error } = await supabase
        .from("GROUPMEMBER")
        .select("grpId, GROUP(grpId, grpName, grpSubject)")
        .eq("userId", user.id);

    if (error || !memberships) return;

    const groups = [];
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

        groups.push({
            grpId: grpId,
            name: grp.grpName || "Unnamed Group",
            subject: grp.grpSubject || "",
            members: (memberCount !== null && memberCount !== undefined) ? memberCount : 0
        });
    }

    dashbData = { groups, stats: { groups: groups.length } };
    applyDashbData(dashbData);
};

const applyDashbData = (data) => {
    // Teacher dashboard shows a single joined group card (.open-member-group-view)
    // If there are multiple groups, show the first one; else show empty state
    const joinedCard = document.querySelector(".open-member-group-view");
    if (joinedCard) {
        const h3 = joinedCard.querySelector(".group-info h3");
        const p = joinedCard.querySelector(".group-info p");
        const strong = joinedCard.querySelector(".card-right strong");
        if (data.groups && data.groups.length > 0) {
            const grp = data.groups[0];
            if (h3) h3.textContent = grp.name;
            if (p) p.textContent = grp.subject;
            if (strong) strong.textContent = `Occupied Members : ${grp.members}`;
            joinedCard.dataset.grpId = grp.grpId;
        } else {
            if (h3) h3.textContent = "No Group Yet";
            if (p) p.textContent = "Join a group to get started";
            if (strong) strong.textContent = "Occupied Members : 0";
        }
    }
    const statCards = document.querySelectorAll(".stat-card h3");
    if (statCards[0]) statCards[0].textContent = data.stats.groups;
};

// Load on page start
loadDashbData();

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

                const { data: grp, error: grpErr } = await supabase
                    .from("GROUP").select("grpId, grpName").eq("grpId", grpId).maybeSingle();
                if (grpErr || !grp) { alert("Group not found. Check the invite link and try again."); return; }

                const { data: existing } = await supabase
                    .from("GROUPMEMBER").select("grpmemId").eq("userId", user.id).eq("grpId", grpId).maybeSingle();
                if (existing) { alert("You are already a member of this group."); closeJoinGroupModal(); return; }

                const { data: memberRole } = await supabase
                    .from("ROLE").select("roleId").eq("roleName", "Member").maybeSingle();

                const { error: memErr } = await supabase
                    .from("GROUPMEMBER")
                    .insert({ userId: user.id, grpId: grpId, roleId: memberRole?.roleId || null });
                if (memErr) { alert("Failed to join group: " + memErr.message); return; }

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
        window.location.href = "t.grpviewing.html";
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
