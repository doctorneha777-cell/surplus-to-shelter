import React from 'react';
import NotificationItem from './NotificationItem';
import { AppNotification, markNotificationRead, markAllNotificationsRead } from '../services/notifications';

const NotificationDropdown: React.FC<{ items: AppNotification[]; onChange: () => void; onClose: () => void }> = ({ items, onChange, onClose }) => {
  const unread = items.filter((item) => !item.is_read).length;
  const markRead = async (item: AppNotification) => {
    await markNotificationRead(item.id);
    onChange();
  };
  const markAll = async () => {
    await markAllNotificationsRead();
    onChange();
  };

  return (
    <section className="notification-dropdown" aria-label="Notifications">
      <header className="notification-dropdown-header">
        <div><p className="eyebrow">RESCUE NETWORK</p><h2>Notifications</h2></div>
        <button type="button" onClick={onClose} aria-label="Close notifications">Close</button>
      </header>
      <div className="notification-summary"><span>{unread} unread</span>{unread > 0 && <button type="button" onClick={() => void markAll()}>Mark all read</button>}</div>
      <div className="notification-list">
        {items.length === 0 ? <p className="notification-empty">No notifications yet.</p> : items.slice(0, 5).map((item) => <NotificationItem key={item.id} item={item} onRead={(value) => void markRead(value)} />)}
      </div>
      <a className="notification-view-all" href="/notifications">View notification center</a>
    </section>
  );
};

export default NotificationDropdown;
