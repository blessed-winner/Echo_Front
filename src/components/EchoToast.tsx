import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export type EchoToastVariant = 'success' | 'error' | 'info';

interface EchoToastProps {
  message: string;
  variant?: EchoToastVariant;
  onDismiss: () => void;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const variantStyles: Record<EchoToastVariant, { accent: string; icon: string }> = {
  success: { accent: 'border-l-[#182442]', icon: 'check_circle' },
  error: { accent: 'border-l-[#ba1a1a]', icon: 'error' },
  info: { accent: 'border-l-[#182442]/40', icon: 'info' },
};

export const EchoToast: React.FC<EchoToastProps> = ({
  message,
  variant = 'info',
  onDismiss,
  action,
  className,
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-sm border-l-2 animate-in fade-in slide-in-from-top-1 duration-300',
        styles.accent,
        className
      )}
    >
      <span
        className="material-symbols-outlined !text-[17px] text-[#182442]/45 shrink-0"
        style={{ fontVariationSettings: "'FILL' 0" }}
      >
        {styles.icon}
      </span>
      <p
        style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}
        className="flex-1 text-sm text-[#182442]/85 leading-snug"
      >
        {message}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-[11px] font-bold uppercase tracking-wider text-[#182442]/70 hover:text-[#182442] shrink-0"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded-lg text-slate-400 hover:text-[#182442] hover:bg-slate-50 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};
