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
  const [showMoreOptions, setShowMoreOptions] = useState(false);
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
    setShowMoreOptions(false);
    onDelete(id);
  };

  const handleReschedule = (type: RescheduleType) => {
    setShowMenu(false);
    setShowMoreOptions(false);
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
            <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Quick Actions */}
              <div className="p-1.5">
                <button
                  onClick={() => handleReschedule('IN_1_HOUR')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <Timer size={14} className="text-blue-500" />
                  <span className="font-medium">In 1 Hour</span>
                </button>
                <button
                  onClick={() => handleReschedule('IN_1_DAY')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <FastForward size={14} className="text-purple-500" />
                  <span className="font-medium">Tomorrow</span>
                </button>
                
                {/* More Toggle */}
                <button
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <span className="font-medium">More</span>
                  <span className={cn(
                    "material-symbols-outlined !text-[14px] transition-transform",
                    showMoreOptions && "rotate-180"
                  )}>
                    expand_more
                  </span>
                </button>

                {/* Expandable More Options */}
                {showMoreOptions && (
                  <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-slate-100">
                    <button
                      onClick={() => handleReschedule('IN_3_HOURS')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <Clock size={12} className="text-indigo-400" />
                      <span>In 3 Hours</span>
                    </button>
                    <button
                      onClick={() => handleReschedule('IN_3_DAYS')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <FastForward size={12} className="text-violet-400" />
                      <span>In 3 Days</span>
                    </button>
                    <button
                      onClick={() => handleReschedule('IN_1_WEEK')}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <FastForward size={12} className="text-pink-400" />
                      <span>Next Week</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-100" />

              {/* Delete Action */}
              <div className="p-1.5">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                  <span className="font-medium">Delete Item</span>
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
