import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [{ data: list }, { data: count }] = await Promise.all([
      api.get('/notifications'),
      api.get('/notifications/unread-count'),
    ]);
    setNotifications(list.notifications);
    setUnreadCount(count.count);
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, refresh]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    const onNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
      setToast(notification);
    };

    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [user]);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const dismissToast = () => setToast(null);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead, toast, dismissToast }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
