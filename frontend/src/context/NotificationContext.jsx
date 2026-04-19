/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const savedPreference = localStorage.getItem("arenaiq_notifications");
    return savedPreference === null ? true : savedPreference === "true";
  });

  const toggleNotifications = () => {
    setNotificationsEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem("arenaiq_notifications", String(newValue));
      return newValue;
    });
  };

  return (
    <NotificationContext.Provider value={{ notificationsEnabled, toggleNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}
