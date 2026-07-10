'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSupabase } from './SupabaseContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { supabase, isAuthenticated } = useSupabase();
  const [permission, setPermission] = useState('default');
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      const enabled = localStorage.getItem('notifications_enabled') === 'true';
      setIsNotificationsEnabled(enabled);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notification");
      return false;
    }

    if (Notification.permission === 'granted') {
      setIsNotificationsEnabled(true);
      localStorage.setItem('notifications_enabled', 'true');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      if (permission === 'granted') {
        setIsNotificationsEnabled(true);
        localStorage.setItem('notifications_enabled', 'true');
        return true;
      }
    }
    
    return false;
  };

  const disableNotifications = () => {
    setIsNotificationsEnabled(false);
    localStorage.setItem('notifications_enabled', 'false');
  };

  const showNotification = (title, options = {}) => {
    if (isNotificationsEnabled && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isNotificationsEnabled || Notification.permission !== 'granted') return;

    // Background loop to check for reminders every hour
    const checkReminders = async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Check Uncompleted Routines
      if (today.getHours() >= 18) { // Only remind in the evening
        const { data: routines } = await supabase.from('routines').select('*');
        if (routines) {
          const incomplete = routines.filter(r => {
            const lastCompletedStr = r.last_completed_at ? new Date(r.last_completed_at).toISOString().split('T')[0] : null;
            return lastCompletedStr !== todayStr;
          });
          
          if (incomplete.length > 0) {
            showNotification('Incomplete Routines!', {
              body: `You have ${incomplete.length} routine(s) left to complete today. Keep your streak alive!`,
            });
          }
        }
      }

      // Check Upcoming Bills (Due in next 3 days)
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 3);
      const { data: bills } = await supabase.from('bills')
        .select('*')
        .eq('is_paid', false)
        .lte('due_date', futureDate.toISOString())
        .order('due_date', { ascending: true });
        
      if (bills && bills.length > 0) {
        showNotification('Upcoming Bills!', {
          body: `You have ${bills.length} bill(s) due soon. Next: ${bills[0].name} (₹${bills[0].amount})`,
        });
      }
    };

    // Run check immediately on mount, then every 4 hours
    checkReminders();
    const interval = setInterval(checkReminders, 4 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, isNotificationsEnabled, supabase]);

  return (
    <NotificationContext.Provider value={{ permission, isNotificationsEnabled, requestPermission, disableNotifications, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
