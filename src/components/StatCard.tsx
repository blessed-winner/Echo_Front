import React from 'react';
import { cn, TOPIC_AVATAR_COLORS } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  progress?: number;
  className?: string;
  topicAvatars?: Array<{ name: string; color: string }>;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  progress, 
  className,
  topicAvatars
}) => {
  // Logic for icon backgrounds as per legacy design
  const iconConfig = title.includes("Review")
    ? { bg: "bg-slate-100", text: "text-[#182442]", bar: "bg-[#182442]" }
    : { bg: "bg-slate-100", text: "text-[#182442]", bar: "bg-[#182442]/60" };

  return (
    <div className={cn("echo-card flex flex-col gap-4", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconConfig.bg, iconConfig.text)}>
            <span className="material-symbols-outlined !text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {icon}
            </span>
          </div>
        )}
        <div>
          <p style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }} className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">{title}</p>
          <p className="font-bold text-text-primary text-lg leading-tight">{value}</p>
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-1000", iconConfig.bar)} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}

      {topicAvatars && topicAvatars.length > 0 && (
        <div className="flex -space-x-3 mt-1">
          {topicAvatars.slice(0, 3).map((topic, i) => {
            const colorClass = topic.color || TOPIC_AVATAR_COLORS[i % TOPIC_AVATAR_COLORS.length];
            const initial = topic.name.charAt(0).toUpperCase();
            
            return (
              <div 
                key={i} 
                className={cn(
                  "w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm",
                  colorClass
                )}
                title={topic.name}
              >
                {initial}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
