export type NotificationPriority = 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT';

export type AppNotification = {
  id: number;
  recipient_user_id: number | null;
  pickup_id: number | null;
  notification_type: string;
  title: string;
  message: string;
  recipient_role: string;
  related_donation_id: number | null;
  related_match_id: number | null;
  related_pickup_id: number | null;
  priority: NotificationPriority;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

const API_BASE = 'http://localhost:8000';

export const fetchNotifications = async (role = 'driver'): Promise<AppNotification[]> => {
  const response = await fetch(`${API_BASE}/notifications?role=${role}`);
  if (!response.ok) throw new Error('Unable to load notifications.');
  return response.json();
};

export const fetchUnreadCount = async (role = 'driver'): Promise<number> => {
  const response = await fetch(`${API_BASE}/notifications/unread-count?role=${role}`);
  if (!response.ok) throw new Error('Unable to load unread count.');
  const data = (await response.json()) as { unread_count: number };
  return data.unread_count;
};

export const markNotificationRead = async (id: number, role = 'driver'): Promise<AppNotification> => {
  const response = await fetch(`${API_BASE}/notifications/${id}/read?role=${role}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Unable to mark notification as read.');
  return response.json();
};

export const markAllNotificationsRead = async (role = 'driver'): Promise<void> => {
  const response = await fetch(`${API_BASE}/notifications/mark-all-read?role=${role}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Unable to mark notifications as read.');
};
