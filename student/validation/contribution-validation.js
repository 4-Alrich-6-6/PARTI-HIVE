// mock data only; replace with supabase queries later
const contributions = [
    {
        id: 1,
        memberName: "Astra Jellyfish",
        taskTitle: "Landing Page Wireframe",
        taskDescription: "Created the first version of the HIVE landing page layout and button flow.",
        proofLink: "https://www.figma.com/",
        memberRemarks: "Included desktop and mobile frames.",
        leaderRemarks: "Proof is complete and matches the assigned task.",
        teacherRemarks: "Looks acceptable for the current milestone.",
        completedTasks: 4,
        totalTasks: 5,
        leaderConfirmed: true,
        status: "APPROVED",
        peerYes: 2,
        peerTotal: 3,
    },
    {
        id: 2,
        memberName: "Demo Member",
        taskTitle: "Dashboard Task Cards",
        taskDescription: "Prepared placeholder task cards and status labels for the project breakdown.",
        proofLink: "https://drive.google.com/",
        memberRemarks: "Ready for leader review.",
        leaderRemarks: "",
        teacherRemarks: "",
        completedTasks: 2,
        totalTasks: 4,
        leaderConfirmed: false,
        status: "PENDING",
        peerYes: 2,
        peerTotal: 3,
    },
];

const statusLabels = {
    PENDING: "PENDING",
    LEADER_CONFIRMED: "LEADER_CONFIRMED",
    APPROVED: "APPROVED",
    NEEDS_REVISION: "NEEDS_REVISION",
    REJECTED: "REJECTED",
};

const contributionForm = document.querySelector("#contributionForm");
const submissionList = document.querySelector("#submissionList");
const leaderList = document.querySelector("#leaderList");
const teacherList = document.querySelector("#teacherList");
const submittedSectionTitle = document.querySelector("#submittedSectionTitle");
const pendingCount = document.querySelector("#pendingCount");
const confirmedCount = document.querySelector("#confirmedCount");
const approvedCount = document.querySelector("#approvedCount");
const peerCountText = document.querySelector("#peerCountText");
const peerToggleBtn = document.querySelector("#peerToggleBtn");
const peerModalOverlay = document.querySelector("#peerModalOverlay");
const peerCloseBtn = document.querySelector("#peerCloseBtn");
const peerSaveBtn = document.querySelector("#peerSaveBtn");
const peerChecklist = document.querySelector("#peerChecklist");
const backToProjectBtn = document.querySelector("#backToProjectBtn");
const groupInfoLink = document.querySelector("#groupInfoLink");
const projectBreakdownLink = document.querySelector("#projectBreakdownLink");

let supportingPeerVotes = 2;
const supportingPeerTotal = 3;

const mode = new URLSearchParams(window.location.search).get("mode") || "member";
document.body.dataset.mode = mode;
if (submittedSectionTitle && mode === "teacher") {
    submittedSectionTitle.textContent = "Proofs for Review";
}

// role-aware placeholder links
if (mode === "leader") {
    if (backToProjectBtn) backToProjectBtn.href = "../leader/s.leaderprojectbreakdown.html";
    if (projectBreakdownLink) projectBreakdownLink.href = "../leader/s.leaderprojectbreakdown.html";
    if (groupInfoLink) groupInfoLink.href = "../leader/s.leadergrpviewing.html";
} else if (mode === "teacher") {
    if (backToProjectBtn) backToProjectBtn.href = "../../teacher/t.projectbreakdown.html";
    if (projectBreakdownLink) projectBreakdownLink.href = "../../teacher/t.projectbreakdown.html";
    if (groupInfoLink) groupInfoLink.href = "../../teacher/t.grpviewing.html";
} else {
    if (backToProjectBtn) backToProjectBtn.href = "../member/s.memberprojectbreakdown.html";
    if (projectBreakdownLink) projectBreakdownLink.href = "../member/s.memberprojectbreakdown.html";
    if (groupInfoLink) groupInfoLink.href = "../member/s.membergrpviewing.html";
}

const escapeHTML = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getStatusClass = (status) => `status-${String(status || "PENDING").toLowerCase().replaceAll("_", "-")}`;

// contribution fairness validation algorithm placeholder
const calculateContribution = (item) => {
    const completionRate = item.totalTasks > 0
        ? (item.completedTasks / item.totalTasks) * 100
        : 0;
    const leaderValidation = item.leaderConfirmed ? 100 : 0;
    const proofAttachment = item.proofLink ? 100 : 0;
    const teacherValidation = item.status === "APPROVED" ? 100 : 0;

    const score =
        (completionRate * 0.50) +
        (leaderValidation * 0.25) +
        (proofAttachment * 0.15) +
        (teacherValidation * 0.10);

    let classification = "Low Contributor";
    if (score >= 80) classification = "Active Contributor";
    else if (score >= 50) classification = "Moderate Contributor";

    return {
        score: Math.round(score),
        classification,
    };
};

const renderSummary = () => {
    if (pendingCount) pendingCount.textContent = contributions.filter((item) => item.status === "PENDING").length;
    if (confirmedCount) confirmedCount.textContent = contributions.filter((item) => item.status === "LEADER_CONFIRMED").length;
    if (approvedCount) approvedCount.textContent = contributions.filter((item) => item.status === "APPROVED").length;
};

const renderContributionCard = (item, options = {}) => {
    const score = calculateContribution(item);
    const remarksControls = options.controls ? `
        <div class="form-group">
            <label for="${options.type}Remarks${item.id}">${options.label}</label>
            <textarea id="${options.type}Remarks${item.id}" rows="3" data-remarks="${options.type}" data-id="${item.id}" placeholder="${options.placeholder}">${escapeHTML(options.value || "")}</textarea>
        </div>
        <div class="card-actions">
            ${options.buttons || ""}
        </div>
    ` : "";

    return `
        <article class="validation-card" data-id="${item.id}">
            <div class="card-topline">
                <div>
                    <h3>${escapeHTML(item.taskTitle)}</h3>
                    <p class="muted">${escapeHTML(item.memberName)}</p>
                </div>
                <span class="status-pill ${getStatusClass(item.status)}">${statusLabels[item.status] || item.status}</span>
            </div>
            <p>${escapeHTML(item.taskDescription)}</p>
            <p><strong>Proof:</strong> <a class="proof-link" href="${escapeHTML(item.proofLink)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.proofLink)}</a></p>
            <div class="meta-grid">
                <p><strong>Leader remarks:</strong> ${escapeHTML(item.leaderRemarks || "No remarks yet")}</p>
                <p><strong>Teacher remarks:</strong> ${escapeHTML(item.teacherRemarks || "No remarks yet")}</p>
                <p><strong>Completed tasks:</strong> ${item.completedTasks} / ${item.totalTasks}</p>
                <p><strong>Peer evidence:</strong> ${item.peerYes} out of ${item.peerTotal} members confirmed</p>
            </div>
            <div class="score-panel">
                <div class="score-box">
                    <span>Contribution Score</span>
                    <strong>${score.score}%</strong>
                </div>
                <div class="score-box">
                    <span>Contribution Status</span>
                    <strong>${score.classification}</strong>
                </div>
            </div>
            ${remarksControls}
        </article>
    `;
};

const renderSubmissions = () => {
    if (!submissionList) return;
    if (mode === "teacher") {
        submissionList.innerHTML = contributions
            .filter((item) => item.status === "LEADER_CONFIRMED" || item.status === "PENDING")
            .map((item) => renderContributionCard(item))
            .join("");
        return;
    }

    submissionList.innerHTML = contributions
        .map((item) => renderContributionCard(item))
        .join("");
};

const renderLeaderValidation = () => {
    if (!leaderList) return;
    if (mode === "member" || mode === "teacher") {
        leaderList.innerHTML = "";
        return;
    }

    leaderList.innerHTML = contributions
        .map((item) => renderContributionCard(item, {
            controls: true,
            type: "leader",
            label: "Leader remarks",
            placeholder: "Add leader validation notes",
            value: item.leaderRemarks,
            buttons: `
                <button class="modal-btn post-btn" type="button" data-action="leader-confirm" data-id="${item.id}">Confirm Contribution</button>
                <button class="modal-btn danger-btn" type="button" data-action="leader-reject" data-id="${item.id}">Reject Contribution</button>
            `,
        }))
        .join("");
};

const renderTeacherReview = () => {
    if (!teacherList) return;
    if (mode === "member" || mode === "leader") {
        teacherList.innerHTML = "";
        return;
    }

    teacherList.innerHTML = contributions
        .map((item) => renderContributionCard(item, {
            controls: true,
            type: "teacher",
            label: "Teacher remarks",
            placeholder: "Add teacher review notes",
            value: item.teacherRemarks,
            buttons: `
                <button class="modal-btn post-btn" type="button" data-action="teacher-approve" data-id="${item.id}">Approve</button>
                <button class="modal-btn post-btn" type="button" data-action="teacher-revision" data-id="${item.id}">Needs Revision</button>
                <button class="modal-btn danger-btn" type="button" data-action="teacher-reject" data-id="${item.id}">Reject</button>
            `,
        }))
        .join("");
};

const renderPeerEvidence = () => {
    if (peerCountText) peerCountText.textContent = `${supportingPeerVotes} out of ${supportingPeerTotal} members confirmed`;
};

const updatePeerVotesFromChecklist = () => {
    if (!peerChecklist) return;
    supportingPeerVotes = peerChecklist.querySelectorAll("input[type='checkbox']:checked").length;
    renderPeerEvidence();
};

const openPeerModal = () => {
    if (!peerModalOverlay) return;
    updatePeerVotesFromChecklist();
    peerModalOverlay.classList.add("open");
    peerModalOverlay.setAttribute("aria-hidden", "false");
};

const closePeerModal = () => {
    if (!peerModalOverlay) return;
    peerModalOverlay.classList.remove("open");
    peerModalOverlay.setAttribute("aria-hidden", "true");
};

const renderAll = () => {
    renderSummary();
    renderSubmissions();
    renderLeaderValidation();
    renderTeacherReview();
    renderPeerEvidence();
};

const findContribution = (id) => contributions.find((item) => item.id === Number(id));

const syncRemarksBeforeAction = (container) => {
    container.querySelectorAll("textarea[data-remarks]").forEach((textarea) => {
        const item = findContribution(textarea.dataset.id);
        if (!item) return;

        if (textarea.dataset.remarks === "leader") item.leaderRemarks = textarea.value.trim();
        if (textarea.dataset.remarks === "teacher") item.teacherRemarks = textarea.value.trim();
    });
};

if (contributionForm) {
    contributionForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const taskTitle = document.querySelector("#taskTitleInput")?.value.trim();
        const taskDescription = document.querySelector("#taskDescriptionInput")?.value.trim();
        const proofLink = document.querySelector("#proofLinkInput")?.value.trim();
        const memberRemarks = document.querySelector("#memberRemarksInput")?.value.trim();

        if (!proofLink) {
            alert("Please add a proof link before submitting.");
            return;
        }

        contributions.unshift({
            id: Date.now(),
            memberName: "Current Member",
            taskTitle,
            taskDescription,
            proofLink,
            memberRemarks,
            leaderRemarks: "",
            teacherRemarks: "",
            completedTasks: 1,
            totalTasks: 1,
            leaderConfirmed: false,
            status: "PENDING",
            peerYes: 2,
            peerTotal: 3,
        });

        contributionForm.reset();
        renderAll();
    });
}

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const item = findContribution(button.dataset.id);
    if (!item) return;

    syncRemarksBeforeAction(document);

    if (button.dataset.action === "leader-confirm") {
        item.leaderConfirmed = true;
        item.status = "LEADER_CONFIRMED";
    }

    if (button.dataset.action === "leader-reject") {
        item.leaderConfirmed = false;
        item.status = "REJECTED";
    }

    if (button.dataset.action === "teacher-approve") {
        item.status = "APPROVED";
    }

    if (button.dataset.action === "teacher-revision") {
        item.status = "NEEDS_REVISION";
    }

    if (button.dataset.action === "teacher-reject") {
        item.status = "REJECTED";
    }

    renderAll();
});

if (peerChecklist) peerChecklist.addEventListener("change", updatePeerVotesFromChecklist);
if (peerToggleBtn) peerToggleBtn.addEventListener("click", openPeerModal);
if (peerCloseBtn) peerCloseBtn.addEventListener("click", closePeerModal);
if (peerSaveBtn) peerSaveBtn.addEventListener("click", () => {
    updatePeerVotesFromChecklist();
    closePeerModal();
});
if (peerModalOverlay) {
    peerModalOverlay.addEventListener("click", (event) => {
        if (event.target === peerModalOverlay) closePeerModal();
    });
}

renderAll();
