import React, { useEffect, useState } from 'react';
import NotificationDropdown from './NotificationDropdown';
import { AppNotification, fetchNotifications, fetchUnreadCount } from '../services/notifications';

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [count, setCount] = useState(0);

  const refresh = async () => {
    try {
      const [nextItems, nextCount] = await Promise.all([fetchNotifications(), fetchUnreadCount()]);
      setItems(nextItems);
      setCount(nextCount);
    } catch {
      // The notification center should not block the primary rescue workflow.
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="notification-bell-wrap">
      <button type="button" className="notification-bell" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={`Notifications${count ? `, ${count} unread` : ''}`}>
        <span aria-hidden="true">Bell</span>{count > 0 && <strong>{count}</strong>}
      </button>
      {open && <NotificationDropdown items={items} onChange={() => void refresh()} onClose={() => setOpen(false)} />}
    </div>
  );
};

export default NotificationBell;
