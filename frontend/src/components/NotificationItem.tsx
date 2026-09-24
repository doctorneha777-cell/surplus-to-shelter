import React from 'react';
import { AppNotification } from '../services/notifications';

const NotificationItem: React.FC<{ item: AppNotification; onRead: (item: AppNotification) => void }> = ({ item, onRead }) => {
  const relatedPath = item.related_pickup_id || item.pickup_id ? '/driver' : '/notifications';
  const age = Math.max(0, Math.round((Date.now() - new Date(item.created_at).getTime()) / 60000));
  const timestamp = age < 1 ? 'just now' : age < 60 ? `${age} min ago` : `${Math.round(age / 60)} hr ago`;

  return (
    <article className={`notification-item ${item.is_read ? 'read' : 'unread'} priority-${item.priority.toLowerCase()}`}>
      <div className="notification-marker" aria-hidden="true">{item.priority === 'URGENT' ? '!' : item.priority === 'SUCCESS' ? '+' : 'i'}</div>
      <div className="notification-copy">
        <div className="notification-meta"><span>{item.notification_type.replaceAll('_', ' ')}</span><time dateTime={item.created_at}>{timestamp}</time></div>
        <h3>{item.title}</h3>
        <p>{item.message}</p>
        <div className="notification-actions">
          <a href={relatedPath} onClick={() => { if (!item.is_read) onRead(item); }}>Open related rescue</a>
          {!item.is_read && <button type="button" onClick={() => onRead(item)}>Mark read</button>}
        </div>
      </div>
    </article>
  );
};

export default NotificationItem;
