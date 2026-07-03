import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: 'REMINDER' | 'MEMORY_REVIEW' | 'DEADLINE' | 'SYSTEM' | 'RESCHEDULE';
  read: boolean;
  createdAt: string;
  referenceId?: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_META: Record<
  NotificationDto['type'],
  { icon: string; label: string; accent: string; iconBg: string; dot: string }
> = {
  MEMORY_REVIEW: {
    icon: 'psychology',
    label: 'Review',
    accent: 'text-[#3c6752]',
    iconBg: 'bg-[#ecfdf5] border-[#3c6752]/15',
    dot: 'bg-[#3c6752]',
  },
  REMINDER: {
    icon: 'schedule',
    label: 'Reminder',
    accent: 'text-[#1e40af]',
    iconBg: 'bg-blue-50 border-blue-100',
    dot: 'bg-blue-500',
  },
  DEADLINE: {
    icon: 'event',
    label: 'Deadline',
    accent: 'text-[#ba1a1a]',
    iconBg: 'bg-red-50 border-red-100',
    dot: 'bg-red-500',
  },
  RESCHEDULE: {
    icon: 'edit_calendar',
    label: 'Rescheduled',
    accent: 'text-amber-700',
    iconBg: 'bg-amber-50 border-amber-100',
    dot: 'bg-amber-500',
  },
  SYSTEM: {
    icon: 'info',
    label: 'System',
    accent: 'text-slate-500',
    iconBg: 'bg-slate-50 border-slate-100',
    dot: 'bg-slate-400',
  },
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours === 1) return '1h ago';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
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
      const data = response.data.content ?? [];
      if (page === 0) {
        setNotifications(data);
      } else {
        setNotifications(prev => [...(prev ?? []), ...data]);
      }
      setHasMore(!response.data.last);
    } catch {
      // silently fail – not critical
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const unreadCount = (notifications ?? []).filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="notification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            id="notification-panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-[4.75rem] right-6 w-[400px] max-h-[580px] z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-[#182442]/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#182442]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined !text-[18px] text-white"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    notifications
                  </span>
                </div>
                <div>
                  <h3
                    className="text-[13px] font-bold text-white leading-none"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Notifications
                  </h3>
                  <p className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wider font-bold">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>

              <button
                id="notification-close-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all group"
              >
                <span className="material-symbols-outlined !text-[17px] text-white/60 group-hover:text-white transition-colors">
                  close
                </span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-white">
              {isLoading && page === 0 ? (
                /* Loading skeleton */
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-0.5">
                        <div className="h-3 bg-slate-100 rounded-full w-3/4 animate-pulse" />
                        <div className="h-2.5 bg-slate-100 rounded-full w-full animate-pulse" />
                        <div className="h-2 bg-slate-100 rounded-full w-1/3 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (notifications ?? []).length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                    <span
                      className="material-symbols-outlined !text-[32px] text-slate-300"
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      notifications_off
                    </span>
                  </div>
                  <h4
                    className="text-sm font-bold text-[#182442] mb-1"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    You're all caught up!
                  </h4>
                  <p
                    className="text-xs text-slate-400 leading-relaxed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    No notifications right now. We'll let you know when something needs your attention.
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {(notifications ?? []).map((n, idx) => {
                    const meta = TYPE_META[n.type];
                    const isClickable = n.type === 'MEMORY_REVIEW';

                    return (
                      <motion.div
                        key={n.id}
                        id={`notification-item-${n.id}`}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.22 }}
                        onClick={() => {
                          markAsRead(n.id);
                          if (isClickable) {
                            onClose();
                            navigate('/review');
                          }
                        }}
                        className={cn(
                          'group relative flex items-start gap-3 px-4 py-3.5 transition-all duration-200',
                          isClickable ? 'cursor-pointer hover:bg-slate-50/80' : 'cursor-default',
                          !n.read && 'bg-[#f8faff]'
                        )}
                      >
                        {/* Unread indicator strip */}
                        {!n.read && (
                          <div className={cn('absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full', meta.dot)} />
                        )}

                        {/* Icon */}
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border',
                            meta.iconBg
                          )}
                        >
                          <span
                            className={cn('material-symbols-outlined !text-[18px]', meta.accent)}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {meta.icon}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md',
                                meta.iconBg,
                                meta.accent
                              )}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider ml-auto">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>

                          <h4
                            className="text-[13px] font-bold text-[#182442] leading-tight truncate"
                            style={{ fontFamily: "'Manrope', sans-serif" }}
                          >
                            {n.title}
                          </h4>
                          <p
                            className="text-xs text-slate-500 leading-relaxed mt-0.5 line-clamp-2"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {n.message}
                          </p>

                          {isClickable && (
                            <div
                              className={cn(
                                'flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity',
                                meta.accent
                              )}
                            >
                              <span className="text-[10px] font-bold">Start review</span>
                              <span className="material-symbols-outlined !text-[12px]">arrow_forward</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Load more */}
                  {hasMore && !isLoading && (
                    <div className="px-4 py-3 border-t border-slate-50">
                      <button
                        onClick={() => setPage(prev => prev + 1)}
                        className="w-full py-2 rounded-xl text-[11px] font-bold text-[#182442]/60 hover:text-[#182442] hover:bg-slate-50 transition-all uppercase tracking-wider"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
