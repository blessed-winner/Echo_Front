import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Clock, Trash2, Calendar, CalendarClock } from 'lucide-react';
import { cn, stripHtml } from '../lib/utils';

interface ReviewCardProps {
  id: number;
  title: string;
  deck: string;
  due: string;
  type: string;
  priority: 'CRITICAL' | 'MEDIUM' | 'LOW';
  onDelete: (id: number) => void;
  onReschedule: (id: number, type: 'POSTPONE' | 'ADVANCE') => void;
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

  const handlePostpone = () => {
    setShowMenu(false);
    onReschedule(id, 'POSTPONE');
  };

  const handleAdvance = () => {
    setShowMenu(false);
    onReschedule(id, 'ADVANCE');
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
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={handlePostpone}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <Calendar size={16} className="text-slate-400" />
                <span className="font-medium">Postpone 1 day</span>
              </button>
              <button
                onClick={handleAdvance}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
              >
                <CalendarClock size={16} className="text-slate-400" />
                <span className="font-medium">Review earlier</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-slate-100"
              >
                <Trash2 size={16} />
                <span className="font-medium">Delete item</span>
              </button>
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
