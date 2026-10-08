// src/components/admin/ConfirmDialog.tsx
import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-7 border border-[#E8DECB] shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDestructive ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="font-serif text-lg font-bold text-[#092218]">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close dialog"
            className="p-1 text-[#68756E] hover:text-[#1C1C1C] rounded-lg hover:bg-[#F7F1E5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-[#68756E] leading-relaxed space-y-3">
          <div>{message}</div>
          {children}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8DECB]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-lg border border-[#E8DECB] hover:bg-[#F7F1E5] text-xs font-bold uppercase tracking-wider text-[#1C1C1C] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer disabled:opacity-50 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 shadow-xs'
                : 'bg-[#123B2A] hover:bg-[#092218] shadow-xs'
            }`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
