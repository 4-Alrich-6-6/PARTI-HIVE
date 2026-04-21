const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector("#sidebar");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}

const groupCardLink = document.querySelector(".open-group-view");

if (groupCardLink) {
    const openGroupView = () => {
        window.location.href = "s.leadergrpviewing.html";
    };

    groupCardLink.addEventListener("click", openGroupView);
    groupCardLink.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openGroupView();
        }
    });
}

const memberGroupCardLink = document.querySelector(".open-member-group-view");

if (memberGroupCardLink) {
    const openMemberGroupView = () => {
        window.location.href = "s.membergrpviewing.html";
    };

    memberGroupCardLink.addEventListener("click", openMemberGroupView);
    memberGroupCardLink.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMemberGroupView();
        }
    });
}
