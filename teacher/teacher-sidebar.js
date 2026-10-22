(() => {
  const routes = {
    Dashboard: "t.dashb.html",
    Teams: "t.team.html",
    Swarm: "t.team.html",
    Tasks: "t.tasklist.html",
    Notifications: "t.notification.html"
  };
  const labels = {
    Teams: "Your Teams",
    Swarm: "Your Teams",
    Tasks: "Pending Tasks"
  };

  document.querySelectorAll(".sidebar .side-nav-link[aria-label]").forEach((link) => {
    const label = link.getAttribute("aria-label");
    if (!label) return;

    if (link instanceof HTMLAnchorElement && routes[label]) {
      link.setAttribute("href", routes[label]);
    }

    const hasVisibleLabel = Array.from(link.children).some((child) =>
      child instanceof HTMLSpanElement
      && !child.classList.contains("notif-badge")
      && child.textContent.trim()
    );
    if (!hasVisibleLabel) link.dataset.sidebarLabel = labels[label] || label;
  });

  const sidebar = document.querySelector(".sidebar, .teacher-sidebar-profile");
  if (!sidebar) return;

  if (!sidebar.id) sidebar.id = "teacher-sidebar";

  const button = document.createElement("button");
  button.className = "teacher-sidebar-toggle";
  button.type = "button";
  button.setAttribute("aria-label", "Open navigation menu");
  button.setAttribute("aria-controls", sidebar.id);
  button.setAttribute("aria-expanded", "false");
  button.innerHTML = '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><clipPath id="hexClip"><polygon points="190,100 145,177.9 55,177.9 10,100 55,22.1 145,22.1"/></clipPath></defs><g clip-path="url(#hexClip)" fill="#000000"><rect x="0" y="30" width="200" height="24"/><rect x="0" y="88" width="200" height="24"/><rect x="0" y="146" width="200" height="24"/></g></svg>';

  const host = document.querySelector(".profile-row")
    || document.querySelector(".navbar")
    || document.querySelector(".topbar");
  if (host) {
    if (host.classList.contains("topbar") && host.querySelector("button")) {
      button.classList.add("teacher-sidebar-toggle-after-back");
    }
    host.prepend(button);
  }

  const closeSidebar = () => {
    sidebar.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation menu");
  };

  button.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  sidebar.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) closeSidebar();
  });

  document.addEventListener("click", (event) => {
    if (
      sidebar.classList.contains("open")
      && event.target instanceof Node
      && !sidebar.contains(event.target)
      && !button.contains(event.target)
    ) {
      closeSidebar();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 901px)").matches) closeSidebar();
  });
})();
