import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: 'REMINDER' | 'MEMORY_REVIEW' | 'DEADLINE' | 'SYSTEM';
  read: boolean;
  createdAt: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, page]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ content: NotificationDto[]; last: boolean }>(
        `/notifications?page=${page}&size=10`
      );
      
      if (page === 0) {
        setNotifications(response.data.content);
      } else {
        setNotifications(prev => [...prev, ...response.data.content]);
      }
      
      setHasMore(!response.data.last);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type: NotificationDto['type']) => {
    switch (type) {
      case 'REMINDER':
        return 'schedule';
      case 'MEMORY_REVIEW':
        return 'psychology';
      case 'DEADLINE':
        return 'event';
      case 'SYSTEM':
        return 'info';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationDto['type']) => {
    switch (type) {
      case 'REMINDER':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'MEMORY_REVIEW':
        return 'bg-[#ecfdf5] text-[#3c6752] border-[#3c6752]/10';
      case 'DEADLINE':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'SYSTEM':
        return 'bg-slate-50 text-slate-600 border-slate-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-20 right-6 w-[420px] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-[#182442] font-manrope">Notifications</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {notifications.filter(n => !n.read).length} unread
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all group"
              >
                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 !text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && page === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-[#182442] rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Loading notifications...</p>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <span className="material-symbols-outlined text-slate-300 !text-[64px] mb-4">
                    notifications_off
                  </span>
                  <h4 className="text-base font-bold text-slate-700 mb-2">All caught up!</h4>
                  <p className="text-sm text-slate-500 text-center">
                    You don't have any notifications right now.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'p-4 hover:bg-slate-50 transition-all cursor-pointer relative group',
                        !notification.read && 'bg-blue-50/30'
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border',
                            getNotificationColor(notification.type)
                          )}
                        >
                          <span className="material-symbols-outlined !text-[20px]">
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-bold text-[#182442] leading-tight">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Load More */}
              {hasMore && !isLoading && notifications.length > 0 && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    className="text-xs font-bold text-[#182442] hover:underline"
                  >
                    Load more
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
