const NOTIFICATIONS_STORAGE_KEY = "hive_notifications";

const DEFAULT_NOTIFICATIONS = [
    {
        id: "n1",
        title: "New Task Assigned",
        group: "Group Name",
        date: "2026-05-02",
        body: "You have been assigned a new task in the Research project. Please open the project breakdown and review the task details, due date, and description. Make sure to start working on it as soon as possible to avoid delays."
    },
    {
        id: "n2",
        title: "Task Verified",
        group: "Group Name",
        date: "2026-05-01",
        body: "Your submitted task has been verified by the leader and marked as Finished. Great work! Keep up the pace for the remaining tasks in this project."
    },
    {
        id: "n3",
        title: "Project Due Date Updated",
        group: "Group Name",
        date: "2026-04-30",
        body: "The leader has updated the due date for the Design project. Please check the new schedule and re-plan your tasks accordingly."
    },
    {
        id: "n4",
        title: "New Member Joined",
        group: "Group Name",
        date: "2026-04-28",
        body: "A new member has joined the group. Please welcome them and review the updated member list in Group Information."
    }
];

const loadNotifications = () => {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return DEFAULT_NOTIFICATIONS;
        }
    }
    return DEFAULT_NOTIFICATIONS;
};

const saveNotifications = (list) => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
};

const formatNotifDate = (iso) => {
    if (!iso) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [y, m, d] = iso.split("-");
    return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
};

const truncateBody = (text, max = 90) => {
    if (!text) return "";
    return text.length > max ? text.slice(0, max).trimEnd() + "..." : text;
};
