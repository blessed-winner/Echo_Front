import React from 'react';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  isLoading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-[#182442]/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="bg-white rounded-[28px] w-full max-w-md p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100"
      >
        <h3
          id="confirm-dialog-title"
          className="text-xl font-bold text-[#182442] mb-2 font-manrope"
        >
          {title}
        </h3>
        <div
          style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}
          className="text-sm text-slate-500 leading-relaxed mb-8"
        >
          {description}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50',
              variant === 'danger'
                ? 'bg-[#ba1a1a] text-white hover:opacity-90 shadow-md shadow-[#ba1a1a]/15'
                : 'bg-[#182442] text-white hover:opacity-90 shadow-md shadow-[#182442]/20'
            )}
          >
            {isLoading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
