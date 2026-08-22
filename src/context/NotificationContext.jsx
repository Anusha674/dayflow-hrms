import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '../db/storage';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const refreshNotifications = () => {
    if (currentUser) {
      const userNotifs = getUserNotifications(currentUser.id);
      setNotifications(userNotifs);
    } else {
      setNotifications([]);
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, [currentUser]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markRead = (notifId) => {
    markNotificationRead(notifId);
    refreshNotifications();
  };

  const markAllRead = () => {
    if (currentUser) {
      markAllNotificationsRead(currentUser.id);
      refreshNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        notifications,
        unreadCount,
        refreshNotifications,
        markRead,
        markAllRead
      }}
    >
      {children}
      {/* Global Toast Render Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="toast-close">
              &times;
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
