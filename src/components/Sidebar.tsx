import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { id: 'library', label: 'Library', icon: 'library_books', to: '/library' },
  { id: 'review', label: 'Review Session', icon: 'psychology', to: '/review' },
  { id: 'new', label: 'New Note', icon: 'add_circle', to: '/new' },
  { id: 'analytics', label: 'Analytics', icon: 'insights', to: '/analytics' },
  { id: 'settings', label: 'Settings', icon: 'settings', to: '/settings' },
];

import { useUser } from '../context/UserContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, profileImage, logout } = useUser();

  return (
    <aside className="h-screen w-64 border-r border-slate-100 fixed left-0 top-0 bg-white flex flex-col py-8 px-6 gap-y-1 z-50">
      {/* Logo Section */}
      <div className="px-6 mb-12 flex justify-center pt-1">
        <Link to="/dashboard" className="block w-full max-w-[180px]">
          <img 
            src="/images/logo_black.png" 
            alt="Echo Logo" 
            className="w-full h-auto object-contain"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.id === 'dashboard' && location.pathname === '/dashboard');
          return (
            <Link
              key={item.id}
              to={item.to}
              state={item.to === '/review' ? { from: location.pathname } : undefined}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative",
                isActive
                  ? "text-[#182442] bg-slate-50 font-bold"
                  : "text-slate-400 font-medium hover:bg-slate-50/50 hover:text-[#182442]"
              )}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#182442] rounded-r-full" />
              )}
              
              <span 
                className={cn(
                  "material-symbols-outlined !text-[20px] transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-[#182442]" : "text-slate-300 group-hover:text-[#182442]"
                )}
                style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
              >
                {item.icon}
              </span>
              <span className="text-[13px] tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="mt-auto pt-8 border-t border-slate-100">
        <div className="space-y-3">
          <Link to="/settings" className="flex items-center gap-3 px-2 w-full group">
            <div className="relative">
              {profileImage ? (
                <img 
                  alt="User avatar" 
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-100 shadow-sm transition-transform group-hover:scale-105" 
                  src={profileImage} 
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#182442] to-[#2a3a61] flex items-center justify-center text-white border border-slate-100 shadow-sm group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined !text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    person
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="text-left">
              <p className="font-bold text-[13px] text-[#182442] leading-tight">{userName}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Free Plan</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-slate-300 group-hover:text-[#182442] transition-colors">settings</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-[#182442] hover:bg-slate-50 transition-all"
          >
            <span className="material-symbols-outlined !text-[18px]">logout</span>
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
};
