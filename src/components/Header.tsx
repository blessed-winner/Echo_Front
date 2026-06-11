import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { api } from '../lib/api';
import { NotificationPanel } from './NotificationPanel';

interface UserAnalyticsDto {
  currentStreak: number;
}

export const Header: React.FC = () => {
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { accessToken, isAuthLoading } = useUser();
  const [streak, setStreak] = useState(0);
  const [isLoadingStreak, setIsLoadingStreak] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadStreak = async () => {
      if (isAuthLoading) {
        return;
      }

      if (!accessToken) {
        setIsLoadingStreak(false);
        return;
      }

      setIsLoadingStreak(true);

      try {
        const response = await api.get<UserAnalyticsDto>('/analytics/me');
        
        if (isMounted) {
          setStreak(response.data.currentStreak ?? 0);
        }
      } catch (error) {
        console.error('Failed to load streak data:', error);
      } finally {
        if (isMounted) {
          setIsLoadingStreak(false);
        }
      }
    };

    void loadStreak();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading]);

  // Load unread notification count
  useEffect(() => {
    let isMounted = true;

    const loadUnreadCount = async () => {
      if (!accessToken || isAuthLoading) {
        return;
      }

      try {
        const response = await api.get<number>('/notifications/unread-count');
        if (isMounted) {
          setUnreadCount(response.data);
        }
      } catch (error) {
        console.error('Failed to load unread count:', error);
      }
    };

    void loadUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [accessToken, isAuthLoading]);

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/70 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-10 h-16 sm:h-20 ml-64 transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 flex-1 min-w-0 overflow-hidden">
        {/* Date Display */}
        <div className="hidden lg:flex flex-col text-left flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Today</p>
          <p className="text-sm font-bold text-[#182442] leading-none">{currentDate}</p>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xs lg:max-w-md min-w-0">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#182442] transition-colors !text-lg sm:!text-xl">search</span>
            <input 
              ref={searchInputRef}
              className="w-full bg-slate-50/80 border border-slate-200/50 rounded-xl sm:rounded-2xl py-2 sm:py-2.5 pl-10 sm:pl-12 pr-16 sm:pr-20 text-xs sm:text-sm focus:bg-white focus:ring-8 focus:ring-[#182442]/5 focus:border-[#182442] outline-none transition-all placeholder:text-slate-400 font-medium shadow-inner truncate" 
              placeholder="Search..." 
              type="text"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 hidden sm:flex gap-1 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-400">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-400">K</kbd>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
        {/* Quick Review Button */}
        <Link
          to="/review"
          state={{ from: location.pathname }}
          className="hidden md:flex items-center gap-2 bg-[#182442] text-white px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl text-xs font-bold hover:shadow-xl hover:shadow-[#182442]/20 transition-all active:scale-95 group whitespace-nowrap"
        >
          <span className="material-symbols-outlined !text-[18px] group-hover:rotate-12 transition-transform">psychology</span>
          <span className="hidden lg:inline">Quick Review</span>
          <span className="inline lg:hidden">Review</span>
        </Link>

        {/* Notifications */}
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl sm:rounded-2xl text-slate-400 hover:bg-white hover:text-[#182442] hover:shadow-xl hover:shadow-black/5 transition-all relative group border border-transparent hover:border-slate-100/50 flex-shrink-0"
        >
          <span className="material-symbols-outlined !text-[20px] sm:!text-[22px] group-hover:rotate-[15deg] transition-transform duration-300">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-[7px] right-[7px] sm:top-[9px] sm:right-[9px] flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white"></span>
            </span>
          )}
        </button>

        <NotificationPanel 
          isOpen={showNotifications} 
          onClose={() => setShowNotifications(false)} 
        />

        <div className="w-px h-5 sm:h-6 bg-slate-200 mx-0.5 sm:mx-1 hidden sm:block"></div>

        {/* User Status / Streak */}
        <button className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 pl-1 pr-1 sm:pr-2 py-1.5 rounded-xl hover:bg-slate-50 transition-all group flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#182442]/5 flex items-center justify-center text-[#182442] border border-[#182442]/10 shadow-sm flex-shrink-0">
             <span className="material-symbols-outlined !text-[17px] sm:!text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          </div>
          <div className="text-left hidden lg:block">
            {isLoadingStreak ? (
              <p className="text-[9px] font-bold text-[#182442] uppercase tracking-[0.2em] leading-none animate-pulse">
                …
              </p>
            ) : (
              <p className="text-[9px] font-bold text-[#182442] uppercase tracking-[0.2em] leading-none whitespace-nowrap">
                {streak > 0
                  ? `${streak} Day${streak === 1 ? '' : 's'} Streak`
                  : 'Start Today'}
              </p>
            )}
          </div>
        </button>
      </div>
    </header>
  );
};
