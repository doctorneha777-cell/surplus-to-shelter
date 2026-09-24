import React, { useEffect, useState } from 'react';
import NotificationItem from '../components/NotificationItem';
import { AppNotification, fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notifications';

const NotificationPage: React.FC = () => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      setItems(await fetchNotifications());
      setError('');
    } catch {
      setError('Notifications are temporarily unavailable.');
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const markRead = async (item: AppNotification) => {
    await markNotificationRead(item.id);
    await refresh();
  };

  const markAll = async () => {
    await markAllNotificationsRead();
    await refresh();
  };

  return (
    <main className="notification-page">
      <header className="notification-page-header">
        <div><p className="eyebrow">SURPLUS-TO-SHELTER / OPERATIONS</p><h1>Notification center</h1><p className="muted">Time-sensitive rescue events for the active role.</p></div>
        <button type="button" className="notification-mark-all" onClick={() => void markAll()}>Mark all read</button>
      </header>
      {error && <p className="error-banner">{error}</p>}
      <section className="notification-page-list">
        {items.length === 0 ? <p className="notification-empty">No notifications yet.</p> : items.map((item) => <NotificationItem key={item.id} item={item} onRead={(value) => void markRead(value)} />)}
      </section>
    </main>
  );
};

export default NotificationPage;
