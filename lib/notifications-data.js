const NOTIFICATIONS_STORAGE_KEY = "hive_notifications";

const DEFAULT_NOTIFICATIONS = [];

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
