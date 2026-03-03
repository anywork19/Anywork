import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Calendar, CreditCard, MessageCircle, Star } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const NOTIFICATION_ICONS = {
  booking_confirmed: Calendar,
  new_booking: Calendar,
  payment_released: CreditCard,
  new_message: MessageCircle,
  new_review: Star,
  default: Bell
};

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.getNotifications();
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.notification_id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all read:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        data-testid="notification-bell"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-[#0F172A]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs text-[#0052CC] hover:underline"
                data-testid="mark-all-read"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-sm text-[#64748B]">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const IconComponent = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
                return (
                  <div
                    key={notification.notification_id}
                    className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    data-testid={`notification-${notification.notification_id}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'payment_released' ? 'bg-green-100' :
                        notification.type === 'new_booking' ? 'bg-blue-100' :
                        'bg-slate-100'
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          notification.type === 'payment_released' ? 'text-green-600' :
                          notification.type === 'new_booking' ? 'text-blue-600' :
                          'text-slate-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#0F172A]">{notification.title}</p>
                        <p className="text-xs text-[#64748B] truncate">{notification.message}</p>
                        <p className="text-xs text-[#94A3B8] mt-1">{formatTime(notification.created_at)}</p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkRead(notification.notification_id)}
                          className="text-[#94A3B8] hover:text-[#0052CC] p-1"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 10 && (
            <div className="p-3 text-center border-t border-slate-100">
              <a href="/notifications" className="text-sm text-[#0052CC] hover:underline">
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
