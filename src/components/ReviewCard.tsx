import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Clock, Trash2, FastForward, Timer } from 'lucide-react';
import { cn, stripHtml } from '../lib/utils';

type RescheduleType = 'IN_1_HOUR' | 'IN_3_HOURS' | 'IN_1_DAY' | 'IN_3_DAYS' | 'IN_1_WEEK';

interface ReviewCardProps {
  id: number;
  title: string;
  deck: string;
  due: string;
  type: string;
  priority: 'CRITICAL' | 'MEDIUM' | 'LOW';
  onDelete: (id: number) => void;
  onReschedule: (id: number, type: RescheduleType) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ 
  id, 
  title, 
  deck, 
  due, 
  type, 
  priority,
  onDelete,
  onReschedule
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const priorityStyles = {
    CRITICAL: "badge-critical",
    MEDIUM: "badge-medium",
    LOW: "badge-low"
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleDelete = () => {
    setShowMenu(false);
    onDelete(id);
  };

  const handleReschedule = (type: RescheduleType) => {
    setShowMenu(false);
    onReschedule(id, type);
  };

  return (
    <div className="echo-card flex flex-col gap-4 group relative">
      <div className="flex justify-between items-start">
        <span className={cn(
          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
          priorityStyles[priority]
        )}>
          {priority}
        </span>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-slate-300 hover:text-[#182442] hover:bg-slate-50 rounded-lg p-1.5 transition-all active:scale-95"
          >
            <MoreHorizontal size={18} />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Quick Reschedule Section */}
              <div className="p-2">
                <div className="px-3 py-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Quick Reschedule
                  </p>
                </div>
                <button
                  onClick={() => handleReschedule('IN_1_HOUR')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Timer size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold block">In 1 Hour</span>
                    <span className="text-[10px] text-slate-500">Quick snooze</span>
                  </div>
                </button>
                <button
                  onClick={() => handleReschedule('IN_3_HOURS')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Clock size={14} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold block">In 3 Hours</span>
                    <span className="text-[10px] text-slate-500">Later today</span>
                  </div>
                </button>
              </div>

              <div className="h-px bg-slate-100 my-1" />

              {/* Long Term Reschedule */}
              <div className="p-2">
                <div className="px-3 py-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Postpone
                  </p>
                </div>
                <button
                  onClick={() => handleReschedule('IN_1_DAY')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <FastForward size={14} className="text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold block">Tomorrow</span>
                    <span className="text-[10px] text-slate-500">+1 day</span>
                  </div>
                </button>
                <button
                  onClick={() => handleReschedule('IN_3_DAYS')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <FastForward size={14} className="text-violet-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold block">In 3 Days</span>
                    <span className="text-[10px] text-slate-500">Weekend break</span>
                  </div>
                </button>
                <button
                  onClick={() => handleReschedule('IN_1_WEEK')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                    <FastForward size={14} className="text-pink-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold block">Next Week</span>
                    <span className="text-[10px] text-slate-500">+7 days</span>
                  </div>
                </button>
              </div>

              <div className="h-px bg-slate-100 my-1" />

              {/* Delete Action */}
              <div className="p-2">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <Trash2 size={14} className="text-red-600" />
                  </div>
                  <span className="font-semibold">Delete Item</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1">
        <h4 className="font-bold text-text-primary text-lg leading-tight mb-2 group-hover:text-[#182442] transition-colors line-clamp-2">
          {stripHtml(title)}
        </h4>
        <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-text-secondary text-sm italic font-medium">
          Deck: {stripHtml(deck)}
        </p>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-[10px] font-bold text-text-secondary opacity-60 flex items-center gap-1 uppercase">
          <Clock size={12} /> {due}
        </span>
        <span style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-[10px] font-bold text-[#182442] uppercase tracking-widest">
          {type}
        </span>
      </div>
    </div>
  );
};
